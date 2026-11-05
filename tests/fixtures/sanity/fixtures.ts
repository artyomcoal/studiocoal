/**
 * Sanity fixture mode for the e2e tests (CLAUDE.md › Quality › Tests).
 *
 * With `E2E_FIXTURES=1`, the build answers every GROQ query from the committed documents in
 * `dataset.ndjson` (evaluated locally by groq-js), instead of the live dataset. The image and
 * Bunny files those documents point at are served from this folder, both at build time
 * (`installFixtureFetch`: Bunny thumbnail checks, social images) and in
 * the browser (Playwright routes in tests/e2e/test.ts). Nothing reaches Sanity or Bunny, so
 * publishing content never changes the screenshots.
 *
 * `dataset.ndjson` is in Sanity's export format: it could also be imported into a real dataset.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluate, parse } from "groq-js";

/** Dataset name in fixture image URLs (cdn.sanity.io/images/<project>/<dataset>/…). */
export const FIXTURE_DATASET = "e2e-fixtures";
/** Host of the fixture Bunny video (dataset.ndjson). */
export const FIXTURE_BUNNY_HOST = "vz-e2e-fixtures.b-cdn.net";

// Resolved from the working directory: this module also runs from the bundled build output.
const ROOT = resolve(process.cwd(), "tests/fixtures/sanity");

let documents: unknown[] | undefined;
function dataset(): unknown[] {
  documents ??= readFileSync(resolve(ROOT, "dataset.ndjson"), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as unknown);
  return documents;
}

/** Runs a GROQ query against the fixture documents, like `client.fetch` does against the API. */
export async function fetchFixture(
  query: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const tree = parse(query, { params });
  const value = await evaluate(tree, { dataset: dataset(), params });
  return value.get();
}

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  m3u8: "application/vnd.apple.mpegurl",
};

/** An empty HLS playlist: the fixture video never plays, so its poster is what's on screen. */
const EMPTY_PLAYLIST = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:1\n#EXT-X-ENDLIST\n";

export interface FixtureResponse {
  status: number;
  contentType: string;
  body: Buffer;
}

/**
 * The fixture response for an image CDN or Bunny URL, or null when the URL isn't a fixture
 * URL (the caller passes it through). Unknown fixture files answer 404, like the real CDNs.
 */
export function fixtureResponse(url: string): FixtureResponse | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  let file: string;
  if (parsed.hostname === "cdn.sanity.io" && parsed.pathname.split("/")[3] === FIXTURE_DATASET) {
    // /images/<project>/<dataset>/<file>; transformations (?w=…&rect=…) are ignored.
    file = resolve(ROOT, "images", parsed.pathname.split("/").pop() ?? "");
  } else if (parsed.hostname === FIXTURE_BUNNY_HOST) {
    if (parsed.pathname.endsWith("/playlist.m3u8")) {
      return {
        status: 200,
        contentType: CONTENT_TYPES.m3u8,
        body: Buffer.from(EMPTY_PLAYLIST),
      };
    }
    file = resolve(ROOT, "bunny", parsed.pathname.replace(/^\/+/, ""));
  } else {
    return null;
  }
  if (!file.startsWith(ROOT) || !existsSync(file)) {
    return { status: 404, contentType: "text/plain", body: Buffer.from("Not found") };
  }
  const extension = file.split(".").pop() ?? "";
  return {
    status: 200,
    contentType: CONTENT_TYPES[extension] ?? "application/octet-stream",
    body: readFileSync(file),
  };
}

/**
 * Build time: serve fixture URLs from disk for every `fetch` in this process (Bunny thumbnail
 * checks, social image downloads). Everything else goes to the network as usual.
 */
export function installFixtureFetch(): void {
  const original = globalThis.fetch;
  if ((original as { fixtures?: boolean }).fixtures) return;
  const patched = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : String(input);
    const fixture = fixtureResponse(url);
    if (!fixture) return original(input, init);
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    return new Response(method === "HEAD" ? null : new Uint8Array(fixture.body), {
      status: fixture.status,
      headers: { "content-type": fixture.contentType },
    });
  };
  globalThis.fetch = Object.assign(patched, { fixtures: true });
}
