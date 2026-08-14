/**
 * Session bridge.
 *
 * Replaces `services/tokenStore.ts` (CR-003). Clerk owns the session and its
 * refresh; PandaCloud stores no token of its own
 * (collaboration workflow § 7.1, PHASE_1_FRONTEND_AUTH_HANDOFF).
 *
 * The HTTP client is a plain module, not a React hook, so a client component
 * (`components/auth/ClerkTokenBridge`) registers Clerk's `getToken` here once
 * and `services/http.ts` reads it. That keeps rule 1 of the architecture
 * intact: `services/http.ts` remains the only `fetch` call site, and no
 * component reaches for a token itself.
 *
 * The token MUST come from the normal session path — `getToken()` with **no**
 * custom JWT-template name. The PandaCloud API audience is configured on the
 * Clerk session token itself (PHASE_1_FRONTEND_AUTH_HANDOFF).
 */

type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;
let identityHint: string | null = null;

export const sessionBridge = {
  /**
   * Registers the session token source. Returns an unsubscribe function so the
   * bridge component can clean up on unmount.
   */
  registerTokenProvider(provider: TokenProvider): () => void {
    tokenProvider = provider;
    return () => {
      if (tokenProvider === provider) tokenProvider = null;
    };
  },

  /**
   * Current Clerk session JWT, or null when signed out or unconfigured.
   * Never throws — a failure to mint a token is an unauthenticated request,
   * and the gateway answers 401.
   */
  async getToken(): Promise<string | null> {
    if (!tokenProvider) return null;
    try {
      return await tokenProvider();
    } catch {
      return null;
    }
  },

  /**
   * Verified primary email of the signed-in Clerk identity.
   *
   * Used **only** by the mock adapter, which has no backend to ask and needs
   * an identity to shape its fixture — see the role-by-email-domain behaviour
   * documented in `docs/KANBAN_INTEGRATION.md` § "Testing without a backend".
   * The HTTP adapter never reads this: real authorization is resolved by the
   * gateway from the verified JWT subject.
   */
  setIdentityHint(email: string | null): void {
    identityHint = email;
  },

  getIdentityHint(): string | null {
    return identityHint;
  },
};
