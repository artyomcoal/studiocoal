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
 * Intros and capability names are Figma copy. Capability names set the accordion order and
 * match Service documents in Sanity by title; each accordion's text is that document's
 * Description (SERVICE_DESCRIPTIONS_QUERY).
 */
export const OFFERINGS: Record<
  (typeof SERVICES)[number]["value"],
  { title: string; intro: string; capabilities: string[] }
> = {
  brand: {
    title: "Brand",
    intro:
      "Good ideas are often hard to explain. We find the sharpest version of your story and give it a form people remember: a clear position, a distinct voice and an identity built as a system your team can use without us. We explore widely early on, so the final direction is a clear choice, not a compromise.",
    capabilities: [
      "Brand strategy",
      "Art direction",
      "Visual identity",
      "Motion systems",
      "Brand systems",
    ],
  },
  web: {
    title: "Web",
    intro:
      "Your website is often the first thing people try. We plan, write, design and build sites that make your case clearly, and hand them over on a CMS your team can run. We prototype early and for real, so decisions are made on the actual site, not on slides.",
    capabilities: [
      "Content strategy & copywriting",
      "Architecture & UX",
      "Design systems",
      "Visual design",
      "Motion & interactions",
      "CMS implementation",
      "Full-stack development",
    ],
  },
  "digital-products": {
    title: "Product",
    intro:
      "We help product teams make powerful functionality feel simple. We work alongside your engineers on research, flows, interfaces and design systems, shipping in small, careful steps so the product improves with every release.",
    capabilities: [
      "Product strategy",
      "User research & testing",
      "Journeys & jobs to be done",
      "Prototyping in code",
      "UI & UX design",
      "Design systems",
    ],
  },
};
