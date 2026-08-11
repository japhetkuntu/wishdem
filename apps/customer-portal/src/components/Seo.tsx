import { useEffect } from "react";

/**
 * index.html only ever ships one static set of title/description/OG tags, so
 * without this every route — the marketing homepage, the login screen, a
 * stranger's private wish-opening link — would show up in search results and
 * social-media unfurls with identical copy. Each routed page renders one of
 * these with its own title/description, and personal or authenticated-only
 * pages set `noindex` so they never appear in search results at all.
 *
 * Deliberately not react-helmet-async: that library's side effects don't
 * reliably commit under React 18 StrictMode's double-invocation (a long
 * standing, still-unresolved issue in the library) — this plain useEffect
 * upsert is a few lines, has no third-party StrictMode risk, and is
 * idempotent, so the double-invoke in dev is harmless.
 */
export const SITE_NAME = "WishDem";
export const SITE_URL = "https://wishdem.com";
const DEFAULT_IMAGE = `${SITE_URL}/themes/home-hero.webp`;

export interface SeoProps {
  /** Full <title> text, e.g. "How It Works — WishDem". */
  title: string;
  description: string;
  /** Route path this page is mounted at, e.g. "/how-it-works" — used to build
   * the canonical URL and og:url. */
  path: string;
  /** Set on authenticated-only pages and personal/link-only pages (a
   * recipient's wish, a guest contribution link, an invitation) — nothing
   * behind a login wall or addressed to one specific person belongs in
   * search results. */
  noindex?: boolean;
  /** Absolute URL to an OG/Twitter preview image; defaults to the site's
   * general hero image. */
  image?: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonicalLink(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, path, noindex = false, image = DEFAULT_IMAGE }: SeoProps) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertCanonicalLink(url);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
  }, [title, description, path, noindex, image]);

  return null;
}
