export interface AboutCard {
  title: string;
  description: string;
}

export interface LeadershipProfile {
  id: string;
  name: string;
  role: string;
  headline: string;
  biography: string;
  credential?: string;
  focusAreas: readonly string[];
  portraitSrc: string;
  portraitAlt: string;
  linkedinUrl: string;
}

export const ABOUT_PAGE = {
  hero: {
    eyebrow: "About Panda Cloud.AI",
    title: "We build and operate the physical foundation of AI.",
    paragraphs: [
      "With over fifteen years across high-performance computing, data centers, cloud, GPUs, energy, land and investments, our team has worked every layer of the stack — from securing power and sites to deploying compute, delivering it as cloud, and structuring the capital behind it.",
      "That range is the point. AI infrastructure sits at the intersection of hardware, real estate and energy, and deals fail when those pieces are handled in isolation. Panda Cloud.AI brings them together.",
    ],
  },
  system: {
    eyebrow: "One connected system",
    title: "AI infrastructure is one connected system.",
    subtitle:
      "Compute only creates value when power, sites, cooling, connectivity, operations and capital are aligned from the start.",
  },
  capabilities: [
    {
      title: "Compute & Cloud",
      description:
        "Align GPU and HPC infrastructure with workload, utilization, deployment and operating requirements.",
    },
    {
      title: "Energy & Sites",
      description:
        "Evaluate power, land, cooling, connectivity and development constraints as one site strategy.",
    },
    {
      title: "Delivery & Operations",
      description:
        "Carry decisions from diligence and design into deployment, cloud delivery and ongoing operations.",
    },
    {
      title: "Capital & Commercial Structure",
      description:
        "Build commercial structures around project economics, risk allocation and long-term viability.",
    },
  ] as const satisfies readonly AboutCard[],
  approach: {
    eyebrow: "How we work",
    title: "Built around the whole project, not one transaction.",
    subtitle:
      "Our process keeps technical reality and client economics connected from the first assessment through long-term operation.",
    steps: [
      {
        title: "Economics before equipment",
        description:
          "We begin with the outcome the client needs and the economics the project must support, not a predefined product.",
      },
      {
        title: "Integrated diligence",
        description:
          "Technical, site, energy and commercial constraints are assessed together before commitments are made.",
      },
      {
        title: "Built for operating reality",
        description:
          "Every structure must work under real deployment, utilization and operating conditions.",
      },
      {
        title: "Long-term alignment",
        description:
          "We optimize for durable partnerships and repeatable value rather than short-term transaction volume.",
      },
    ],
  },
  audiences: [
    {
      title: "AI builders & enterprises",
      description: "Organizations seeking scalable compute aligned with real workload and operating needs.",
    },
    {
      title: "Infrastructure operators",
      description: "Data center and infrastructure teams planning, expanding or repositioning capacity.",
    },
    {
      title: "Land & power owners",
      description: "Owners evaluating whether sites and energy assets can support AI infrastructure.",
    },
    {
      title: "Investors & capital partners",
      description: "Partners supporting the development and operation of durable infrastructure assets.",
    },
  ] as const satisfies readonly AboutCard[],
  proof: [
    { title: "15+ years", description: "Experience across the infrastructure stack" },
    { title: "One integrated view", description: "Compute, sites, energy and capital" },
    { title: "Long-term by design", description: "Structures built to perform over time" },
  ] as const satisfies readonly AboutCard[],
  closing:
    "Every deal we structure is built around the client's economics first. We take a long view: we would rather build one relationship that lasts a decade than close ten transactions that don't. Our clients come back because the structures we put in place hold up.",
  leadership: {
    eyebrow: "Leadership",
    title: "Leadership across technology, infrastructure and capital.",
    subtitle:
      "Our leadership brings together venture building, decentralized infrastructure, energy systems, data centers and investment strategy.",
  },
  engagements: {
    eyebrow: "Selected engagements",
    title: "Approved case studies in preparation",
    description:
      "Selected project examples will be published after client and legal approval. We do not disclose partners, locations or results before that review is complete.",
  },
  cta: {
    title: "Bring us the full constraint set.",
    subtitle:
      "Whether the starting point is compute demand, available power, a development site or capital, we help shape a path that works as one system.",
    primary: { label: "Request a consultation", href: "/submit-request" },
    secondary: { label: "Explore our infrastructure capabilities", href: "/infrastructure" },
  },
} as const;

export const LEADERSHIP_PROFILES: readonly LeadershipProfile[] = [
  {
    id: "vanessa-wh",
    name: "Vanessa W. H.",
    role: "Chief Executive Officer",
    headline: "AI venture builder, investor and ESG innovation strategist.",
    biography:
      "Vanessa is an entrepreneurial business leader focused on transforming emerging technologies and ideas into viable products, ventures and strategic portfolios. With more than ten years of experience advising senior executives across developed and emerging markets, she combines analytical thinking, creative problem-solving and partnership building to create clarity around complex opportunities.",
    credential: "Managing Director of Skylight AI Accelerator · Member of NVIDIA VC Alliance",
    focusAreas: ["Venture building", "ESG innovation", "Portfolio strategy", "Strategic partnerships"],
    portraitSrc: "/assets/leadership/vanessa-wh.jpg",
    portraitAlt: "Stylized red, black and white portrait illustration provided for Vanessa W. H.",
    linkedinUrl: "https://www.linkedin.com/in/hivannie/",
  },
  {
    id: "randall-lee-pires",
    name: "Randall Lee Pires",
    role: "Chief Executive Officer",
    headline: "AI data center, energy and decentralized infrastructure architect.",
    biography:
      "Randall is an engineer, entrepreneur and technology architect working across AI, blockchain, energy, telecommunications and smart-city infrastructure. His experience spans large-scale decentralized networks, wireless connectivity, cryptocurrency-mining infrastructure, green energy and international technology deployment.",
    credential:
      "Helped scale decentralized wireless infrastructure to more than 80,000 deployments worldwide and developed telecommunications infrastructure across multiple African markets.",
    focusAreas: ["AI data centers", "DePIN", "HVDC energy", "Telecommunications"],
    portraitSrc: "/assets/leadership/randall-lee-pires.jpg",
    portraitAlt: "Portrait of Randall Lee Pires.",
    linkedinUrl: "https://www.linkedin.com/in/randallpires/",
  },
  {
    id: "corey-mccauley",
    name: "Corey McCauley",
    role: "Chief Executive Officer",
    headline: "Energy, digital infrastructure and HPC investment professional.",
    biography:
      "Corey is an infrastructure and investment professional focused on the energy systems, digital infrastructure and capital required to support AI and high-performance computing. He brings more than ten years of experience across energy, land, Bitcoin mining and AI data centers, including hands-on project operations and capital formation.",
    credential:
      "M.S. in Data Center Systems Engineering, Southern Methodist University · Stanford Emerging Technologies Program",
    focusAreas: ["Data center engineering", "Energy innovation", "HPC", "Venture capital"],
    portraitSrc: "/assets/leadership/corey-mccauley.png",
    portraitAlt: "Portrait of Corey McCauley.",
    linkedinUrl: "https://www.linkedin.com/in/corey-mccauley/",
  },
];
