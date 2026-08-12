import type { LeadBudget, LeadInterest, LeadTimeline } from "@/models/lead";

/**
 * Submit Request content, transcribed from `Submit.png`.
 *
 * The same option lists drive the compact marketing form, so the two never
 * drift apart.
 */

export const LEAD_FORM = {
  badge: "GET STARTED",
  title: "Tell us what you're building",
  body: "Fill this out and our team will follow up within one business day.",
  submitLabel: "Submit Request",
  reassurance: "We reply within one business day. No marketing lists.",

  fields: {
    companyName: { label: "Company name", placeholder: "Acme AI" },
    contactName: { label: "Contact name", placeholder: "Jane Doe" },
    email: { label: "Email", placeholder: "jane@acme.ai" },
    phone: { label: "Phone", placeholder: "+1 555-000-0000" },
    interests: { label: "What are you interested in?" },
    gpuType: { label: "GPU type", placeholder: "Select a model…" },
    quantity: { label: "Quantity", placeholder: "e.g. 32" },
    timeline: { label: "Timeline" },
    budget: { label: "Budget" },
    location: { label: "Location preference", placeholder: "No preference" },
    useCase: { label: "Tell us about your use case", placeholder: "Training, inference, HPC…" },
  },
} as const;

export const LEAD_INTERESTS: readonly { value: LeadInterest; label: string }[] = [
  { value: "gpu_renting", label: "GPU Renting" },
  { value: "buy_gpu", label: "Buy GPU" },
  { value: "energy_land", label: "Energy & Land" },
  { value: "financing", label: "Financing" },
  { value: "infrastructure", label: "Infrastructure" },
];

export const LEAD_TIMELINES: readonly { value: LeadTimeline; label: string }[] = [
  { value: "0_1_month", label: "0-1 month" },
  { value: "1_3_months", label: "1-3 months" },
  { value: "3_6_months", label: "3-6 months" },
  { value: "6_plus_months", label: "6+ months" },
];

export const LEAD_BUDGETS: readonly { value: LeadBudget; label: string }[] = [
  { value: "under_50k", label: "Under $50k" },
  { value: "50k_250k", label: "$50k - $250k" },
  { value: "250k_1m", label: "$250k - $1M" },
  { value: "1m_5m", label: "$1M - $5M" },
  { value: "over_5m", label: "Over $5M" },
  { value: "undecided", label: "Undecided" },
];

export const LEAD_LOCATIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "No preference" },
  { value: "taiwan", label: "Taiwan" },
  { value: "united_states", label: "United States" },
  { value: "europe", label: "Europe" },
];
