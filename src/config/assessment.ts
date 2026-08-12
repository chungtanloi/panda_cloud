/**
 * Land Owner Assessment content.
 *
 * Sources:
 *   intro    — screenshot of node 2:1152 (`Ownerland.png`)
 *   step 1   — screenshot of node 2:1325 (`step_1.png`)
 *   step 2   — screenshot of node 2:1207 (`capacary.png`)
 *   step 3   — Figma MCP export of node 2:1020 (authoritative, full fidelity)
 *   report   — screenshot of node 2:1545 (`Results.png`)
 *
 * ⚠ The flow is FIVE steps. Step 4 has no screenshot yet and the report screen
 * is labelled "STEP 5 OF 5". See ASSESSMENT_STEPS below.
 */

export const ASSESSMENT_INTRO = {
  badge: "Asset Owners",
  title: "Land Owner Assessment",
  body:
    "Discover the value of your land for an AI data center. Our proprietary analysis engine " +
    "evaluates power proximity, fiber infrastructure, and zoning viability instantly.",
  cards: [
    {
      title: "In 6 minutes",
      body: "Complete our streamlined intake form to initiate the evaluation process rapidly.",
    },
    {
      title: "Comprehensive analysis",
      body: "Cross-reference your parcel against grid capacity and dark fiber routing maps.",
    },
    {
      title: "Free PDF report",
      body: "Receive a detailed feasibility study and estimated lease valuation instantly.",
    },
  ],
  cta: { label: "START ASSESSMENT", href: "/assessment/land-profile" },
  footnote: "Secure connection established. No commitment required.",
} as const;

/**
 * Route order for the wizard. Step 4 is intentionally absent from the routes
 * until its design is available — the progress indicator still reports "of 5"
 * so the numbering matches the design rather than silently becoming 4 steps.
 */
export const ASSESSMENT_STEPS = [
  { id: "land-profile", label: "Land Profile", eyebrow: "Initial Assessment", step: 1 },
  { id: "power-capacity", label: "Power Capacity", eyebrow: "Assessment Phase", step: 2 },
  { id: "energy-source", label: "Energy Mix & PPA", eyebrow: "Infrastructure Assessment", step: 3 },
  { id: "facilities", label: "Facilities & Fiber", eyebrow: "Site Readiness", step: 4 },
] as const;

/* -------------------------------- Step 4 -------------------------------- */

/**
 * Facilities & Infrastructure.
 *
 * ⚠ Built from the written system report, not from a Figma export — no
 * screenshot of this screen was available. Fields and outputs match the report
 * ("building sqft/classification; dark fiber proximity" → "readiness, density,
 * PUE, network capacity"); the layout follows the step-2 pattern so it sits
 * consistently with the rest of the flow. Reconcile when the design arrives.
 */
export const STEP_FACILITIES = {
  eyebrow: "SITE READINESS",
  title: "Facilities & Infrastructure",
  percentLabel: "80%",
  cardTitle: "Facility Parameters",
  sqft: {
    label: "Building Footprint",
    placeholder: "0",
    suffix: "SQ FT",
    hint: "Enter 0 if the parcel is bare land.",
  },
  classification: {
    label: "Building Classification",
    placeholder: "Select building type...",
    options: [
      { value: "none", label: "No existing structure" },
      { value: "warehouse", label: "Warehouse" },
      { value: "industrial", label: "Industrial" },
      { value: "office", label: "Office" },
      { value: "purpose_built", label: "Purpose-built data centre" },
    ],
  },
  fiber: {
    label: "Dark Fiber Proximity",
    placeholder: "Select distance to fiber...",
    options: [
      { value: "on_site", label: "On site" },
      { value: "under_1km", label: "Under 1 km" },
      { value: "1_5km", label: "1 – 5 km" },
      { value: "over_5km", label: "Over 5 km" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  output: {
    title: "Site Telemetry",
    badge: "ANALYSING",
    readinessLabel: "FACILITY READINESS",
    metrics: {
      pue: { label: "Projected PUE", empty: "—" },
      density: { label: "Rack Density", empty: "—", unit: "kW" },
      network: { label: "Network Capacity", empty: "—" },
    },
    footnote: "Readiness recalculates as parameters change",
  },
  back: "BACK: ENERGY SOURCE",
  next: "SEE RESULTS",
} as const;

export const ASSESSMENT_TOTAL_STEPS = 5;

/* -------------------------------- Step 1 -------------------------------- */

export const STEP_LAND_PROFILE = {
  title: "Land Profile",
  statusLeft: "STEP 1 OF 5 // INITIAL ASSESSMENT",
  statusRight: ["[SEC.1_INIT]", "READY FOR INPUT"],
  fields: {
    size: { label: "LAND SIZE (ACRES)", suffix: "AC", placeholder: "455" },
    /**
     * Only "Industrial" is legible in the screenshot (it is the selected
     * value). The remaining options are taken from `LandUseType` in
     * models/assessment.ts rather than invented, so the dropdown can only
     * produce values the API contract already accepts.
     *
     * ⚠ If the real design offers different zoning categories, update BOTH
     * this list and `LandUseType` — they must stay in step.
     */
    zoning: {
      label: "ZONING TYPE",
      options: [
        { value: "industrial", label: "Industrial" },
        { value: "agricultural", label: "Agricultural" },
        { value: "greenfield", label: "Greenfield" },
        { value: "brownfield", label: "Brownfield" },
      ],
    },
  },
  mapCaption: "TERRAIN_MAP_V1.2",
  output: {
    title: "LIVE OUTPUT",
    scoreLabel: "LAND VIABILITY SCORE",
    bars: [
      { label: "Size Factor", value: "+42" },
      { label: "Zoning Multiplier", value: "1.5x" },
    ],
    terminal: [
      "> Processing parameters...",
      "> Status: OPTIMAL for GPU deployment.",
      "> Awaiting Next Step.",
    ],
  },
  back: "BACK",
  next: "NEXT: STEP 2",
} as const;

/* -------------------------------- Step 2 -------------------------------- */

export const STEP_POWER_CAPACITY = {
  eyebrow: "ASSESSMENT PHASE",
  title: "Power Capacity",
  percentLabel: "40%",
  cardTitle: "Infrastructure Parameters",
  fields: [
    {
      id: "megawatts",
      label: "Megawatts Available",
      placeholder: "Select capacity range...",
      options: [
        { value: "sub_10mw", label: "Under 10 MW" },
        { value: "10_50mw", label: "10 – 50 MW" },
        { value: "50_200mw", label: "50 – 200 MW" },
        { value: "over_200mw", label: "Over 200 MW" },
      ],
    },
    {
      id: "substation",
      label: "Substation Distance",
      placeholder: "Select approximate distance...",
      options: [
        { value: "on_site", label: "On site" },
        { value: "under_1km", label: "Under 1 km" },
        { value: "1_5km", label: "1 – 5 km" },
        { value: "over_5km", label: "Over 5 km" },
      ],
    },
    {
      id: "voltage",
      label: "Voltage Available",
      placeholder: "Select line voltage...",
      options: [
        { value: "under_66kv", label: "Under 66 kV" },
        { value: "66_138kv", label: "66 – 138 kV" },
        { value: "138_345kv", label: "138 – 345 kV" },
        { value: "over_345kv", label: "Over 345 kV" },
      ],
    },
  ],
  output: {
    title: "Live Output",
    badge: "SIMULATION_ACTIVE",
    density: {
      label: "Projected MW Density",
      empty: "—",
      unit: "/acre",
      hint: "Awaiting capacity and layout parameters to calculate density coefficient.",
    },
    capex: {
      label: "Est. Infrastructure CapEx",
      empty: "$—M",
      chips: ["Substation: Pending", "Transmission: Pending"],
    },
    footnote: "Estimates update automatically",
  },
  back: "BACK: SITE DETAILS",
  next: "CONTINUE",
} as const;

/* -------------------------------- Report -------------------------------- */

/**
 * Explicitly typed so the four cards share one shape. Without this the `as
 * const` object below becomes a union of four different literal types and the
 * optional fields are unreachable at the call site.
 */
export interface ReportStat {
  id: string;
  label: string;
  value: string;
  /** Smaller dimmed suffix beside the figure, e.g. "/100". */
  unit?: string;
  /** Accent pill under the figure, e.g. "Status: Favorable". */
  chip?: string;
  /** Dim caption under the figure. */
  caption?: string;
}

export const ASSESSMENT_REPORT: {
  badge: string;
  titleLead: string;
  titleAccent: string;
  body: string;
  stats: readonly ReportStat[];
  risksTitle: string;
  risks: readonly { title: string; body: string }[];
  nextStepsTitle: string;
  primaryCta: string;
  secondaryCta: string;
  orLabel: string;
  tertiaryCta: { label: string; href: string };
} = {
  badge: "STEP 5 OF 5 · COMPLETE",
  titleLead: "Assessment ",
  titleAccent: "Report",
  body:
    "Final analysis of your infrastructure requirements. Data synthesized based on selected " +
    "parameters for optimal deployment viability.",
  stats: [
    { id: "viability", label: "VIABILITY SCORE", value: "78", unit: "/100", chip: "Status: Favorable" },
    { id: "density", label: "MW DENSITY", value: "10-50", caption: "Megawatts Required" },
    { id: "timeline", label: "EST. TIMELINE", value: "14-18", caption: "Months to Deployment" },
    { id: "capex", label: "CAPEX ESTIMATE", value: "$42M", caption: "Initial Investment (USD)" },
  ],
  risksTitle: "Risk Considerations",
  risks: [
    {
      title: "Supply Chain Volatility",
      body:
        "Procurement of high-density cooling systems may extend timeline by 2-4 months depending " +
        "on Q3 vendor availability.",
    },
    {
      title: "Grid Interconnection Delays",
      body:
        "Local utility grid required for loads exceeding 20MW; historical data suggests a 15% " +
        "probability of grid upgrade requirements.",
    },
    {
      title: "Capex Variance",
      body:
        "Estimate carries a +/- 12% confidence interval pending final site selection and land " +
        "acquisition costs.",
    },
  ],
  nextStepsTitle: "NEXT STEPS",
  primaryCta: "Download PDF Report",
  secondaryCta: "Schedule Expert Call",
  orLabel: "OR",
  tertiaryCta: { label: "View Dashboard", href: "/dashboard" },
};
