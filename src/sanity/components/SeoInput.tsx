/** @jsxImportSource react */
/**
 * SEO input (Studio only, React): a search result and share preview above the SEO fields.
 *
 * Shows what the page will actually ship with, using the same fallbacks as the site
 * (src/lib/seo.ts › contentSeo): an empty field falls back to the document's own title,
 * description and main visual, and each value says where it comes from.
 * On other document types (Site settings) it renders the plain fields.
 */
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { CSSProperties, ReactNode } from "react";
import { useClient, useFormValue, type ObjectInputProps } from "sanity";
import { BunnyThumbnail } from "./BunnyThumbnail";
import {
  CONTENT_PATHS,
  contentPath,
  contentSeo,
  type ContentType,
  pageTitle,
  SEO_DESCRIPTION_LIMIT,
  SEO_DESCRIPTION_MIN,
  SEO_TITLE_LIMIT,
} from "../../lib/seo";

interface ImageValue {
  asset?: { _ref?: string };
}
interface MediaValue {
  kind?: "image" | "video";
  image?: ImageValue;
  video?: { poster?: ImageValue; playlistUrl?: string };
}
interface SeoValue {
  title?: string;
  description?: string;
  image?: ImageValue;
  noIndex?: boolean;
}
interface DocumentValue {
  _type?: string;
  title?: string;
  excerpt?: string;
  slug?: { current?: string };
  listingMedia?: MediaValue;
  heroMedia?: MediaValue;
  coverImage?: ImageValue;
}

const SOURCE_LABEL = {
  seo: "from the field below",
  title: "from the page title",
  none: "no page title yet, so only the site name",
  excerpt: "from the description",
  default: "the site default (Site settings)",
} as const;

function mediaImage(media?: MediaValue): ImageValue | undefined {
  const image = media?.kind === "video" ? media.video?.poster : media?.image;
  return image?.asset?._ref ? image : undefined;
}

/**
 * Social image in the site's order: the SEO image, else a card generated at build time with
 * the title over the page's main visual (src/lib/social-image.ts).
 */
/** A Work video visual (listing, else hero) without a poster: Bunny's thumbnail is used. */
function bunnyPlaylist(doc: DocumentValue): string | undefined {
  for (const media of [doc.listingMedia, doc.heroMedia]) {
    if (media?.kind === "video" && !media.video?.poster?.asset?._ref && media.video?.playlistUrl) {
      return media.video.playlistUrl;
    }
    if (mediaImage(media)) return undefined;
  }
  return undefined;
}

function socialImage(doc: DocumentValue, seo?: SeoValue): [ImageValue | undefined, string] {
  if (seo?.image?.asset?._ref) return [seo.image, "from the field below"];
  if (doc._type === "work") {
    const listing = mediaImage(doc.listingMedia);
    if (listing) return [listing, "generated: the title over the listing visual"];
    const hero = mediaImage(doc.heroMedia);
    if (hero) return [hero, "generated: the title over the project hero"];
    if (bunnyPlaylist(doc))
      return [undefined, "generated: the title over the video's Bunny thumbnail"];
  }
  if (doc._type === "journal" && doc.coverImage?.asset?._ref) {
    return [doc.coverImage, "generated: the title over the cover image"];
  }
  return [undefined, "generated: the title on a dark background"];
}

const isContentType = (type?: string): type is ContentType => !!type && type in CONTENT_PATHS;

export function SeoInput(props: ObjectInputProps) {
  const doc = (useFormValue([]) ?? {}) as DocumentValue;
  const client = useClient({ apiVersion: "2026-11-01" });
  if (!isContentType(doc._type)) return props.renderDefault(props);

  const value = props.value as SeoValue | undefined;
  const resolved = contentSeo({ title: doc.title, excerpt: doc.excerpt, seo: value });
  const title = pageTitle(resolved.title);
  const description = resolved.description;
  const path = contentPath(doc._type, doc.slug?.current || "…");
  const [image, imageSource] = socialImage(doc, value);
  const imageUrl = image
    ? createImageUrlBuilder(client)
        .image(image as SanityImageSource)
        .width(600)
        .height(315)
        .fit("crop")
        .auto("format")
        .url()
    : null;

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section aria-label="Search and share preview" style={panel}>
        <p style={eyebrow}>Search result preview</p>
        {value?.noIndex ? (
          <p style={warning}>Hidden from search engines: this page won't appear in results.</p>
        ) : null}
        <div style={{ display: "grid", gap: "0.25rem", opacity: value?.noIndex ? 0.5 : 1 }}>
          <span style={muted}>studiocoal.com{path}</span>
          <span style={searchTitle}>{title}</span>
          <span style={{ lineHeight: 1.5 }}>
            {description ?? <em style={muted}>Site default description</em>}
          </span>
        </div>
        <ul style={meta}>
          <Meta
            label="Title"
            source={SOURCE_LABEL[resolved.source.title]}
            count={title.length}
            max={SEO_TITLE_LIMIT}
          />
          <Meta
            label="Description"
            source={SOURCE_LABEL[resolved.source.description]}
            count={description?.length}
            min={SEO_DESCRIPTION_MIN}
            max={SEO_DESCRIPTION_LIMIT}
          />
          <Meta label="Social image" source={imageSource} />
        </ul>
        {imageUrl || (!value?.image?.asset?._ref && bunnyPlaylist(doc)) ? (
          <figure style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                width={600}
                height={315}
                style={{
                  width: "100%",
                  maxWidth: "20rem",
                  height: "auto",
                  borderRadius: "0.25rem",
                }}
              />
            ) : (
              <span
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "20rem",
                  aspectRatio: "1200 / 630",
                  overflow: "hidden",
                  borderRadius: "0.25rem",
                }}
              >
                <BunnyThumbnail playlistUrl={bunnyPlaylist(doc)} />
              </span>
            )}
            <figcaption style={muted}>
              {value?.image?.asset?._ref
                ? "Share image, cropped to 1200 × 630"
                : "Background of the generated share image (the title is added when the site builds)"}
            </figcaption>
          </figure>
        ) : null}
      </section>
      {props.renderDefault(props)}
    </div>
  );
}

function Meta({
  label,
  source,
  count,
  min,
  max,
}: {
  label: string;
  source: string;
  count?: number;
  min?: number;
  max?: number;
}) {
  let status: ReactNode = null;
  if (count !== undefined && max !== undefined) {
    const off = count > max || (min !== undefined && count < min);
    status = (
      <span style={off ? warning : muted}>
        {" · "}
        {count}/{max} characters{count > max ? ", too long" : off ? ", short" : ""}
      </span>
    );
  }
  return (
    <li>
      <strong style={{ fontWeight: 600 }}>{label}</strong>
      <span style={muted}>: {source}</span>
      {status}
    </li>
  );
}

// Studio UI, not the site: plain styles that follow the Studio's light / dark theme through
// currentColor, since the site's design tokens don't exist here.
const panel: CSSProperties = {
  display: "grid",
  gap: "1rem",
  padding: "1rem",
  border: "1px solid color-mix(in srgb, currentColor 15%, transparent)",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
};
const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  opacity: 0.6,
};
const muted: CSSProperties = { opacity: 0.65 };
const warning: CSSProperties = { margin: 0, color: "#d97706" };
const searchTitle: CSSProperties = { fontSize: "1.125rem", lineHeight: 1.3, fontWeight: 600 };
const meta: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: "0.25rem",
  fontSize: "0.8125rem",
};
