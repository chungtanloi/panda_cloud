import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/services/config";

/**
 * Server-side **authentication** gate.
 *
 * HANDOFF § 5 recorded "No server middleware or server-component session gate
 * was added" as a known protection limitation. This closes that gap for
 * authentication only.
 *
 * It deliberately does **not** authorize. Roles come from
 * `GET /api/v1/auth/me`, which the gateway derives from active Convex
 * organization memberships; they are not claims on the Clerk JWT, so
 * middleware cannot evaluate them without inventing a source. Authorization
 * stays in `RoleGuard` after the profile loads, and the backend remains the
 * only real control (ROLE_PERMISSION_MATRIX § 14).
 *
 * Protected prefixes come from the route protection table in
 * `docs/CLERK_AUTH_DESIGN.md`. Public marketing, the anonymous Land Owner
 * assessment, and the flows whose auth timing is still NEEDS CLARIFICATION are
 * intentionally absent — this migration does not decide them.
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/sales(.*)",
  "/manager(.*)",
  "/admin(.*)",
  "/requests(.*)",
]);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
});

/**
 * Standalone development (mock adapter, no Clerk instance) has no session to
 * verify, so the middleware becomes a pass-through. `assertApiConfig()` makes
 * this unreachable whenever the HTTP adapter is selected.
 */
function passthrough(_request: NextRequest) {
  return NextResponse.next();
}

export default clerkEnabled ? withClerk : passthrough;

export const config = {
  matcher: [
    // Everything except Next internals and files with an extension.
    "/((?!_next|.*\\..*).*)",
  ],
};
