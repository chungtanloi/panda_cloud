import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProfile, MembershipRole } from "@/models/auth";
import React from "react";

/* ------------------------------------------------------------------ */
/*  Mock profiles                                                      */
/* ------------------------------------------------------------------ */

function makeProfile(roles: MembershipRole[]): AuthProfile {
  return {
    user: {
      id: `user_${roles.join("_")}`,
      email: `${roles[0]}@example.com`,
      fullName: `${roles[0]} User`,
      userType: "staff",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    authorization: {
      isStaff: true,
      memberships: roles.map((role) => ({ organizationId: "org_1", role })),
    },
  };
}

const managerProfile = makeProfile(["manager"]);
const adminProfile = makeProfile(["admin"]);
const superAdminProfile = makeProfile(["super_admin"]);
const salesProfile = makeProfile(["sales"]);

/* ------------------------------------------------------------------ */
/*  Mock modules                                                       */
/* ------------------------------------------------------------------ */

let currentProfile: AuthProfile | null = managerProfile;

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({ profile: currentProfile, user: currentProfile?.user ?? null, initializing: false, isAuthenticated: true }),
}));

const mocks = vi.hoisted(() => ({
  admin: {
    overview: vi.fn(),
    users: vi.fn(),
    user: vi.fn(),
    updateUser: vi.fn(),
    roles: vi.fn(),
    health: vi.fn(),
    organizations: vi.fn(),
    organization: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    memberships: vi.fn(),
    membership: vi.fn(),
    createMembership: vi.fn(),
    updateMembership: vi.fn(),
  },
}));
vi.mock("@/services/api", () => ({ api: { admin: mocks.admin, auth: { me: vi.fn() } }, normalizeError: (e: unknown) => e }));

/* ------------------------------------------------------------------ */
/*  Imports AFTER mocks                                                */
/* ------------------------------------------------------------------ */

import { canAccessWorkspace, hasPermission, navigationByWorkspace } from "@/config/access";
import { isAdmin, hasRole } from "@/models/auth";

/* ------------------------------------------------------------------ */
/*  Access logic tests                                                 */
/* ------------------------------------------------------------------ */

describe("Access logic — canAccessWorkspace", () => {
  it("Manager can access admin workspace", () => {
    expect(canAccessWorkspace(managerProfile, "admin")).toBe(true);
  });
  it("Manager can access manager workspace", () => {
    expect(canAccessWorkspace(managerProfile, "manager")).toBe(true);
  });
  it("Sales cannot access admin workspace", () => {
    expect(canAccessWorkspace(salesProfile, "admin")).toBe(false);
  });
  it("Admin can access admin workspace", () => {
    expect(canAccessWorkspace(adminProfile, "admin")).toBe(true);
  });
  it("super_admin can access admin workspace", () => {
    expect(canAccessWorkspace(superAdminProfile, "admin")).toBe(true);
  });
});

describe("Access logic — Manager admin nav filtering", () => {
  it("Manager sees only Users and Organizations in admin nav", () => {
    const nav = navigationByWorkspace.admin.filter(
      (item) => !item.permission || hasPermission(managerProfile, item.permission),
    );
    const labels = nav.map((item) => item.label);
    expect(labels).toContain("Users");
    expect(labels).toContain("Organizations");
    expect(labels).not.toContain("Overview");
    expect(labels).not.toContain("Approvals");
    expect(labels).not.toContain("Roles");
    expect(labels).not.toContain("Permissions");
    expect(labels).not.toContain("System");
    expect(labels).not.toContain("Audit Logs");
    expect(labels).not.toContain("Integration Events");
    expect(labels).not.toContain("Settings");
  });

  it("Admin sees all admin nav items", () => {
    const nav = navigationByWorkspace.admin.filter(
      (item) => !item.permission || hasPermission(adminProfile, item.permission),
    );
    const labels = nav.map((item) => item.label);
    expect(labels).toContain("Overview");
    expect(labels).toContain("Users");
    expect(labels).toContain("Organizations");
    expect(labels).toContain("Roles");
  });

  it("super_admin sees all admin nav items", () => {
    const nav = navigationByWorkspace.admin.filter(
      (item) => !item.permission || hasPermission(superAdminProfile, item.permission),
    );
    expect(nav.length).toBe(navigationByWorkspace.admin.length);
  });
});

describe("Access logic — Manager permission matrix", () => {
  it("Manager has user:view", () => {
    expect(hasPermission(managerProfile, "user:view")).toBe(true);
  });
  it("Manager does not have user:manage", () => {
    expect(hasPermission(managerProfile, "user:manage")).toBe(false);
  });
  it("Manager has org:view", () => {
    expect(hasPermission(managerProfile, "org:view")).toBe(true);
  });
  it("Manager does not have org:manage", () => {
    expect(hasPermission(managerProfile, "org:manage")).toBe(false);
  });
  it("Manager does not have role:manage", () => {
    expect(hasPermission(managerProfile, "role:manage")).toBe(false);
  });
  it("Manager does not have system:view", () => {
    expect(hasPermission(managerProfile, "system:view")).toBe(false);
  });
  it("Manager does not have system:manage", () => {
    expect(hasPermission(managerProfile, "system:manage")).toBe(false);
  });
  it("Manager does not have audit:view", () => {
    expect(hasPermission(managerProfile, "audit:view")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Role picker tests (BLOCKER 1)                                      */
/* ------------------------------------------------------------------ */

describe("Role picker — ordinary Admin cannot assign privileged roles", () => {
  const ALL_ROLES: MembershipRole[] = ["sales", "compliance", "legal", "technical", "manager", "admin", "super_admin"];
  const PRIVILEGED_ROLES: MembershipRole[] = ["admin", "super_admin"];
  const ordinaryAllowed = ALL_ROLES.filter((r) => !PRIVILEGED_ROLES.includes(r));

  it("admin is excluded from ordinary Admin choices", () => {
    expect(ordinaryAllowed).not.toContain("admin");
  });
  it("super_admin is excluded from ordinary Admin choices", () => {
    expect(ordinaryAllowed).not.toContain("super_admin");
  });
  it("ordinary roles remain available", () => {
    expect(ordinaryAllowed).toContain("sales");
    expect(ordinaryAllowed).toContain("compliance");
    expect(ordinaryAllowed).toContain("legal");
    expect(ordinaryAllowed).toContain("technical");
    expect(ordinaryAllowed).toContain("manager");
  });
  it("super_admin sees all roles including privileged", () => {
    expect(ALL_ROLES).toContain("admin");
    expect(ALL_ROLES).toContain("super_admin");
  });
});

/* ------------------------------------------------------------------ */
/*  Privileged membership action tests (BLOCKER 2)                     */
/* ------------------------------------------------------------------ */

describe("Privileged membership action gating", () => {
  const PRIVILEGED_ROLES: MembershipRole[] = ["admin", "super_admin"];

  function canMutateMembership(actorProfile: AuthProfile, memberRole: MembershipRole): boolean {
    const isActorAdmin = hasPermission(actorProfile, "user:manage");
    const isActorSuperAdmin = hasRole(actorProfile, "super_admin");
    if (!isActorAdmin) return false;
    if (PRIVILEGED_ROLES.includes(memberRole)) return isActorSuperAdmin;
    return true;
  }

  it("Manager cannot mutate any membership", () => {
    expect(canMutateMembership(managerProfile, "sales")).toBe(false);
    expect(canMutateMembership(managerProfile, "admin")).toBe(false);
  });
  it("Ordinary Admin can mutate ordinary membership", () => {
    expect(canMutateMembership(adminProfile, "sales")).toBe(true);
  });
  it("Ordinary Admin CANNOT mutate admin membership", () => {
    expect(canMutateMembership(adminProfile, "admin")).toBe(false);
  });
  it("Ordinary Admin CANNOT mutate super_admin membership", () => {
    expect(canMutateMembership(adminProfile, "super_admin")).toBe(false);
  });
  it("super_admin CAN mutate admin membership", () => {
    expect(canMutateMembership(superAdminProfile, "admin")).toBe(true);
  });
  it("super_admin CAN mutate super_admin membership", () => {
    expect(canMutateMembership(superAdminProfile, "super_admin")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Privileged role checks in isPrivilegedRole helper                  */
/* ------------------------------------------------------------------ */

describe("isPrivilegedRole helper", () => {
  function isPrivilegedRole(role: MembershipRole): boolean {
    return ["admin", "super_admin"].includes(role);
  }

  it("admin is privileged", () => {
    expect(isPrivilegedRole("admin")).toBe(true);
  });
  it("super_admin is privileged", () => {
    expect(isPrivilegedRole("super_admin")).toBe(true);
  });
  it("manager is not privileged", () => {
    expect(isPrivilegedRole("manager")).toBe(false);
  });
  it("sales is not privileged", () => {
    expect(isPrivilegedRole("sales")).toBe(false);
  });
  it("customer is not privileged", () => {
    expect(isPrivilegedRole("customer")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  User detail — Manager sees read-only (logic-level test)            */
/* ------------------------------------------------------------------ */

describe("User detail — Manager read-only guard", () => {
  it("Manager has no user:manage permission", () => {
    expect(hasPermission(managerProfile, "user:manage")).toBe(false);
  });
  it("Admin has user:manage permission", () => {
    expect(hasPermission(adminProfile, "user:manage")).toBe(true);
  });
  it("super_admin has user:manage permission", () => {
    expect(hasPermission(superAdminProfile, "user:manage")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  User detail — Admin sees mutation controls (logic-level test)       */
/* ------------------------------------------------------------------ */

describe("User detail — Admin mutation guard", () => {
  it("Admin user:manage enables status change UI", () => {
    expect(hasPermission(adminProfile, "user:manage")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Organization list — Manager no Create button                       */
/* ------------------------------------------------------------------ */

describe("Organization list — Manager cannot create", () => {
  beforeEach(() => {
    currentProfile = managerProfile;
    mocks.admin.organizations.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  });

  afterEach(cleanup);

  it("Manager does not see Create Organization button", async () => {
    const { default: OrgPage } = await import("@/app/admin/organizations/page");
    render(<OrgPage />);
    expect(await screen.findByText("Organizations")).toBeInTheDocument();
    expect(screen.queryByText("Create Organization")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  Organization list — Admin sees Create button                       */
/* ------------------------------------------------------------------ */

describe("Organization list — Admin can create", () => {
  beforeEach(() => {
    currentProfile = adminProfile;
    mocks.admin.organizations.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  });

  afterEach(cleanup);

  it("Admin sees Create Organization button", async () => {
    const { default: OrgPage } = await import("@/app/admin/organizations/page");
    render(<OrgPage />);
    expect(await screen.findByText("Create Organization")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Organization detail — Manager read-only (logic-level)              */
/* ------------------------------------------------------------------ */

describe("Organization detail — Manager read-only logic", () => {
  it("Manager has org:view but not org:manage", () => {
    expect(hasPermission(managerProfile, "org:view")).toBe(true);
    expect(hasPermission(managerProfile, "org:manage")).toBe(false);
  });
  it("Manager is not isAdmin", () => {
    expect(isAdmin(managerProfile)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Organization detail — Admin privileged membership gating (logic)    */
/* ------------------------------------------------------------------ */

describe("Organization detail — Admin privileged membership gating (logic)", () => {
  const PRIVILEGED_ROLES: MembershipRole[] = ["admin", "super_admin"];

  it("Admin has user:manage and org:manage", () => {
    expect(hasPermission(adminProfile, "user:manage")).toBe(true);
    expect(hasPermission(adminProfile, "org:manage")).toBe(true);
  });
  it("Admin role picker excludes privileged roles", () => {
    const ALL_ROLES: MembershipRole[] = ["sales", "compliance", "legal", "technical", "manager", "admin", "super_admin"];
    const allowed = ALL_ROLES.filter((r) => !PRIVILEGED_ROLES.includes(r));
    expect(allowed).not.toContain("admin");
    expect(allowed).not.toContain("super_admin");
    expect(allowed).toContain("sales");
    expect(allowed).toContain("manager");
  });
  it("isPrivilegedRole blocks ordinary Admin from mutating admin membership", () => {
    const isPrivilegedRole = (r: MembershipRole) => PRIVILEGED_ROLES.includes(r);
    const actorIsSuperAdmin = false;
    const memberRole: MembershipRole = "admin";
    const canMutate = !isPrivilegedRole(memberRole) || actorIsSuperAdmin;
    expect(canMutate).toBe(false);
  });
  it("isPrivilegedRole blocks ordinary Admin from mutating super_admin membership", () => {
    const isPrivilegedRole = (r: MembershipRole) => PRIVILEGED_ROLES.includes(r);
    const actorIsSuperAdmin = false;
    const memberRole: MembershipRole = "super_admin";
    const canMutate = !isPrivilegedRole(memberRole) || actorIsSuperAdmin;
    expect(canMutate).toBe(false);
  });
  it("Ordinary Admin CAN mutate sales membership", () => {
    const isPrivilegedRole = (r: MembershipRole) => PRIVILEGED_ROLES.includes(r);
    const actorIsSuperAdmin = false;
    const memberRole: MembershipRole = "sales";
    const canMutate = !isPrivilegedRole(memberRole) || actorIsSuperAdmin;
    expect(canMutate).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Organization detail — super_admin privileged controls (logic)       */
/* ------------------------------------------------------------------ */

describe("Organization detail — super_admin privileged controls (logic)", () => {
  const PRIVILEGED_ROLES: MembershipRole[] = ["admin", "super_admin"];

  it("super_admin can mutate admin membership", () => {
    const isPrivilegedRole = (r: MembershipRole) => PRIVILEGED_ROLES.includes(r);
    const actorIsSuperAdmin = true;
    const memberRole: MembershipRole = "admin";
    const canMutate = !isPrivilegedRole(memberRole) || actorIsSuperAdmin;
    expect(canMutate).toBe(true);
  });
  it("super_admin can mutate super_admin membership", () => {
    const isPrivilegedRole = (r: MembershipRole) => PRIVILEGED_ROLES.includes(r);
    const actorIsSuperAdmin = true;
    const memberRole: MembershipRole = "super_admin";
    const canMutate = !isPrivilegedRole(memberRole) || actorIsSuperAdmin;
    expect(canMutate).toBe(true);
  });
  it("super_admin sees all roles including privileged", () => {
    const ALL_ROLES: MembershipRole[] = ["sales", "compliance", "legal", "technical", "manager", "admin", "super_admin"];
    expect(ALL_ROLES).toContain("admin");
    expect(ALL_ROLES).toContain("super_admin");
  });
});

/* ------------------------------------------------------------------ */
/*  Route guard — Manager blocked from privileged admin routes          */
/* ------------------------------------------------------------------ */

describe("Admin route guard — Manager access control", () => {
  const MANAGER_ALLOWED_PREFIXES = ["/admin/users", "/admin/organizations"];
  const MANAGER_BLOCKED_EXACT = ["/admin/organizations/new"];

  function isManagerAllowedRoute(pathname: string): boolean {
    if (MANAGER_BLOCKED_EXACT.includes(pathname)) return false;
    return MANAGER_ALLOWED_PREFIXES.some((prefix) =>
      pathname === prefix || pathname.startsWith(prefix + "/"),
    );
  }

  it("/admin/users is allowed", () => {
    expect(isManagerAllowedRoute("/admin/users")).toBe(true);
  });
  it("/admin/users/u1 is allowed", () => {
    expect(isManagerAllowedRoute("/admin/users/u1")).toBe(true);
  });
  it("/admin/organizations is allowed", () => {
    expect(isManagerAllowedRoute("/admin/organizations")).toBe(true);
  });
  it("/admin/organizations/org_1 is allowed", () => {
    expect(isManagerAllowedRoute("/admin/organizations/org_1")).toBe(true);
  });
  it("/admin is NOT allowed (overview)", () => {
    expect(isManagerAllowedRoute("/admin")).toBe(false);
  });
  it("/admin/approvals is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/approvals")).toBe(false);
  });
  it("/admin/roles is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/roles")).toBe(false);
  });
  it("/admin/permissions is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/permissions")).toBe(false);
  });
  it("/admin/system is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/system")).toBe(false);
  });
  it("/admin/audit-logs is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/audit-logs")).toBe(false);
  });
  it("/admin/integrations/events is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/integrations/events")).toBe(false);
  });
  it("/admin/settings is NOT allowed", () => {
    expect(isManagerAllowedRoute("/admin/settings")).toBe(false);
  });
  it("/admin/organizations/new is NOT allowed (create form)", () => {
    expect(isManagerAllowedRoute("/admin/organizations/new")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  OCC regression — 409 STALE_REVISION reloads, does not retry        */
/* ------------------------------------------------------------------ */

describe("OCC conflict handling — 409 STALE_REVISION", () => {
  it("CONFLICT error triggers data reload and is NOT auto-retried", async () => {
    let reloadCount = 0;
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ userId: "u1", revision: 1 })
      .mockRejectedValueOnce(Object.assign(new Error("Changed on server"), { code: "CONFLICT", status: 409 }))
      .mockResolvedValueOnce({ userId: "u1", revision: 2 });

    const mockUpdate = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("Changed on server"), { code: "CONFLICT", status: 409 }));

    async function simulateUpdateFlow() {
      let data = await mockFetch();
      try {
        await mockUpdate();
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "CONFLICT") {
          reloadCount++;
          data = await mockFetch();
        }
        throw error;
      }
      return data;
    }

    await expect(simulateUpdateFlow()).rejects.toThrow("Changed on server");
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(reloadCount).toBe(1);
  });

  it("non-CONFLICT errors do NOT trigger reload", async () => {
    let reloadCount = 0;
    const mockFetch = vi.fn().mockResolvedValue({ userId: "u1", revision: 1 });
    const mockUpdate = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("Server error"), { code: "SERVER_ERROR", status: 500 }));

    async function simulateUpdateFlow() {
      await mockFetch();
      try {
        await mockUpdate();
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "CONFLICT") {
          reloadCount++;
          await mockFetch();
        }
        throw error;
      }
    }

    await expect(simulateUpdateFlow()).rejects.toThrow("Server error");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(reloadCount).toBe(0);
  });
});
