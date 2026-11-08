import { describe, expect, it, vi } from "vitest";
import {
  bunnyPosterPath,
  bunnyPosterSrcSet,
  bunnyThumbnailCandidates,
  bunnyVideoBase,
  bunnyVideoId,
  collectBunnyPlaylists,
  resolveBunnyThumbnail,
} from "./bunny";

const playlist = "https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/playlist.m3u8";

describe("bunnyVideoBase", () => {
  it("strips the playlist file name", () => {
    expect(bunnyVideoBase(playlist)).toBe("https://vz-abc-123.b-cdn.net/9df43d9e-0d5d");
  });

  it("rejects anything that isn't an https playlist URL", () => {
    expect(bunnyVideoBase(null)).toBeNull();
    expect(bunnyVideoBase("not a url")).toBeNull();
    expect(bunnyVideoBase("http://vz-abc.b-cdn.net/id/playlist.m3u8")).toBeNull();
    expect(bunnyVideoBase("https://vz-abc.b-cdn.net/id/video.mp4")).toBeNull();
  });
});

describe("bunnyThumbnailCandidates", () => {
  it("tries the chosen thumbnail, then the first generated frame", () => {
    expect(bunnyThumbnailCandidates(playlist)).toEqual([
      "https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/thumbnail.jpg",
      "https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/thumbnail_1.jpg",
    ]);
    expect(bunnyThumbnailCandidates(undefined)).toEqual([]);
  });
});

describe("resolveBunnyThumbnail", () => {
  const respond = (okUrls: string[]) =>
    vi.fn(
      async (url: string | URL | Request) =>
        new Response(null, { status: okUrls.includes(String(url)) ? 200 : 404 }),
    );

  it("returns the first candidate that exists, sending the referrer", async () => {
    const fetcher = respond(["https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/thumbnail_1.jpg"]);
    await expect(
      resolveBunnyThumbnail(playlist, "https://studiocoal.com/", fetcher as typeof fetch),
    ).resolves.toBe("https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/thumbnail_1.jpg");
    expect(fetcher).toHaveBeenCalledWith(
      "https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/thumbnail.jpg",
      { method: "HEAD", headers: { Referer: "https://studiocoal.com/" } },
    );
  });

  it("returns null when nothing loads, and caches per playlist", async () => {
    const other = "https://vz-abc-123.b-cdn.net/other/playlist.m3u8";
    const fetcher = vi.fn(async () => {
      throw new Error("offline");
    });
    await expect(
      resolveBunnyThumbnail(other, "https://x/", fetcher as typeof fetch),
    ).resolves.toBeNull();
    await resolveBunnyThumbnail(other, "https://x/", fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledTimes(2); // two candidates, once
    await expect(resolveBunnyThumbnail("nope", "https://x/")).resolves.toBeNull();
  });
});

describe("poster helpers", () => {
  const playlist = "https://vz-abc-123.b-cdn.net/9df43d9e-0d5d/playlist.m3u8";

  it("takes the video id from a playlist URL", () => {
    expect(bunnyVideoId(playlist)).toBe("9df43d9e-0d5d");
    expect(bunnyVideoId("https://example.com/video.mp4")).toBeNull();
    expect(bunnyVideoId(null)).toBeNull();
  });

  it("builds the poster paths and srcset", () => {
    expect(bunnyPosterPath("abc", 960)).toBe("/posters/abc-960.webp");
    expect(bunnyPosterSrcSet("abc")).toBe(
      "/posters/abc-480.webp 480w, /posters/abc-720.webp 720w, /posters/abc-960.webp 960w, /posters/abc-1440.webp 1440w",
    );
  });

  it("collects bunnyVideo playlists at any depth, once each", () => {
    const other = "https://vz-abc-123.b-cdn.net/other/playlist.m3u8";
    const content = [
      {
        _type: "work",
        heroMedia: { kind: "video", video: { _type: "bunnyVideo", playlistUrl: playlist } },
      },
      {
        _type: "journal",
        body: [{ _type: "media", video: { _type: "bunnyVideo", playlistUrl: other } }],
      },
      { _type: "work", gallery: [{ video: { _type: "bunnyVideo", playlistUrl: playlist } }] },
      { _type: "bunnyVideo", playlistUrl: "https://example.com/not-a-playlist.mp4" },
      { _type: "bunnyVideo" },
    ];
    expect(collectBunnyPlaylists(content)).toEqual([playlist, other]);
  });
});
