# CLAUDE.md — Studio Coal website

Rules for every coding session on this repo. Read this file fully before starting a task.
If a rule here conflicts with a request, ask before breaking it.

## Project

- Marketing site for **Studio Coal** (studiocoal.com), a design studio: brand, web, digital products.
- **Stack:** Astro (static) · Tailwind CSS v4 · TypeScript (strict) · bejamas/ui (copy-and-own Astro components) · Sanity (embedded Studio) · Vercel.
- **Design source:** Figma file `xqG6nM7oVW4iev0PrbuqWt` ("Studio Coal Website"). Page frames are named `Page / breakpoint=xl|md|base` (1440 / 768 / 375).
- **Language:** English only. Keep schemas i18n-ready (no hardcoded locale assumptions), but build no i18n routing.
- Background docs (claude.ai project "StudioCoal Website"): `studiocoal-dev-plan.md`, `studiocoal-decisions.md`.

## Commands

Package manager is **pnpm**. Node **22 LTS** (pinned in `.nvmrc` and `engines`).

```bash
pnpm dev            # Astro dev server (site + /studio)
pnpm build          # production build
pnpm check          # astro check (types) — must pass with 0 errors, 0 warnings
pnpm lint           # ESLint
pnpm format         # Prettier write (format:check in CI; Markdown is excluded)
pnpm test:e2e       # Playwright smoke + visual + axe tests, against the production build
pnpm test:e2e:update  # rewrite local visual baselines
pnpm test           # Vitest (lib/ helpers only)
pnpm typegen        # sanity schema extract + typegen → src/sanity/types.ts
pnpm dlx bejamas@latest add <name>   # add a bejamas/ui component
```

Before saying a task is done, run `pnpm check && pnpm lint && pnpm build`.

## Folder layout

```
src/
  ui/               bejamas/ui primitives (copied in, owned by us)
  components/       site components built from ui/ (Navbar, Footer, cards, GetInTouchModal)
  sections/         page sections (ClientsSection, FeaturedWorkSection, …)
  layouts/          BaseLayout, PageLayout
  pages/            routes
  lib/              helpers (utils.ts with cn(), formatters, seo)
  sanity/           client, queries.ts (GROQ), types.ts (generated), schemas/
  styles/           globals.css (imports the rest + shadcn aliases), tokens.css, typography.css
public/fonts/       self-hosted WOFF2 (Graphik is git-ignored until licensed)
```

Routes: `/`, `/work`, `/work/[slug]`, `/journal`, `/journal/[slug]`, `/services`, `/process`, `/about`, `/cookie-policy`, `404`, `/studio` (Sanity), `/styleguide` (dev only).

## Naming

- Components: PascalCase `.astro` files named after the Figma component, without the slash prefix and with the type as a suffix:
  `Card / Work List Item` → `WorkListCard.astro`, `Section / Clients` → `ClientsSection.astro`, `Modal / Get in touch` → `GetInTouchModal.astro`.
- Props are typed with `interface Props` in the frontmatter. No untyped `Astro.props`.
- Every component in `components/` and `sections/` starts with a header comment that links its Figma node:
  ```astro
  ---
  /**
   * Work List Card
   * Figma: https://www.figma.com/design/xqG6nM7oVW4iev0PrbuqWt/?node-id=1234-5678
   */
  ```

## Design tokens (most important section)

Token values live **only** in `src/styles/tokens.css` (neutral palette, semantic colors, layout) and `src/styles/typography.css` (text-style variables + utilities). Components never contain raw values.

### Hard rules
1. **No raw hex, rgb, hsl or px values** in components. Use tokens only.
2. **No arbitrary Tailwind values** (`w-[347px]`, `text-[#fff]`). The only exception is a value with an inline comment explaining why no token fits. Prefer asking first.
3. **Spacing** comes only from the Tailwind `spacing` scale (`p-4`, `gap-6`), which matches Figma `spacing/N`.
4. **Section layout** uses the semantic utilities only: `px-container`, `py-section`, `pt-hero`, `gap-gutter`, `max-w-container`, `grid-cols-layout`.
5. **Text** uses the type utilities only: `text-headline-xxl|xl|lg|md|sm|xs`, `text-body-lg|md|sm|xs`, `text-label`, `text-caption-md|sm`, `text-eyebrow`. Never compose `text-2xl font-medium leading-…` by hand.
6. **Variants** use `class-variance-authority` (`cva`), as bejamas components do. Merge classes with `cn()` from `src/lib/utils.ts`.
7. **Never add, rename or change a token without asking.** If a design needs a value that has no token, stop and ask.

### Colors and themes
- **Which Figma variables are in code:** the **Theme** collection's semantic colors (light + dark), the **Custom** collection (layout + text-style variables, per breakpoint) and the custom **neutral palette** (`--color-neutral-50…900`, replaces Tailwind's neutral). The **TailwindCSS** collection is *not* imported: it mirrors Tailwind's own utilities (spacing, sizes, radius, opacity, weights). Theme's radius / breakpoint / container / text-scale variables also equal Tailwind defaults, so use `rounded-*`, `max-w-*` etc. directly. `/styleguide` lists every imported variable with its live value.
- The Figma semantic names are the source of truth (Figma `colors/background/color-bg-primary` → `--bg-primary`):
  - background: `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-elevated`, `bg-overlay`, `bg-translucent`
  - foreground: `fg-primary`, `fg-secondary`, `fg-tertiary`, `fg-faded`, `fg-link`, `fg-link-hover`, `fg-link-active`, `fg-on-primary`, `fg-on-secondary`, `fg-inverse`
  - interactive: `interactive-primary(-hover|-active)`, `interactive-secondary(-hover|-active)`, `interactive-focus-ring`, `interactive-focus-inner`
  - border: `border-strong`, `border-medium`, `border-subtle`
  
  In classes they read as `bg-bg-primary`, `text-fg-secondary`, `border-border-subtle`. That is intended.
- shadcn token names (`background`, `foreground`, `primary`, `muted`, `border`, `ring`, …) exist **only as aliases** that point to the Figma tokens, so that bejamas components work unchanged. Use the Figma names in our own code.
- **Light and dark themes both ship**, following the OS setting (`prefers-color-scheme`). There is no toggle. Dark is the default: `:root` holds dark values, `@media (prefers-color-scheme: light)` overrides the semantic variables, and `color-scheme: light dark` is set. Primitives never change between themes; only the semantic mapping does (Figma `Theme` collection, Light/Dark modes).
- Check every component in both themes.

### Breakpoints
- Tailwind default breakpoints are removed. Only two exist:
  - base: below 768px (designed at 375)
  - `md`: 768px and up (designed at 768)
  - `xl`: 1024px and up (designed at 1440)
- Mobile-first: unprefixed classes = base, then `md:` and `xl:` overrides. Never use `sm:`, `lg:` or `2xl:`.
- Semantic layout tokens (`--grid-gutter`, `--container-padding-x`, `--section-padding-y`, `--hero-padding-top`, `--grid-column-count`) switch values at these breakpoints inside `tokens.css`, so components rarely need breakpoint prefixes for spacing.
- **No global max width.** Containers are full-width by default. A container is limited to 1440px only where `max-w-container` is applied explicitly, as in Figma.

### Typography
- Graphik for headline, body and label; Geist Mono for eyebrow. All styles use weight Medium (500) unless Figma says otherwise.
- Letter-spacing is in percent in Figma. Convert to `em`: -4% → `-0.04em` (headlines), -3% → `-0.03em` (body), +2% → `0.02em` (eyebrow).
- **New type utility?** Add it to `typography.css` *and* to the `font-size` list in `src/lib/utils.ts`, otherwise `cn()` (tailwind-merge) drops it when a text color class is present.
- Both fonts are self-hosted WOFF2 in `public/fonts/`, committed, declared in `typography.css` and preloaded in `BaseLayout.astro`. **No Google Fonts or other font CDN.** Geist Mono (`public/fonts/geist/GeistMono-Medium.woff2`) is OFL. Graphik (`public/fonts/graphik/Graphik_Medium.woff2`) is licensed. The "Graphik Fallback" face is metric-matched Arial (`size-adjust` and ascent/descent/line-gap overrides computed from the Graphik file), so the font swap causes no layout shift. Recompute these values if the Graphik file changes.

## bejamas/ui

- Add components with `pnpm dlx bejamas@latest add <name>`. They land in `src/ui/` and are **ours** from then on.
- **Edit copied files directly** to match Figma. Don't wrap them in extra layers. At the top of the file, record what you changed from upstream (upstream updates won't apply automatically).
- Use bejamas for: **Button, Accordion, Dialog** (Get in touch modal), **Input** (footer email form), **Badge**.
- Build by hand: **Navbar** (with mobile menu), **Footer**, **cards** (WorkListCard, WorkArchiveCard, BlogListCard).
- **Don't make a component for something one utility class covers.** Divider → `<hr class="border-border-subtle">` (vertical: `<div role="separator" aria-orientation="vertical" class="w-px self-stretch bg-border-subtle">`); aspect ratio → `aspect-4/5` and similar. Text styles are utilities (`text-headline-*` etc.), never components.
- The Figma **"Tag"** component is our **`Badge`** (`variant`: secondary | tertiary, `size`: sm | default).
- **Accordion trigger size** follows the Figma text style: `<AccordionTrigger size="xs">` (Headline XS, default) or `size="md"` (Headline MD, About page).
- If bejamas lacks something, check the shadcn registry (`@shadcn/...`) next. Build it yourself only if neither has it.

## JavaScript

- **Zero JS by default.** Pages ship as static HTML.
- Interactivity uses `@data-slot` (the bejamas behaviour primitives) or a small vanilla `<script>` in the component.
- **No React, Vue, Svelte or other UI frameworks in the site.** The only exception is the embedded Sanity Studio and visual-editing overlay, which need React. React must never appear in `src/components`, `src/sections` or `src/ui`.
- Animation: CSS first (transitions, `@keyframes`, View Transitions). Always respect `prefers-reduced-motion`.
- Budget: under 20 KB of JS per page (excluding `/studio`).

### Page transitions
- **Cross-document View Transitions** (CSS `@view-transition { navigation: auto; }`). Every navigation is a normal full page load. **Don't add Astro's `<ClientRouter />`** or any SPA router without asking.
- Reference: permanent.is. The old page fades out, and the header keeps a `view-transition-name` so it stays pinned. On the new page, top-level sections play a staggered fade-in from blur (opacity 0 → 1, blur → 0, about 0.95s, staggered about 110ms). Grids and lists stagger their children the same way. Rebuild it in our own code; don't copy their CSS.
- The entrance animation is CSS-only, defined once (keyframes and stagger in `src/styles/`) and applied through `PageLayout`/shared classes, not per component. It must still play where View Transitions aren't supported (e.g. Firefox).
- Motion values (durations, easings, blur) go in `tokens.css` like any other token, so ask before adding them.
- **How to use it:** pages use `PageLayout` (`src/layouts/PageLayout.astro`) and pass sections as direct children of `<main>`. Each one gets the entrance. On a grid or list, add `animate-enter-stagger` to stagger its items, or `animate-enter` for a single element. The Navbar root gets `view-transition-header`. The entrance only plays after an in-site navigation (BaseLayout adds `nav-entered` to `<html>`), so direct visits paint immediately.
- Component scripts stay plain `<script>` that run once per page load. No `astro:page-load` re-init logic.
- Under `prefers-reduced-motion: reduce`, turn off both the View Transition animations and the entrance animation.
- Text-morph effects (spring-animated label changes like "Menu ↔ Close") need a library such as Torph, which is a new runtime dependency, so ask first and check it against the JS budget.

## Sanity

- Collections: **Work** and **Journal** (posts). Plus a `siteSettings` singleton (nav, footer, contacts, social).
- Marketing pages (Home, Services, Process, About) are **hardcoded** in Astro. Sections inside them pull Sanity items where needed:
  - `FeaturedWorkSection` → featured Work items
  - `FeaturedArticlesSection` → latest or featured Journal posts
  - `ServiceOfferingSection` → related Work for that service, **max 2 items**
- **Studio:** embedded at `/studio` via `@sanity/astro` (config in `sanity.config.ts`, schemas in `src/sanity/schemas/`). The site is static, so the Studio uses hash routing (`/studio#/…`). Each origin that opens the Studio (localhost, production, previews) must be added as a CORS origin with credentials in sanity.io/manage.
- **All GROQ lives in `src/sanity/queries.ts`** using `defineQuery`. Never write inline queries in pages or components. Types come from `pnpm typegen`. Never hand-write query result types.
- **Images** always go through the Sanity image URL builder, with responsive `srcset`/`sizes`, hotspot/crop and LQIP blur placeholders. Never use raw asset URLs.
- **Portable Text** is rendered by one component (`src/components/RichText.astro`) mapped to the Figma Rich Text styles.
- **Rendering:** static build. A Sanity webhook triggers a Vercel rebuild on publish. Draft preview runs on server-rendered routes (`prerender = false`) with the Presentation tool.
- After changing a schema or query, run `pnpm typegen` and commit `src/sanity/types.ts`. CI fails if it is out of date.
- Env vars (never commit them; keep `.env.example` up to date): `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`.
- Never change or delete Sanity content or datasets from scripts without asking.

## Figma → code workflow

1. Get the node: use the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`) on the exact frame or component. The **Figma file is read-only**; never edit it.
2. Treat MCP output as a reference, not code to paste. Rebuild it with our tokens, utilities and existing components.
3. Reuse before creating: check `src/ui`, `src/components` and `src/sections` first.
4. **Fidelity:** spacing, type and color match exactly through tokens. Up to 2px layout difference is acceptable where browsers render differently.
5. **When Figma is unclear or a state is missing:** follow existing patterns in the codebase, then bejamas/Tailwind conventions. Make the call and **list every judgement call in the PR description**.
6. Every component and state is added to **`/styleguide`** (`src/pages/[styleguide].astro`), which only exists in dev and is not emitted by `pnpm build`.

## Quality

- **TypeScript:** `astro/tsconfigs/strict`. No `any` without a comment saying why. No `@ts-ignore`; use `@ts-expect-error` with a reason.
- **Lint and format:** ESLint (`eslint-plugin-astro`, `jsx-a11y`) and Prettier (`prettier-plugin-astro`, `prettier-plugin-tailwindcss`). Both run in pre-commit (lefthook) and CI.
- **Tests:** Playwright for smoke and visual tests at 375 / 768 / 1440, in light and dark. Vitest only for `src/lib/` helpers.
  - New routes go in `tests/e2e/routes.ts`, so they get smoke, axe and visual coverage.
  - Visual baselines are per OS. Only the linux ones (`tests/e2e/__screenshots__/linux/`) are committed, because CI compares against them. To create or update them, add the `update-snapshots` label to the PR, download the `linux-snapshots` artifact, unzip it into that folder, review the images and commit them. Local (darwin) baselines are git-ignored.
- **Accessibility:** WCAG 2.2 AA, except colour contrast: the low-contrast text tokens (`fg-secondary`, `fg-tertiary`, especially in light mode) are an accepted design decision, and axe's `color-contrast` rule is disabled. Don't change tokens or swap colours to fix contrast. Everything works by keyboard, with visible focus states. Use semantic HTML (`<nav>`, `<dialog>`, `<details>` where suitable). An axe check runs in Playwright on every PR.
- **Performance:** Lighthouse mobile 95+ in all four categories. The LCP image is preloaded and not lazy. Images have explicit dimensions.
- **Browsers:** last 2 versions of evergreen browsers, plus Safari iOS 16+.

## Git and PRs

- `main` is always deployable. Work on `feat/…`, `fix/…` and `chore/…` branches.
- Use **Conventional Commits**: `feat: add Navbar mobile menu`, `fix: card hover focus ring`.
- **One PR per component or page.** The PR description includes:
  - screenshots at 375 / 768 / 1440 next to the Figma frame (light and dark)
  - the design judgement calls made
  - any new dependencies and why
- Vercel creates a preview deployment for every PR.
- **Claude may merge its own PRs** once CI is green and the definition of done is met.

## Autonomy: what to ask first

| Action | Ask first? |
|---|---|
| Install a new runtime dependency | **Yes.** Dev tooling already listed in this file is fine |
| Design judgement call where Figma is unclear | No. Decide, then list it in the PR |
| Add or change a design token | **Yes, always** |
| Refactor files outside the current task | **Yes.** Propose it instead of doing it |
| Edit the Figma file | **Never.** It is read-only |
| Change Sanity schemas in a way that breaks existing content | **Yes** |

## Definition of done

A task is done only when:
- [ ] `pnpm check`, `pnpm lint` and `pnpm build` pass with no errors or warnings
- [ ] it matches Figma at 375 / 768 / 1440, with screenshots in the PR
- [ ] it works in both light and dark themes
- [ ] it is keyboard-accessible and passes axe
- [ ] it uses tokens only, with no raw or arbitrary values
- [ ] it is added to `/styleguide` (if it's a component)
- [ ] the design judgement calls are listed in the PR
