/**
 * Studio Coal services. Values are stored on Work documents; titles, copy and the /services
 * anchors are shown on the site (Home "Our services", Footer, project tags).
 */
export const SERVICES = [
  {
    title: "Brand",
    value: "brand",
    anchor: "brand",
    description: "Positioning, voice and identity that make a complex idea easy to grasp.",
  },
  {
    title: "Website",
    value: "web",
    anchor: "website",
    description: "Sites that make your case clearly, built so your team can run them.",
  },
  {
    title: "Product",
    value: "digital-products",
    anchor: "product",
    description: "Interfaces and design systems that make powerful things feel simple.",
  },
] as const;

/** Display title for a stored service value. Unknown values are shown as stored. */
export function serviceTitle(value: string): string {
  return SERVICES.find((service) => service.value === value)?.title ?? value;
}

/**
 * Services page offering per service (Figma: Section / Service Offering).
 * Intros and capability names are Figma copy. The one-line capability details are draft
 * copy (Figma shows the accordions closed) and should be reviewed by the studio.
 */
export const OFFERINGS: Record<
  (typeof SERVICES)[number]["value"],
  { title: string; intro: string; capabilities: { name: string; detail: string }[] }
> = {
  brand: {
    title: "Brand",
    intro:
      "Good ideas are often hard to explain. We find the sharpest version of your story and give it a form people remember: a clear position, a distinct voice and an identity built as a system your team can use without us. We explore widely early on, so the final direction is a clear choice, not a compromise.",
    capabilities: [
      {
        name: "Brand strategy",
        detail: "Positioning, audiences and the story that ties them together.",
      },
      {
        name: "Art direction",
        detail: "A visual point of view for imagery, illustration and campaigns.",
      },
      {
        name: "Visual identity",
        detail: "Logo, type, colour and the rules that make them recognisable.",
      },
      {
        name: "Motion systems",
        detail: "How the brand moves, from UI transitions to launch films.",
      },
      {
        name: "Brand systems",
        detail: "Guidelines, templates and components your team can run with.",
      },
    ],
  },
  web: {
    title: "Web",
    intro:
      "Your website is often the first thing people try. We plan, write, design and build sites that make your case clearly, and hand them over on a CMS your team can run. We prototype early and for real, so decisions are made on the actual site, not on slides.",
    capabilities: [
      {
        name: "Content strategy & copywriting",
        detail: "What the site says, in what order, for whom.",
      },
      {
        name: "Architecture & UX",
        detail: "Structure and flows that get visitors to the right page fast.",
      },
      { name: "Design systems", detail: "Components and tokens shared by design and code." },
      { name: "Visual design", detail: "Pages that carry the brand and make the case clearly." },
      {
        name: "Motion & interactions",
        detail: "Considered movement that guides attention, not distracts.",
      },
      {
        name: "CMS implementation",
        detail: "Content models and editing your team can run without us.",
      },
      {
        name: "Full-stack development",
        detail: "Fast, accessible sites built and deployed by the same team.",
      },
    ],
  },
  "digital-products": {
    title: "Product",
    intro:
      "We help product teams make powerful functionality feel simple. We work alongside your engineers on research, flows, interfaces and design systems, shipping in small, careful steps so the product improves with every release.",
    capabilities: [
      { name: "Product strategy", detail: "Where the product goes next, and what to build first." },
      {
        name: "User research & testing",
        detail: "Talking to users early and often, and acting on it.",
      },
      { name: "Journeys & jobs to be done", detail: "Mapping what people are trying to get done." },
      {
        name: "Prototyping in code",
        detail: "Realistic prototypes that answer questions before build.",
      },
      { name: "UI & UX design", detail: "Interfaces that make complex tools feel simple." },
      {
        name: "Design systems",
        detail: "Shared components that keep the product consistent as it grows.",
      },
    ],
  },
};
