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
