import { defineArrayMember, defineField, defineType } from "sanity";
import { normalizePath } from "../../lib/redirects";
import { SERVICES, SERVICE_WORK_LIMIT } from "../../lib/services";
import {
  HeaderFooterIcon,
  OverviewIcon,
  PagesIcon,
  RedirectIcon,
  SeoIcon,
} from "../components/icons";

/** A verification code is one token: pasting the whole <meta> tag is the usual mistake. */
const verificationCode = (value?: string) =>
  value && !/^[\w-]+$/.test(value.trim())
    ? 'Paste only the code: the part between the quotes of content="…".'
    : true;

/**
 * Site settings (singleton). Tabs follow where things appear: site-wide basics, search engines
 * and AI assistants, the header and footer, individual pages, redirects. Each field says where
 * it shows and what the site uses when it is left empty. Fields the site doesn't read are
 * hidden (kept, so no content is lost).
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "general", title: "General", icon: OverviewIcon, default: true },
    { name: "search", title: "Search and AI", icon: SeoIcon },
    { name: "layout", title: "Header and footer", icon: HeaderFooterIcon },
    { name: "pages", title: "Pages", icon: PagesIcon },
    { name: "redirects", title: "Redirects", icon: RedirectIcon },
  ],
  fieldsets: [
    // General
    {
      name: "studio",
      title: "About the studio",
      description: "What Google and other services read about Studio Coal.",
    },
    {
      name: "icon",
      title: "Browser icon",
      description: "The small icon in browser tabs, bookmarks and next to the site in Google.",
    },
    // Search and AI
    {
      name: "sharing",
      title: "Search and sharing",
      description:
        "Used by pages that don't set their own: the text under the link in search results, and the image when a link is shared. Each page's own settings are under Pages, or on the project or post.",
    },
    {
      name: "verification",
      title: "Search engine verification",
      description:
        "Proves to Google and Bing that the site is yours, so Search Console and Webmaster Tools show its search data. Paste only the code, not the whole tag.",
      options: { columns: 2 },
    },
    {
      name: "ai",
      title: "AI assistants",
      description:
        "For ChatGPT, Claude, Perplexity and other assistants that answer questions about the studio.",
    },
    // Header and footer
    { name: "header", title: "Header" },
    {
      name: "footer",
      title: "Footer",
      description: "The footer's email addresses and Services links are fixed in the site's code.",
    },
    // Pages
    { name: "clientsSection", title: "Clients (Home and About pages)" },
    { name: "servicesPage", title: "Services page" },
    { name: "aboutPage", title: "About page" },
  ],
  fields: [
    // General
    defineField({
      name: "description",
      title: "Studio description",
      description:
        "One or two sentences about the studio. Also the search description of any page without its own (see Search and AI).",
      type: "text",
      rows: 3,
      group: "general",
      fieldset: "studio",
    }),
    defineField({
      name: "email",
      title: "Public email",
      description:
        "Listed as the studio's contact in the information search engines read. Doesn't change the footer.",
      type: "string",
      group: "general",
      fieldset: "studio",
      placeholder: "hello@studiocoal.com",
      validation: (rule) =>
        rule.email().error("Enter an email address, e.g. hello@studiocoal.com."),
    }),
    defineField({
      name: "favicon",
      title: "Icon",
      description:
        "A square PNG, at least 512 × 512, that still reads at tab size. Also used on phone home screens and as the studio's logo in search results. Left empty, the site uses its built-in icon.",
      type: "image",
      options: { accept: "image/png" },
      group: "general",
      fieldset: "icon",
    }),
    // Search and AI
    defineField({
      name: "seo",
      title: "Default search and sharing",
      type: "seo",
      group: "search",
      fieldset: "sharing",
    }),
    defineField({
      name: "googleSiteVerification",
      title: "Google Search Console",
      description: 'The content="…" value of the HTML tag method.',
      type: "string",
      group: "search",
      fieldset: "verification",
      validation: (rule) => rule.custom(verificationCode),
    }),
    defineField({
      name: "bingSiteVerification",
      title: "Bing Webmaster Tools",
      description: 'The content="…" value of the meta tag method.',
      type: "string",
      group: "search",
      fieldset: "verification",
      validation: (rule) => rule.custom(verificationCode),
    }),
    defineField({
      name: "aiCrawlers",
      title: "Let AI assistants read the site",
      description:
        "On: AI search and assistants may read and quote the site, and AI companies may train on it. Off: robots.txt asks them all to stay away (ordinary search engines are not affected). Applies after the next deploy.",
      type: "boolean",
      initialValue: true,
      group: "search",
      fieldset: "ai",
    }),
    defineField({
      name: "aiSummary",
      title: "About the studio, for AI assistants",
      description:
        "A short factual profile: what the studio does, for whom, where it is and how to start a project. Opens /llms.txt, the file assistants read first. Left empty, the studio description is used.",
      type: "text",
      rows: 5,
      group: "search",
      fieldset: "ai",
    }),
    defineField({
      name: "faq",
      title: "Questions and answers",
      description:
        "Questions people ask about the studio, each with a direct answer in one or two sentences. Listed in /llms.txt so assistants can answer them correctly. Not shown on the site.",
      type: "array",
      group: "search",
      fieldset: "ai",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
    // Header and footer
    defineField({
      name: "navigation",
      title: "Menu links",
      description:
        "The links in the header, left to right. Left empty, the header shows Work, Services, Process, Journal and About.",
      type: "array",
      group: "layout",
      fieldset: "header",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "address",
      title: "Address",
      description:
        "One line per row, as in the footer. Left empty, the footer shows the Amsterdam studio address.",
      type: "text",
      rows: 3,
      group: "layout",
      fieldset: "footer",
    }),
    defineField({
      name: "social",
      title: "Social links",
      description:
        "Footer links, in this order, e.g. LinkedIn → https://www.linkedin.com/company/studiocoal. Left empty, the footer shows LinkedIn, Instagram and X.",
      type: "array",
      group: "layout",
      fieldset: "footer",
      of: [{ type: "link" }],
      validation: (rule) =>
        rule.custom((links?: { href?: string }[]) =>
          links?.some(({ href }) => href && !/^https:\/\//.test(href))
            ? "Use full addresses starting with https://."
            : true,
        ),
    }),
    // Pages
    defineField({
      name: "clients",
      title: "Client logos",
      description:
        "The Clients section on the Home and About pages, in this order. Single-colour SVGs with a tight artboard work best.",
      type: "array",
      group: "pages",
      fieldset: "clientsSection",
      options: { layout: "grid" },
      of: [
        defineArrayMember({
          type: "object",
          name: "client",
          fields: [
            defineField({
              name: "name",
              title: "Client name",
              description: "Read out by screen readers in place of the logo.",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "logo",
              title: "Logo",
              type: "image",
              options: { accept: "image/svg+xml,image/png" },
              description: "Shown in one colour, tinted to the theme. SVG or PNG.",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),
    defineField({
      name: "servicesWork",
      title: "Projects next to each service",
      description: `Up to ${SERVICE_WORK_LIMIT} per service, in this order. Only projects tagged with that service (Project type) can be picked. Places left empty show the newest tagged projects.`,
      type: "object",
      group: "pages",
      fieldset: "servicesPage",
      fields: SERVICES.map((service) =>
        defineField({
          name: service.workField,
          title: service.title,
          type: "array",
          of: [
            defineArrayMember({
              type: "reference",
              to: [{ type: "work" }],
              options: {
                disableNew: true,
                filter: "$service in services && defined(slug.current)",
                filterParams: { service: service.value },
              },
            }),
          ],
          validation: (rule) =>
            rule
              .unique()
              .max(SERVICE_WORK_LIMIT)
              .error(`Pick up to ${SERVICE_WORK_LIMIT} projects.`),
        }),
      ),
    }),
    defineField({
      name: "aboutGallery",
      title: "Studio photos",
      description:
        "The horizontal photo strip under the About page's heading, left to right. Cropped to 3:2.",
      type: "array",
      group: "pages",
      fieldset: "aboutPage",
      options: { layout: "grid" },
      of: [defineArrayMember({ type: "imageWithAlt" })],
    }),
    // Not read by the site: hidden, but kept so existing content isn't lost.
    defineField({ name: "title", title: "Site title", type: "string", hidden: true }),
    defineField({ name: "phone", title: "Phone", type: "string", hidden: true }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [{ type: "link" }],
      hidden: true,
    }),
    defineField({
      name: "aboutPrinciplesImage",
      title: "About: principles image",
      type: "imageWithAlt",
      hidden: true,
    }),
    // Redirects
    defineField({
      name: "redirects",
      title: "Redirects",
      group: "redirects",
      description:
        "Send old or short addresses somewhere else, e.g. /projects → /work. Changed project and post URLs redirect by themselves (their Old URLs field). Applies after the next deploy.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "redirect",
          fields: [
            defineField({
              name: "from",
              title: "From",
              type: "string",
              description: "A path on this site, e.g. /projects.",
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    value && !value.startsWith("/") ? "Start with /, e.g. /projects." : true,
                  ),
            }),
            defineField({
              name: "to",
              title: "To",
              type: "string",
              description: "A path on this site (/work) or a full URL (https://…).",
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    value && !/^(\/|https?:\/\/)/.test(value)
                      ? "Use a path starting with / or a full https:// URL."
                      : true,
                  ),
            }),
            defineField({
              name: "permanent",
              title: "Permanent (301)",
              type: "boolean",
              description: "Turn off for a temporary redirect (302), e.g. a campaign.",
              initialValue: true,
            }),
          ],
          preview: {
            select: { from: "from", to: "to", permanent: "permanent" },
            prepare: ({ from, to, permanent }) => ({
              title: `${from ? normalizePath(from) : "…"} → ${to ?? "…"}`,
              subtitle: permanent === false ? "Temporary (302)" : "Permanent (301)",
            }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
