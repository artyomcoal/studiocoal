// Every public route that the e2e suite covers. Add new pages here.
// /work/[slug] joins once the dataset has Work content (no paths are built without it).
export const routes = [
  { path: "/", name: "home" },
  { path: "/work", name: "work" },
  { path: "/journal", name: "journal" },
  { path: "/services", name: "services" },
  { path: "/process", name: "process" },
] as const;
