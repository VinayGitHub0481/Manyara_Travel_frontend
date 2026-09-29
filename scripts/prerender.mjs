// This is the Vite-compatible equivalent of "react-snap": it runs AFTER
// `npm run build`, spins up a local static server for the `dist` folder,
// visits every real route in a headless browser, and overwrites each
// route's HTML file with the fully-rendered output (including whatever
// react-helmet-async and your components rendered client-side).
//
// This is what actually lets Google/Bing/link-preview bots see full
// content instead of an empty <div id="root">, without migrating to
// Next.js/SSR.
//
// Usage:
//   npm run build          (writes dist/, and regenerates sitemap.xml)
//   npm run prerender      (needs Chromium - see note below)
//
// Kept as a separate manual step rather than wired into "postbuild" so a
// normal `npm run build` never requires Puppeteer/Chromium to be
// downloadable (handy in restrictive CI or offline environments). Run
// `npm run prerender` as part of your actual deploy pipeline, where
// Puppeteer can download Chromium normally.

import path from "node:path";
import { fileURLToPath } from "node:url";
import Prerenderer from "@prerenderer/prerenderer";
import PuppeteerRenderer from "@prerenderer/renderer-puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:8000";
const DIST_DIR = path.join(__dirname, "..", "dist");

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[prerender] Couldn't fetch ${url} (${err.message}) — skipping those routes`);
    return [];
  }
}

async function getAllRoutes() {
  const [packages, destinations, blogs] = await Promise.all([
    safeFetchJson(`${API_BASE}/packages`),
    safeFetchJson(`${API_BASE}/most-visited`),
    safeFetchJson(`${API_BASE}/blogs`),
  ]);

  return [
    "/",
    "/about",
    "/blog",
    ...packages.map((p) => `/packages/${p.slug || p.id}`),
    ...destinations.map((d) => `/destinations/${d.slug || d.id}`),
    ...blogs.map((b) => `/blog/${b.slug || b.id}`),
  ];
}

async function main() {
  const routes = await getAllRoutes();
  console.log(`[prerender] Rendering ${routes.length} routes...`);

  const prerenderer = new Prerenderer({
    staticDir: DIST_DIR,
    renderer: new PuppeteerRenderer({
      // Simple fixed wait rather than a custom "ready" event: this app's
      // pages fire off 1+ API calls on mount (sometimes several in
      // parallel on the homepage), so a flat delay is far less code to
      // maintain than wiring a synchronized "everything has loaded" event
      // across every section. Raise this if your API is slow enough that
      // pages are still showing loading skeletons at render time.
      renderAfterTime: 4000,
      maxConcurrentRoutes: 4,
      timeout: 20000,
    }),
  });

  try {
    await prerenderer.initialize();
    const renderedRoutes = await prerenderer.renderRoutes(routes);
    await prerenderer.destroy();

    const fs = await import("node:fs");
    for (const route of renderedRoutes) {
      const outputDir = path.join(
        DIST_DIR,
        route.route === "/" ? "" : route.route
      );
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, "index.html"), route.html.trim());
    }

    console.log(`[prerender] Done. Wrote ${renderedRoutes.length} static HTML files.`);
  } catch (err) {
    await prerenderer.destroy();
    console.error("[prerender] Failed:", err);
    process.exit(1);
  }
}

main();
