import type { CoolingArchitecture, ProjectStage, RfpLogEntry } from "@/models/hyperscale";

/**
 * Hyperscale Data Center content, transcribed from the exported screens:
 * projecttage.png (step 1), Hyper.png (step 2), huper3.png (step 3),
 * hyper4.png (step 4).
 *
 * ⚠ Two corrections agreed with the product owner on 2026-08-12:
 *   - The flow is FOUR steps. The Geography screen reads "STEP 3 OF 5".
 *   - Steps 2 and 3 both had a "Proceed to Network(ing)" button, but no
 *     Networking screen exists. The labels now name the screen they lead to.
 */

export const HYPERSCALE_TOTAL_STEPS = 4;

/* -------------------------------- Step 1 -------------------------------- */

export const STEP_PROJECT_STAGE = {
  statusLine: "STEP 01 // CONFIGURATION",
  exitLabel: "Save & Exit",
  title: "Select Project Stage",
  body:
    "Determine the baseline physical infrastructure model for your hyperscale deployment. This " +
    "dictates downstream capacity planning and supply chain integration.",
  options: [
    {
      value: "greenfield",
      title: "Greenfield",
      body:
        "Ground-up construction on undeveloped land. Maximum architectural freedom and power " +
        "density scaling.",
      tags: ["High CapEx", "Long Lead Time"],
    },
    {
      value: "retrofit",
      title: "Retrofit",
      body:
        "Modernization of an existing industrial or legacy data center facility to support " +
        "high-density compute.",
      tags: ["Med CapEx", "Med Lead Time"],
    },
    {
      value: "modular",
      title: "Modular",
      body:
        "Prefabricated containerized units. Rapid deployment for edge computing or incremental " +
        "capacity expansion.",
      tags: ["Low CapEx", "Fast Lead Time"],
    },
    {
      value: "turnkey",
      title: "Turnkey",
      body:
        "Fully fitted, powered colocation space ready for immediate rack and stack of compute " +
        "hardware.",
      tags: ["OpEx Heavy", "Immediate"],
    },
  ] as readonly { value: ProjectStage; title: string; body: string; tags: string[] }[],
  panel: {
    badge: "Telemetry Active",
    selectedLabel: "Selected Stage",
    timelineLabel: "Estimated Timeline",
    impactLabel: "Impact Analysis",
    readinessLabel: "BUILD READINESS",
    empty: "Select a project stage to see its impact on timeline and capital planning.",
  },
  back: "Back",
  next: "Continue Configuration",
} as const;

/* -------------------------------- Step 2 -------------------------------- */

export const STEP_CAPACITY = {
  statusLine: "STEP 2 OF 4",
  title: "Capacity & Cooling",
  body:
    "Define your computational payload and thermal management strategy. Real-time capex " +
    "projections will adjust based on these primary vectors.",
  capacity: {
    label: "TARGET CAPACITY (MW)",
    min: 10,
    max: 250,
    step: 5,
    default: 50,
    minLabel: "10 MW",
    maxLabel: "250 MW",
    unit: "MW",
  },
  cooling: {
    label: "COOLING ARCHITECTURE",
    hint: "Select architecture based on expected rack density. Liquid and immersion recommended for >30kW/rack.",
    options: [
      { value: "air_hot_cold", label: "Air Cooling (Hot/Cold Aisle)" },
      { value: "liquid_dtc", label: "Liquid Cooling (Direct-to-Chip)" },
      { value: "immersion", label: "Immersion Cooling" },
      { value: "hybrid", label: "Hybrid (Air + Liquid)" },
    ] as readonly { value: CoolingArchitecture; label: string }[],
  },
  panel: {
    title: "Capex Projection",
    badge: "LIVE COMPUTE",
    totalLabel: "ESTIMATED TOTAL CAPEX",
    note: "Excludes active IT hardware",
  },
  back: "Back",
  /** Was "Proceed to Network" in the export — corrected to the real target. */
  next: "Proceed to Geography",
} as const;

/**
 * CapEx rates per megawatt, in USD. ⚠ Frontend working assumptions so the
 * projection panel responds; the real cost model belongs to the backend.
 * Derived so the design's sample (50 MW → ~$252.5M) is reproduced.
 */
export const CAPEX_PER_MW = {
  infrastructureLand: 2_500_000,
  powerSystems: 1_700_000,
  coolingByArchitecture: {
    air_hot_cold: 600_000,
    liquid_dtc: 840_000,
    immersion: 1_050_000,
    hybrid: 760_000,
  } as Record<CoolingArchitecture, number>,
} as const;

/* -------------------------------- Step 3 -------------------------------- */

export const STEP_GEOGRAPHY = {
  statusLine: "STEP 3 OF 4",
  statusRight: "SYSTEM ACTIVE",
  body:
    "Configure physical deployment parameters and synchronize hardware availability schedules " +
    "for your cluster.",
  region: {
    title: "Deployment Region",
    label: "SELECT TARGET INFRASTRUCTURE ZONE",
    placeholder: "Select Region (e.g. US-East-1)",
    powerLabel: "AVAILABLE POWER",
    coolingLabel: "COOLING TYPE",
  },
  goLive: {
    title: "Target Go-Live",
    label: "ESTABLISH DEPLOYMENT HORIZON",
    /** Below this many days out, the expedite premium applies. */
    expediteThresholdDays: 90,
    expediteWarning:
      "Selecting a date less than 90 days out requires 'Expedited Procurement' approval and " +
      "incurs a 15% hardware premium.",
  },
  gantt: {
    title: "AUTO-GENERATED GANTT CHART",
    badge: "LIVE SYNC",
    phaseHeader: "PHASE / MILESTONE",
    goLiveHeader: "GO-LIVE",
    months: ["M1", "M2", "M3", "M4"],
    legend: { active: "Active Phase", pending: "Pending Phase" },
    delayLabel: "CRITICAL PATH DELAY",
  },
  back: "Back to Capacity",
  /** Was "Proceed to Networking" in the export — corrected. */
  next: "Proceed to RFP",
} as const;

/** Regions offered in the dropdown. */
export const HYPERSCALE_REGIONS = [
  { id: "us_east_1", label: "US-East-1 (Virginia)", availablePower: "140 MW", coolingType: "Liquid-to-Chip" },
  { id: "us_west_2", label: "US-West-2 (Oregon)", availablePower: "95 MW", coolingType: "Hybrid Air/Liquid" },
  { id: "eu_north_1", label: "EU-North-1 (Oslo)", availablePower: "80 MW", coolingType: "Free Cooling" },
  { id: "apac_1", label: "APAC-1 (Hsinchu)", availablePower: "150 MW", coolingType: "Direct-to-Chip" },
] as const;

/** Delivery phases for the generated schedule. */
export const DELIVERY_PHASES = [
  { label: "Site Preparation", detail: "Power & Cooling Audit", startMonth: 0, durationMonths: 1 },
  { label: "Hardware Procurement", detail: "NVIDIA HGX Racks", startMonth: 0, durationMonths: 3 },
  { label: "Physical Racking", detail: "Cabling & Power-on", startMonth: 1, durationMonths: 2 },
  { label: "Network Configuration", detail: "Top-of-Rack Switches", startMonth: 2, durationMonths: 1 },
  { label: "Burn-in & Testing", detail: "Stress Test & Validation", startMonth: 3, durationMonths: 1 },
] as const;

/* -------------------------------- Step 4 -------------------------------- */

export const STEP_RFP = {
  statusLine: "Step 4 / 4",
  title: "RFP & Consultation",
  body:
    "Finalize your hyperscale deployment by uploading your technical requirements or scheduling " +
    "a direct technical consultation with our engineering architects.",
  upload: {
    title: "Upload RFP / BoM",
    body:
      "Upload your Request for Proposal, Bill of Materials, or network architecture diagrams. " +
      "Supported formats: .pdf, .docx, .xlsx, .zip",
    dropTitle: "Drag & drop files here",
    dropHint: "or click to browse",
    button: "Select Files",
  },
  consultation: {
    title: "Architect Consultation",
    body:
      "Require deep technical alignment? Schedule a 60-minute session with our lead deployment " +
      "engineers to discuss power density, cooling, and network topology.",
    availabilityCta: "View Availability",
    scheduleCta: "Schedule Consultation",
  },
  terminal: {
    title: "System Status: Processing",
    handle: "terminal_out",
    /**
     * Lines shown once a file is uploaded.
     *
     * Typed explicitly: without it the surrounding `as const` turns this into a
     * union of four literal shapes, and `outcome` becomes unreachable on the
     * three entries that omit it.
     */
    entries: [
      { time: "10:42:01", message: "Initializing matching algorithm..." },
      { time: "10:42:02", message: "Parsing node requirements..." },
      { time: "10:42:03", message: "Validating power/cooling constraints:", outcome: "pass" },
      { time: "10:42:08", message: "Vendor matching in progress..." },
    ] as readonly RfpLogEntry[],
  },
  /** Routes to the shared Request Received screen — no separate results page. */
  resultsCta: "See Results",
} as const;
