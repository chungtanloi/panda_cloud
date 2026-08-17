# Legal and Compliance frontend/backend requirements

Updated 2026-08-17 after reviewing the implemented KYC and NCNDA gateway handoffs.

## Implemented frontend surface

- KYC list/detail/create/update uses the deal-scoped gateway and preserves `expectedRevision`.
- NCNDA list/detail/update uses the deal-scoped gateway and now exposes a create form that sends the backend upsert contract.
- Both workspaces require an explicit `dealId` context; no unsupported global aggregation is invented.

## Backend dependencies still required

- Organization and contact lookup/search contracts for selectors. Until approved, the UI accepts identifiers and must not invent lookup endpoints.
- Document registration/upload-session contract before KYC or NCNDA attachment can become a complete upload flow. Attach APIs only link an existing document.
- A final role/workspace decision: the backend permits Manager/Admin KYC and NCNDA actions, while the current frontend workspace guard is role-specific (`legal`/`compliance`).
- Product decision on whether KYC/NCNDA are manually created by staff or automatically created during deal conversion. Current gateway contract is manual creation.

## Required state and error behavior

Frontend must preserve loading, empty, error, 401, 403, 404, 409 revision conflict, and validation states. Backend remains authoritative for authorization, active-NCNDA uniqueness, KYC status rules, and OCC.

## Explicit non-goals

No direct Convex calls, client-side authorization enforcement, fabricated provider verification, automatic document upload, or automatic case/agreement creation was added without a backend contract.
## Frontend implementation update (2026-08-17)

Implemented in the frontend:

- Deal-context inputs on the Legal Agreements and Compliance Cases list screens.
- NCNDA create form and lifecycle update with status/effective-date/revision guidance.
- NCNDA document-version attach/detach controls using registered document IDs.
- KYC document list, attach and detach controls using the implemented case-document routes.

The UI deliberately does not upload raw files through these forms. A document must be registered through the backend document flow and pass its malware gate before it can be attached.

## Backend dependencies still missing or requiring a decision

These items were verified against the backend routes and are not changed by this frontend task:

1. A browser-facing upload-session/signed-URL and finalize workflow is not exposed as a frontend-ready contract; the current document registration operation requires server-created storage metadata (bucket, objectPath, checksum and scan state).
2. Organization, contact, owner and deal lookup/list operations are not available to replace opaque ID fields in the create forms.
3. NCNDA e-signature/provider integration is outside the MVP; signedAt and countersignedAt remain manually tracked fields.
4. KYC provider automation and strict lifecycle transition rules are not implemented; the backend accepts status changes subject to validation and revision.
5. The backend currently permits multiple open KYC cases for one deal; product must decide whether the UI should designate one current case.
6. Backend role/workspace alignment remains required: NCNDA writes are legal/manager/admin and KYC writes are compliance/manager/admin.

No backend code, schema, authorization rule or API contract was modified.
