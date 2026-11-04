/** Studio Coal services. Values are stored on Work documents; titles are shown on the site. */
export const SERVICES = [
  { title: "Brand", value: "brand" },
  { title: "Website", value: "web" },
  { title: "Digital products", value: "digital-products" },
] as const;

/** Display title for a stored service value. Unknown values are shown as stored. */
export function serviceTitle(value: string): string {
  return SERVICES.find((service) => service.value === value)?.title ?? value;
}
