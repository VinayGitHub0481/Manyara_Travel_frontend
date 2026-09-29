import { Helmet } from "react-helmet-async";

const SITE_NAME = "On a Trip Holiday";
const SITE_URL = "https://onatripholidays.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

/**
 * Drop this at the top of any page/route to control that page's <title>,
 * meta description, canonical URL, Open Graph/Twitter tags, and optional
 * JSON-LD structured data.
 *
 * `jsonLd` accepts a single schema object OR an array of schema objects
 * (e.g. a page's main schema + a BreadcrumbList).
 */
export default function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Travel Packages, Planned Simply`;
  const canonical = `${SITE_URL}${path}`;
  const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_URL };
