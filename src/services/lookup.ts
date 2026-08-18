import { apiConfig } from "./config";
import { endpoints } from "./endpoints";
import { http } from "./http";
import {
  LOOKUP_DEFAULT_LIMIT,
  isLookupQueryReady,
  type ContactLookupItem,
  type ContactLookupQuery,
  type DealLookupItem,
  type DealLookupQuery,
  type LookupPage,
  type LookupQuery,
  type OrganizationLookupItem,
  type OwnerLookupItem,
} from "@/models/lookup";
import { mockDealCards } from "./mock/salesFixtures";

/**
 * Typeahead lookups.
 *
 * Kept out of `ApiClient` for the same reason `legalQueue` is: the operations
 * are new, the FE surface that consumes them is being built incrementally, and
 * folding them in is a single mechanical change once the screens settle. Both
 * adapters implement the whole port, no component calls `fetch`, and no URL is
 * written outside `services/endpoints.ts`.
 */
export interface LookupService {
  deals(query: DealLookupQuery): Promise<LookupPage<DealLookupItem>>;
  organizations(query: LookupQuery): Promise<LookupPage<OrganizationLookupItem>>;
  contacts(query: ContactLookupQuery): Promise<LookupPage<ContactLookupItem>>;
  owners(query: LookupQuery): Promise<LookupPage<OwnerLookupItem>>;
}

/* ------------------------------ HTTP adapter ------------------------------ */

const httpLookup: LookupService = {
  deals: (query) =>
    http.get<LookupPage<DealLookupItem>>(endpoints.lookups.deals, {
      query: { limit: LOOKUP_DEFAULT_LIMIT, ...query },
    }),
  organizations: (query) =>
    http.get<LookupPage<OrganizationLookupItem>>(endpoints.lookups.organizations, {
      query: { limit: LOOKUP_DEFAULT_LIMIT, ...query },
    }),
  contacts: (query) =>
    http.get<LookupPage<ContactLookupItem>>(endpoints.lookups.contacts, {
      query: { limit: LOOKUP_DEFAULT_LIMIT, ...query },
    }),
  owners: (query) =>
    http.get<LookupPage<OwnerLookupItem>>(endpoints.lookups.owners, {
      query: { limit: LOOKUP_DEFAULT_LIMIT, ...query },
    }),
};

/* ------------------------------ Mock adapter ------------------------------ */

const MOCK_LATENCY = 180;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY));

/**
 * The mock enforces the gateway's own guards rather than being permissive: a
 * query that passes here has to pass for real. `q` shorter than two characters
 * is a 400 on the wire, so it is an empty page here and the component must not
 * have asked.
 */
function match(haystack: string, q: string): boolean {
  return haystack.toLowerCase().includes(q.trim().toLowerCase());
}

function page<T>(items: readonly T[], limit?: number): LookupPage<T> {
  return {
    items: items.slice(0, limit ?? LOOKUP_DEFAULT_LIMIT),
    nextCursor: null,
    isDone: true,
  };
}

const MOCK_ORGANIZATIONS: readonly OrganizationLookupItem[] = [
  { organizationId: "org_northwind", displayName: "Northwind Energy", legalName: "Northwind Energy Ltd", organizationType: "customer", status: "active" },
  { organizationId: "org_helio", displayName: "Helio Labs", legalName: "Helio Labs Inc", organizationType: "customer", status: "active" },
  { organizationId: "org_meridian", displayName: "Meridian Build", legalName: null, organizationType: "customer", status: "prospect" },
  { organizationId: "org_tessellate", displayName: "Tessellate Capital", legalName: "Tessellate Capital LP", organizationType: "customer", status: "active" },
];

const MOCK_OWNERS: readonly OwnerLookupItem[] = [
  { userId: "user_sales_01", fullName: "Marcus Ilunga", email: "marcus@cloudpanda.example", role: "sales" },
  { userId: "user_sales_02", fullName: "Priya Raman", email: "priya@cloudpanda.example", role: "sales" },
  { userId: "user_manager_01", fullName: "Ada Okonkwo", email: "ada@cloudpanda.example", role: "manager" },
];

const MOCK_CONTACTS: readonly ContactLookupItem[] = [
  { contactId: "contact_northwind_01", organizationId: "org_northwind", fullName: "Erik Lindqvist", jobTitle: "Head of Infrastructure", email: "erik@northwind.example", status: "active" },
  { contactId: "contact_helio_01", organizationId: "org_helio", fullName: "Sofia Marques", jobTitle: "CTO", email: "sofia@helio.example", status: "active" },
  { contactId: "contact_meridian_01", organizationId: "org_meridian", fullName: "Daniel Achterberg", jobTitle: "Project Director", email: null, status: "active" },
];

const mockLookup: LookupService = {
  deals: async (query) => {
    await delay();
    if (!isLookupQueryReady(query.q)) return page<DealLookupItem>([]);
    const items = mockDealCards
      .filter((card) => match(card.title, query.q) || match(card.organizationName ?? "", query.q))
      .filter((card) => (query.status ? card.status === query.status : true))
      .filter((card) => (query.vertical ? card.vertical === query.vertical : true))
      .map<DealLookupItem>((card) => ({
        dealId: card.dealId,
        title: card.title,
        organizationId: card.organizationId,
        organizationName: card.organizationName ?? "—",
        status: card.status,
        stageId: card.columnId,
        vertical: card.vertical,
        ownerId: card.ownerId,
      }));
    return page(items, query.limit);
  },

  organizations: async (query) => {
    await delay();
    if (!isLookupQueryReady(query.q)) return page<OrganizationLookupItem>([]);
    return page(
      MOCK_ORGANIZATIONS.filter((org) => match(org.displayName, query.q)),
      query.limit,
    );
  },

  contacts: async (query) => {
    await delay();
    if (!isLookupQueryReady(query.q)) return page<ContactLookupItem>([]);
    return page(
      MOCK_CONTACTS.filter(
        (contact) =>
          contact.organizationId === query.organizationId && match(contact.fullName, query.q),
      ),
      query.limit,
    );
  },

  owners: async (query) => {
    await delay();
    if (!isLookupQueryReady(query.q)) return page<OwnerLookupItem>([]);
    return page(
      MOCK_OWNERS.filter((owner) => match(owner.fullName, query.q)),
      query.limit,
    );
  },
};

export const lookup: LookupService = apiConfig.adapter === "http" ? httpLookup : mockLookup;
