import type { DealCard, DealColumn } from "@/models/sales";

/**
 * Seed data for the sales pipeline so the board is demonstrable without a
 * backend. Mirrors the column set from the library's sales-pipeline example.
 */

export const mockDealColumns: DealColumn[] = [
  { id: "lead", title: "Lead", order: 0, color: "#94a3b8" },
  { id: "qualified", title: "Qualified", order: 1, color: "#60a5fa" },
  { id: "proposal", title: "Proposal", order: 2, color: "#facc15" },
  { id: "negotiation", title: "Negotiation", order: 3, color: "#fb923c", cardLimit: 8 },
  { id: "won", title: "Won", order: 4, color: "#4ade80" },
  { id: "lost", title: "Lost", order: 5, color: "#f87171" },
];

const now = new Date().toISOString();

/**
 * One card per source so every badge and filter is exercised. Values are
 * illustrative — the real cards are written by the backend when a customer
 * completes a flow.
 */
export const mockDealCards: DealCard[] = [
  {
    id: "deal_01",
    title: "Northwind Energy — 120ha greenfield",
    columnId: "lead",
    order: 0,
    createdAt: now,
    updatedAt: now,
    source: "assessment",
    reference: "CP-ASM-4821",
    companyName: "Northwind Energy",
    contactName: "Jane Cooper",
    email: "jane@northwind.example",
    phone: "+1 555-0142",
    dealValueUsd: 4_820_000,
    submissionId: "asm_7f21c",
    highlights: [
      { label: "Viability", value: "78/100" },
      { label: "Capacity", value: "10-50 MW" },
      { label: "CapEx", value: "$42M" },
    ],
  },
  {
    id: "deal_02",
    title: "Helio Labs — 64× H100 training cluster",
    columnId: "qualified",
    order: 0,
    createdAt: now,
    updatedAt: now,
    source: "booking",
    reference: "CP-GPU-1190",
    companyName: "Helio Labs",
    contactName: "Marcus Reed",
    email: "marcus@heliolabs.example",
    dealValueUsd: 142_800,
    probability: 45,
    submissionId: "bkg_11a",
    highlights: [
      { label: "Hardware", value: "64× H100 SXM5" },
      { label: "Term", value: "1 year" },
      { label: "Monthly", value: "$142,800" },
    ],
  },
  {
    id: "deal_03",
    title: "Ridgeline Capital — CPT allocation",
    columnId: "proposal",
    order: 0,
    createdAt: now,
    updatedAt: now,
    source: "investment",
    reference: "CP-INV-2210",
    companyName: "Ridgeline Capital",
    contactName: "Amara Osei",
    email: "amara@ridgeline.example",
    dealValueUsd: 250_000,
    probability: 60,
    submissionId: "inv_44c",
    highlights: [
      { label: "Allocation", value: "125,000 CPT" },
      { label: "Objective", value: "Staking Yield" },
      { label: "KYC", value: "Approved" },
    ],
  },
  {
    id: "deal_04",
    title: "Meridian Build — 80MW campus",
    columnId: "negotiation",
    order: 0,
    createdAt: now,
    updatedAt: now,
    source: "hyperscale",
    reference: "CP-HYP-0302",
    companyName: "Meridian Build",
    contactName: "Tomás Ferreira",
    email: "tomas@meridian.example",
    phone: "+351 900 000 000",
    dealValueUsd: 252_500_000,
    probability: 70,
    closeDate: "2026-11-30",
    submissionId: "hyp_02b",
    highlights: [
      { label: "Stage", value: "Greenfield" },
      { label: "Capacity", value: "50 MW" },
      { label: "CapEx", value: "$252.5M" },
    ],
  },
  {
    id: "deal_05",
    title: "Kestrel AI — general enquiry",
    columnId: "lead",
    order: 1,
    createdAt: now,
    updatedAt: now,
    source: "lead_form",
    reference: "CP-LEAD-4417",
    companyName: "Kestrel AI",
    contactName: "Priya Nair",
    email: "priya@kestrel.example",
    highlights: [
      { label: "Interest", value: "GPU Renting" },
      { label: "Timeline", value: "0-1 month" },
      { label: "Budget", value: "$50k - $250k" },
    ],
  },
];
