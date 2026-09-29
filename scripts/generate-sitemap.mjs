// Runs automatically before `npm run build` (see the "prebuild" script in
// package.json). It asks your FastAPI backend for the current packages,
// destinations, and blog posts, then writes public/sitemap.xml so the
// sitemap always reflects what's actually published - no manual upkeep.
//
// Requires Node 18+ (built-in fetch). Set VITE_API_BASE_URL in your .env
// or it falls back to http://localhost:8000.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://onatripholidays.com";
const API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:8000";

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Skipping ${url} — ${err.message}`);
    return [];
  }
}

function urlEntry(loc, { changefreq = "weekly", priority = "0.7" } = {}) {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const [packages, destinations, blogs] = await Promise.all([
    safeFetchJson(`${API_BASE}/packages`),
    safeFetchJson(`${API_BASE}/most-visited`),
    safeFetchJson(`${API_BASE}/blogs`),
  ]);

  const entries = [
    urlEntry(`${SITE_URL}/`, { changefreq: "daily", priority: "1.0" }),
    urlEntry(`${SITE_URL}/about`, { changefreq: "monthly", priority: "0.5" }),
    urlEntry(`${SITE_URL}/blog`, { changefreq: "daily", priority: "0.8" }),
    ...packages.map((p) =>
      urlEntry(`${SITE_URL}/packages/${p.slug || p.id}`, { priority: "0.9" })
    ),
    ...destinations.map((d) =>
      urlEntry(`${SITE_URL}/destinations/${d.slug || d.id}`, { priority: "0.8" })
    ),
    ...blogs.map((b) =>
      urlEntry(`${SITE_URL}/blog/${b.slug || b.id}`, { changefreq: "monthly", priority: "0.6" })
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");
  console.log(`[sitemap] Wrote ${entries.length} URLs to ${outPath}`);
}

main();
