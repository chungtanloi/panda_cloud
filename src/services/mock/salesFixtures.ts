import type { SalesCardDetailDto, SalesColumnDto } from "@/models/sales";

/**
 * Seed data for the sales pipeline so the board is demonstrable without a
 * backend. Mirrors the backend wire shapes exactly (`SalesColumnDto`,
 * `SalesCardDetailDto`) so the mock adapter exercises the same DTO boundary
 * as the real HTTP adapter.
 */

export const mockSalesColumns: SalesColumnDto[] = [
  { columnId: "col_new", code: "new", name: "New", position: 1, color: "#94a3b8", stageCategory: "open", isTerminal: false },
  { columnId: "col_contacted", code: "contacted", name: "Contacted", position: 2, color: "#7dd3fc", stageCategory: "open", isTerminal: false },
  { columnId: "col_qualified", code: "qualified", name: "Qualified", position: 3, color: "#60a5fa", stageCategory: "open", isTerminal: false },
  { columnId: "col_due_diligence", code: "due_diligence", name: "Due Diligence", position: 4, color: "#a78bfa", stageCategory: "open", isTerminal: false },
  { columnId: "col_evaluation", code: "evaluation", name: "Evaluation", position: 5, color: "#fbbf24", stageCategory: "open", isTerminal: false },
  { columnId: "col_proposal", code: "proposal", name: "Proposal", position: 6, color: "#facc15", stageCategory: "open", isTerminal: false },
  { columnId: "col_negotiation", code: "negotiation", name: "Negotiation", position: 7, color: "#fb923c", stageCategory: "open", isTerminal: false },
  { columnId: "col_won", code: "won", name: "Won", position: 8, color: "#4ade80", stageCategory: "won", isTerminal: true },
  { columnId: "col_lost", code: "lost", name: "Lost", position: 9, color: "#f87171", stageCategory: "lost", isTerminal: true },
  { columnId: "col_on_hold", code: "on_hold", name: "On Hold", position: 10, color: "#f59e0b", stageCategory: "paused", isTerminal: false },
];

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/**
 * Distinct company + contact per fixture so the board exercises the real
 * shapes: a normal reachable contact, a contact with only a phone, one with
 * only an email, a deal with no contact at all, and a `do_not_contact` record
 * whose details must render WITHOUT a call/email link (DEALFLOW § 5.1).
 */
const parties: Record<string, Pick<SalesCardDetailDto, "organizationId" | "organizationName" | "primaryContact">> = {
  deal_01: {
    organizationId: "org_northwind",
    organizationName: "Northwind Energy",
    primaryContact: { contactId: "ct_01", fullName: "Freya Lindqvist", jobTitle: "Head of Development", email: "freya@northwind.example", phone: "+46 8 555 0142", status: "active" },
  },
  deal_02: {
    organizationId: "org_helio",
    organizationName: "Helio Labs",
    primaryContact: { contactId: "ct_02", fullName: "Marcus Ihejirika", jobTitle: "VP Infrastructure", email: "marcus@heliolabs.example", phone: "+1 415 555 0117", status: "active" },
  },
  deal_03: {
    organizationId: "org_tessellate",
    organizationName: "Tessellate Capital",
    // Email only — the card must show one channel, not an empty phone slot.
    primaryContact: { contactId: "ct_03", fullName: "Priya Raghunathan", jobTitle: null, email: "p.raghunathan@tessellate.example", phone: null, status: "active" },
  },
  deal_04: {
    organizationId: "org_meridian",
    organizationName: "Meridian Build",
    // Phone only.
    primaryContact: { contactId: "ct_04", fullName: "Dieter Krause", jobTitle: "Project Director", email: null, phone: "+49 30 555 0188", status: "active" },
  },
  deal_05: {
    organizationId: "org_kestrel",
    organizationName: "Kestrel AI",
    // Inbound enquiry with nobody named yet.
    primaryContact: null,
  },
  deal_06: {
    organizationId: "org_aurora",
    organizationName: "Aurora Grid",
    primaryContact: { contactId: "ct_06", fullName: "Sofia Marchetti", jobTitle: "Community Lead", email: "sofia@auroragrid.example", phone: "+39 06 555 0163", status: "active" },
  },
  deal_07: {
    organizationId: "org_cobalt",
    organizationName: "Cobalt Works",
    // Opted out. Details still render; no tel:/mailto: link may be offered.
    primaryContact: { contactId: "ct_07", fullName: "Alan Whitfield", jobTitle: "COO", email: "alan@cobaltworks.example", phone: "+44 20 555 0129", status: "do_not_contact" },
  },
};

function card(dto: Omit<SalesCardDetailDto, "revision" | "updatedAt" | "createdAt" | "createdBy" | "archivedAt" | "description" | "lostReason" | "wonAt" | "projectId" | "organizationName" | "ownerName" | "primaryContact"> & Partial<SalesCardDetailDto>, revision = 1, updatedDaysAgo = 0): SalesCardDetailDto {
  return {
    description: null,
    lostReason: null,
    wonAt: null,
    projectId: null,
    archivedAt: null,
    createdAt: daysAgo(updatedDaysAgo + 12),
    createdBy: "user_staff_01",
    revision,
    updatedAt: daysAgo(updatedDaysAgo),
    organizationName: null,
    primaryContact: null,
    ...dto,
    // Mirrors the two seeded sales identities. Applied after `dto` so a
    // fixture never has to restate it, and after the spread so it wins.
    ownerName: dto.ownerName ?? (dto.ownerId === "user_sales_02" ? "Jonas Weber" : "Ada Mensah"),
    // Applied last: a fixture never has to restate the company and contact.
    ...(parties[dto.dealId] ?? {}),
  };
}

/**
 * One card per vertical so every badge and filter is exercised. Values are
 * illustrative — real cards are written by the backend when a customer
 * completes a flow.
 */
export const mockDealCards: SalesCardDetailDto[] = [
  card({
    dealId: "deal_01",
    title: "Northwind Energy — 120ha greenfield",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_01",
    columnId: "col_qualified",
    status: "open",
    vertical: "land",
    priority: "high",
    estimatedValueMinor: "482000000",
    currency: "USD",
    probabilityPercent: 40,
    expectedCloseDate: "2026-12-31",
    lastContactAt: daysAgo(2),
    lastContactMethod: "email",
    description: "Greenfield 120ha parcel with existing substation proximity.",
  }),
  card({
    dealId: "deal_02",
    title: "Helio Labs — 64× H100 training cluster",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_01",
    columnId: "col_negotiation",
    status: "open",
    vertical: "gpu",
    priority: "urgent",
    estimatedValueMinor: "14280000",
    currency: "USD",
    probabilityPercent: 60,
    expectedCloseDate: "2026-10-15",
    lastContactAt: daysAgo(1),
    lastContactMethod: "call",
    description: "Committed one-year H100 capacity, SLA tier enterprise.",
  }),
  card({
    dealId: "deal_03",
    title: "Ridgeline Capital — CPT allocation",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_02",
    columnId: "col_proposal",
    status: "open",
    vertical: "token",
    priority: "normal",
    estimatedValueMinor: "25000000",
    currency: "USD",
    probabilityPercent: 55,
    expectedCloseDate: "2026-11-30",
    lastContactAt: daysAgo(3),
    lastContactMethod: "meeting",
    description: "Institutional CPT allocation, staking yield objective.",
  }),
  card({
    dealId: "deal_04",
    title: "Meridian Build — 80MW campus",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_01",
    columnId: "col_due_diligence",
    status: "open",
    vertical: "hyperscale",
    priority: "high",
    estimatedValueMinor: "25250000000",
    currency: "USD",
    probabilityPercent: 30,
    expectedCloseDate: "2026-09-30",
    lastContactAt: daysAgo(5),
    lastContactMethod: "email",
    description: "Greenfield hyperscale campus, 50-200 MW grid tier.",
  }),
  card({
    dealId: "deal_05",
    title: "Kestrel AI — general enquiry",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_02",
    columnId: "col_new",
    status: "open",
    vertical: "gpu",
    priority: "low",
    estimatedValueMinor: null,
    currency: null,
    probabilityPercent: null,
    expectedCloseDate: null,
    lastContactAt: null,
    lastContactMethod: null,
    description: "Inbound enquiry, GPU renting interest.",
  }),
  card({
    dealId: "deal_06",
    title: "Aurora Grid — community PPA pilot",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_01",
    columnId: "col_won",
    status: "won",
    vertical: "land",
    priority: "high",
    estimatedValueMinor: "90000000",
    currency: "EUR",
    probabilityPercent: 100,
    expectedCloseDate: "2026-06-01",
    lastContactAt: daysAgo(20),
    lastContactMethod: "meeting",
    wonAt: daysAgo(20),
    projectId: "prj_aurora_01",
    description: "Won after successful site diligence.",
  }),
  card({
    dealId: "deal_07",
    title: "Cobalt Works — deferred cluster",
    organizationId: "org_mock_cloud_panda",
    ownerId: "user_sales_02",
    columnId: "col_on_hold",
    status: "on_hold",
    vertical: "gpu",
    priority: "normal",
    estimatedValueMinor: "45000000",
    currency: "USD",
    probabilityPercent: 20,
    expectedCloseDate: "2027-03-01",
    lastContactAt: daysAgo(12),
    lastContactMethod: "email",
    description: "Customer paused pending internal budget approval.",
  }),
];
