// Every public route that the e2e suite covers. Add new pages here.
// The site is built from the Sanity fixtures (tests/fixtures/sanity/dataset.ndjson), so the
// project and post slugs below are fixture documents, not live content.
export const routes = [
  { path: "/", name: "home" },
  { path: "/work", name: "work" },
  // Image visuals throughout, both content block types, results and deliverables. Its
  // "more work" list shows Fieldnote's Bunny video card (no poster: Bunny's thumbnail).
  { path: "/work/northlight", name: "work-northlight" },
  // Sparser project: no results, one content block.
  { path: "/work/fieldnote", name: "work-fieldnote" },
  { path: "/journal", name: "journal" },
  { path: "/journal/quiet-interfaces", name: "journal-post" },
  { path: "/services", name: "services" },
  { path: "/process", name: "process" },
  { path: "/about", name: "about" },
  { path: "/cookie-policy", name: "cookie-policy" },
] as const;
