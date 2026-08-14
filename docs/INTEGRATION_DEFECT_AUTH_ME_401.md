# Integration defect — `GET /api/v1/auth/me` returns 401 with a valid Clerk session

Filed per `frontend-backend-collaboration-workflow.md` § 18, which requires an
integration defect ticket to carry the environment, the contract version and the
correlation ID.

| Field | Value |
|---|---|
| Date | 2026-08-14 |
| Environment | Local — frontend `http://localhost:3000`, gateway `http://localhost:3001` |
| Contract version | `0.1.0-draft` (unpinned; no release exists) |
| Correlation ID | `04006722-5d32-41d3-939a-6f59b75d8f52` |
| Operation | `getAuthenticatedIdentity` — `GET /api/v1/auth/me` |
| Observed | `401 Unauthorized`, body `{"errorCode":"UNAUTHENTICATED", …}` |
| Expected | `200` with `AuthMeResponse`, or a status that identifies the real fault |
| Severity | **Blocker** — no authenticated screen can load |

> **Correction to the initial report.** The symptom was described as a 404. The
> captured response is **401 Unauthorized**. This matters: a 404 would mean the
> route is missing, a 401 means the route ran and refused the credential. The
> analysis below depends on it being 401.

---

## 1. What the captured headers prove

This is the most useful part of the evidence, because it eliminates most of the
usual suspects before any debugging starts.

| Observation in the capture | What it proves |
|---|---|
| `Access-Control-Allow-Origin: http://localhost:3000` is present on the response | `CLERK_AUTHORIZED_PARTIES` is set, parsed successfully, and **contains the frontend origin**. `applyCors` only emits this header when `allowedOrigins.includes(origin)`. |
| `X-Correlation-Id: 04006722-…` is echoed | The request reached `handleAuthMe` and returned through `errorResponse`. This is *our* handler answering, not Next.js or a proxy. |
| `Content-Type: application/json`, `Cache-Control: no-store` | Same conclusion — this is `jsonResponse()` from `src/http/responses.ts`. |
| The response is a clean 401, not a 500 | `readServerEnv()` **did not throw**. Every required backend variable is present and passed validation, including the ≥32-character `CONVEX_GATEWAY_SHARED_SECRET` and the `CONVEX_SITE_URL` origin check. |
| `Authorization: Bearer eyJhbGciOiJSUzI1NiIsImNhdCI6…` is present and well-formed | The frontend session bridge works. Clerk minted a token and `services/http.ts` attached it. **The browser side is not the problem.** |
| Request `Origin` and `Referer` are `http://localhost:3000` | The `azp` claim, if Clerk issued one, should be exactly this origin. |

### Therefore — ruled out

- CORS configuration.
- A missing or misspelled route (`/api/v1/auth/me` exists and executed).
- Missing backend environment variables (that path returns 500, not 401).
- `CONVEX_SITE_URL` pointing at a non-existent host, or the Convex HTTP actions
  not being deployed at all — both make `response.json()` fail, which throws
  `CONVEX_GATEWAY_RESPONSE_INVALID` and surfaces as **500**, not 401.
- The frontend not sending a token, or sending an empty one.
- A suspended or disabled PandaCloud user — that path returns **403**.

### Therefore — the fault is in exactly one of two places

```text
A. Clerk JWT verification inside ClerkIdentityProvider.authenticate()
   -> src/integrations/clerk.ts

B. The gateway -> Convex HMAC hop, whose 401 is then MIS-REPORTED as a Clerk
   authentication failure
   -> src/domain/errors.ts  (confirmed defect, section 2)
```

---

## 2. Confirmed code defect — a 401 from Convex is laundered into a Clerk 401

**This is a real bug, independent of whatever else is misconfigured.** It is the
reason the error message is misleading, and it may be the entire problem.

`convex/lib/gatewayAuth.ts` rejects an unauthenticated gateway call with:

```ts
return { ok: false, response: jsonError("GATEWAY_UNAUTHENTICATED", 401) };
```

`ConvexGatewayRepository.call()` in `src/integrations/convex.ts` turns that
envelope into a plain error whose message is the code:

```ts
throw new Error(safeGatewayErrorCode(envelope.errorCode)); // "GATEWAY_UNAUTHENTICATED"
```

`toApplicationError()` in `src/domain/errors.ts` then classifies it by
**substring match**:

```ts
const knownCodes = [
  { code: "UNAUTHENTICATED", status: 401 },
  …
];
const match = knownCodes.find(({ code }) => text.includes(code));
```

`"GATEWAY_UNAUTHENTICATED".includes("UNAUTHENTICATED")` is `true`.

### Consequence

A failure of the **internal, server-to-server HMAC hop** — which has nothing to
do with the end user's credential — is reported to the browser as
`401 UNAUTHENTICATED / "Authentication is required."`. The frontend then
correctly concludes "not signed in", clears the profile, and the user sees an
endless unauthenticated state while Clerk quite happily holds a valid session.

That matches the reported symptom exactly: *Clerk is holding the account but no
user comes back.*

### What makes the internal hop return 401

`authenticateGatewayRequest` returns `GATEWAY_UNAUTHENTICATED` when **any** of
these fail (`convex/lib/gatewayAuth.ts`):

1. `x-panda-gateway-signature` does not verify — i.e. `CONVEX_GATEWAY_SHARED_SECRET`
   in the Next.js `.env` **differs from the one set in the Convex deployment**.
   This is the single most likely misconfiguration: the value must be set twice,
   once in `.env` and once with `npx convex env set CONVEX_GATEWAY_SHARED_SECRET …`.
2. `Math.abs(Date.now() - timestamp) > 60_000` — more than 60 seconds of clock
   skew between the machine running Next.js and the Convex deployment. Common on
   a laptop that has resumed from sleep, or inside WSL/Docker with a drifted clock.
3. The request path does not match the expected path — only possible if the two
   `GATEWAY_PATHS` / `CONVEX_GATEWAY_PATHS` constant blocks have drifted apart.
4. `content-type` is not `application/json`.

Note that a **missing or too-short** secret on the Convex side returns
`GATEWAY_CONFIGURATION_ERROR` (503), which maps to 500 — so if you are seeing
401 rather than 500, the secret exists on both sides but the two values, or the
clocks, do not agree.

### Recommended patch (backend, `src/domain/errors.ts`)

Match on equality, not substring, and give the internal hop its own code:

```diff
 export type ApplicationErrorCode =
   | "UNAUTHENTICATED"
   | "FORBIDDEN"
   …
+  | "UPSTREAM_UNAVAILABLE"
   | "INTERNAL_ERROR";

 export function toApplicationError(error: unknown): ApplicationError {
   if (error instanceof ApplicationError) return error;

   const text = error instanceof Error ? error.message : String(error);
-  const knownCodes: Array<{ code: ApplicationErrorCode; status: number }> = [
-    { code: "UNAUTHENTICATED", status: 401 },
-    { code: "FORBIDDEN", status: 403 },
-    { code: "IDENTITY_EMAIL_REQUIRED", status: 409 },
-    { code: "IDENTITY_EMAIL_COLLISION", status: 409 },
-    { code: "IDENTITY_SUBJECT_COLLISION", status: 409 },
-  ];
-  const match = knownCodes.find(({ code }) => text.includes(code));
-  if (match) return new ApplicationError(match.code, safeMessage(match.code), match.status);
+  // Equality, not `includes`. `GATEWAY_UNAUTHENTICATED` from the internal
+  // Convex hop must never be reported to the browser as an end-user
+  // authentication failure — it is a server-side configuration fault.
+  const knownCodes: Record<string, { code: ApplicationErrorCode; status: number }> = {
+    UNAUTHENTICATED: { code: "UNAUTHENTICATED", status: 401 },
+    FORBIDDEN: { code: "FORBIDDEN", status: 403 },
+    IDENTITY_EMAIL_REQUIRED: { code: "IDENTITY_EMAIL_REQUIRED", status: 409 },
+    IDENTITY_EMAIL_COLLISION: { code: "IDENTITY_EMAIL_COLLISION", status: 409 },
+    IDENTITY_SUBJECT_COLLISION: { code: "IDENTITY_SUBJECT_COLLISION", status: 409 },
+  };
+  const match = knownCodes[text.trim()];
+  if (match) return new ApplicationError(match.code, safeMessage(match.code), match.status);
+
+  if (text.startsWith("GATEWAY_") || text.startsWith("CONVEX_GATEWAY_")) {
+    // Log `text` server-side; never return it.
+    return new ApplicationError(
+      "UPSTREAM_UNAVAILABLE",
+      "The identity service is temporarily unavailable.",
+      503,
+    );
+  }
   return new ApplicationError("INTERNAL_ERROR", "An unexpected server error occurred.", 500);
 }
```

⚠ This changes an error status on a documented operation. `auth-me.yaml`
currently declares 200/401/403/409/500. Adding 503 is a **contract change** and
needs FE + BE owner approval before the draft is frozen — do not tag a release
with it silently.

---

## 3. If it is not the internal hop — Clerk verification candidates

Ranked, each with a way to tell it apart.

### C1 — Frontend and backend are on different Clerk instances

The most common cause after a Clerk app is recreated or a second dev instance is
added. The JWT header in the capture is:

```json
{"alg":"RS256","cat":"cl_B7d4PD222AAA","kid":"ins_…"}
```

`kid` starts with `ins_`, which identifies the **instance** that signed the
token. If that instance is not the one behind `CLERK_SECRET_KEY`, JWKS lookup
finds no matching key and verification fails with no useful message.

**Check.** Decode the header of the token the browser actually sent:

```powershell
# PowerShell — paste the token between the quotes
$t = "eyJhbGciOi..."
$h = $t.Split('.')[0].Replace('-','+').Replace('_','/')
while ($h.Length % 4) { $h += '=' }
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($h))
```

```bash
# node
node -e "const t=process.argv[1];console.log(Buffer.from(t.split('.')[0],'base64url').toString())" "<token>"
```

Then decode the publishable key, which encodes the Frontend API host of the
instance the **browser** is using:

```bash
node -e "console.log(Buffer.from(process.argv[1].split('_')[2],'base64').toString())" "<NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY>"
```

That host must correspond to `CLERK_JWT_ISSUER_DOMAIN`, and `CLERK_SECRET_KEY`
must belong to the same instance.

### C2 — `CLERK_JWT_ISSUER_DOMAIN` does not match the token's `iss`

`ClerkIdentityProvider.authenticate()` re-checks the issuer itself, after Clerk's
own verification:

```ts
const issuer = String(auth.sessionClaims.iss).replace(/\/$/, "");
if (… issuer !== this.env.clerkJwtIssuerDomain …) throw 401;
```

Both sides strip one trailing slash, so a slash is not the risk — a **wrong
subdomain** is (`https://xxx.clerk.accounts.dev` vs the production
`https://clerk.yourdomain.com`).

**Check.** Decode the token *payload* (index `1` instead of `0` above) and
compare `iss` character by character with `CLERK_JWT_ISSUER_DOMAIN`.

### C3 — `CLERK_JWT_KEY` is set but wrong

`.env.example` ships this empty and notes that Clerk falls back to JWKS when it
is omitted. If someone pasted a PEM, and it is stale, from another instance, or
lost its newlines when written into `.env`, verification fails **and there is no
JWKS fallback**.

**Check.** Comment `CLERK_JWT_KEY` out entirely and retry. If it starts working,
that was it.

### C4 — the session token carries no `aud`, but the gateway demands one

`authenticate()` passes `audience: this.env.clerkJwtAudience` (`panda-cloud-api`).
`PHASE_1_FRONTEND_AUTH_HANDOFF.md` is explicit that this is a **Clerk Dashboard
setting**, not something the frontend can send:

> "The Clerk session-token configuration must include the PandaCloud API
> audience expected by the gateway."

This is open item **U-14** in `docs/CLERK_AUTH_DESIGN.md` — "Is the Clerk
instance provisioned; audience/authorized-parties agreed?" — and it was never
closed. If nobody added the `aud` claim in
*Clerk Dashboard → Sessions → Customize session token*, this is unresolved
configuration, exactly as predicted.

**Check.** Decode the payload and look for `"aud": "panda-cloud-api"`.

### C5 — the token carries no `azp`

Our own post-verification check is strict:

```ts
typeof authorizedParty !== "string" ||
!this.env.clerkAuthorizedParties.includes(authorizedParty)
```

Clerk includes `azp` when the token is minted from a browser with a known
origin, which is the case here — but if it is absent for any reason, this line
rejects an otherwise perfectly valid token.

**Check.** Decode the payload and confirm `azp === "http://localhost:3000"`
exactly (scheme and port included, no trailing slash).

---

## 4. The reason none of this is visible — and the first thing to fix

`safeMessage()` deliberately collapses every failure into
`"Authentication is required."`, and **nothing is logged server-side**. Not
leaking the reason to the client is correct. Discarding it entirely is not: it
makes a five-minute misconfiguration cost hours.

Add server-side-only structured logging before doing anything else. Suggested,
in `src/http/responses.ts`:

```ts
export function errorResponse(error: unknown, correlationId: string): Response {
  const applicationError = toApplicationError(error);
  // Server-side only. Never returned to the client.
  console.error(
    JSON.stringify({
      level: "error",
      correlationId,
      errorCode: applicationError.code,
      status: applicationError.status,
      cause: error instanceof Error ? error.message : String(error),
    }),
  );
  return jsonResponse({ errorCode: applicationError.code, message: applicationError.message, correlationId }, applicationError.status, correlationId);
}
```

With that in place, correlation ID `04006722-5d32-41d3-939a-6f59b75d8f52` would
have told you in one line whether the cause was
`GATEWAY_UNAUTHENTICATED` (section 2) or a Clerk verification failure
(section 3).

---

## 5. Diagnostic procedure — about ten minutes

Run in order and stop at the first step that answers the question.

1. **Look at the Convex deployment logs** (`npx convex dev`, or the Convex
   dashboard → Logs) while reproducing the request.
   - A `POST /internal/gateway/v1/identity/resolve` appears → **Clerk
     verification succeeded**. The fault is the HMAC hop → go to section 2.
   - Nothing appears → the request never left the Next.js gateway → **Clerk
     verification failed** → go to section 3.

   This single step splits the problem in half. Do it first.

2. Add the logging from section 4 and reproduce. Read the `cause` field.

3. If the cause is `GATEWAY_UNAUTHENTICATED`:
   - Compare the secrets byte for byte:
     ```bash
     npx convex env get CONVEX_GATEWAY_SHARED_SECRET
     ```
     against `CONVEX_GATEWAY_SHARED_SECRET` in the Next.js `.env`. Watch for a
     trailing newline, a quote, or a truncated paste.
   - Check clock skew: `w32tm /query /status` on Windows, or simply compare
     `Date.now()` in a Convex function against the local clock. The tolerance is
     **60 seconds**.

4. If nothing reached Convex, decode the JWT header and payload (commands in
   C1) and walk C1 → C5 in order.

5. Re-run and confirm `200` with an `AuthMeResponse` body containing
   `authorization.memberships`.

---

## 6. Expected result once authentication succeeds — read this before celebrating

A `200` will return:

```json
{
  "user": { "…": "…", "userType": "customer", "status": "active" },
  "authorization": { "isStaff": false, "memberships": [] }
}
```

`memberships` will be **empty** and `isStaff` will be **false**, for every
account, including yours.

That is not a second bug. It is open item **U-04** in
`docs/CLERK_AUTH_DESIGN.md`: the backend creates a new identity with
`userType: "customer"`, `status: "active"` and **no membership**, and there is
currently **no code path anywhere that creates an `organizations` row or an
`organizationMemberships` row**. There is no Clerk-organization webhook, no
membership mutation and no seed.

So after the 401 is fixed you will be able to sign in and reach `/dashboard`,
and you will still be refused by `/sales`, `/manager`, `/admin` and `/technical`.
Provisioning the first `cloud_panda` organization and its memberships is a
separate, unstarted piece of backend work.

---

## 7. Environment checklist

| Variable | Where | Must be |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | frontend `.env.local` | `pk_test_…` of the **same** Clerk instance as the backend secret |
| `NEXT_PUBLIC_API_BASE_URL` | frontend `.env.local` | `http://localhost:3001/api/v1` — must end in `/api/v1` |
| `NEXT_PUBLIC_API_ADAPTER` | frontend `.env.local` | `http` |
| `CLERK_SECRET_KEY` | backend `.env` | `sk_test_…` of the same instance |
| `CLERK_JWT_ISSUER_DOMAIN` | backend `.env` | exactly the token's `iss`, no trailing slash |
| `CLERK_JWT_AUDIENCE` | backend `.env` | must equal the `aud` configured on the Clerk session token (U-14) |
| `CLERK_AUTHORIZED_PARTIES` | backend `.env` | must include `http://localhost:3000` — **verified working** by the CORS header |
| `CLERK_JWT_KEY` | backend `.env` | leave **empty** unless you are certain (see C3) |
| `CONVEX_SITE_URL` | backend `.env` | the `.convex.site` HTTP-actions origin, **not** `.convex.cloud` |
| `CONVEX_GATEWAY_SHARED_SECRET` | backend `.env` **and** `npx convex env set` | the **same** ≥32-character value in both places |

---

## 8. Actions

| # | Action | Owner | Priority |
|---|---|---|---|
| 1 | Add server-side structured error logging (section 4) | BE | P0 |
| 2 | Run the section 5 procedure and record which branch it was | BE | P0 |
| 3 | Fix the `toApplicationError` substring collision (section 2) | BE | P0 — real defect regardless of the outcome of 2 |
| 4 | Close U-14: configure the session-token `aud` and confirm authorized parties in the Clerk Dashboard | FE owner + Clerk admin | P0 |
| 5 | Raise a Change Request if the new 503 status is adopted, before the contract is frozen | FE + BE owners | P1 |
| 6 | Close U-04: decide and build organization/membership provisioning | Product + BE | P1 — blocks every staff workspace |

## 9. Related documents

- `docs/CLERK_AUTH_DESIGN.md` — sections C, E and H (U-04, U-14)
- `PandaCloudBackend/docs/collaboration/PHASE_1_FRONTEND_AUTH_HANDOFF.md`
- `PandaCloudBackend/docs/collaboration/frontend-backend-collaboration-workflow.md` § 7.1, § 18
- `PandaCloudBackend/docs/architecture/DEALFLOW_MVP_DATABASE_DESIGN.md` § 9.1
