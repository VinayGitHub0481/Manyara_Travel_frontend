


import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ImageOff,
  MapPin,
} from "lucide-react";

import { getUpcomingBatches } from "../api/content";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import FAQSection from "../components/FAQSection";

/* ============================================================
   HELPERS
   ============================================================ */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image?.url || "";
  }

  return "";
};

const getBatchImage = (batch) => {
  const images = batch?.package?.images;

  if (!Array.isArray(images) || images.length === 0) {
    return "";
  }

  return (
    images
      .map(getImageUrl)
      .find((url) => Boolean(url)) || ""
  );
};

const formatDate = (dateString) => {
  if (!dateString) {
    return "Date on request";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price on request";
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

const getDurationText = (batch) => {
  const days = Number(batch?.duration_days);
  const nights = Number(batch?.duration_nights);

  if (Number.isFinite(days) && Number.isFinite(nights)) {
    return `${days} ${days === 1 ? "day" : "days"} / ${nights} ${
      nights === 1 ? "night" : "nights"
    }`;
  }

  if (Number.isFinite(days)) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (Number.isFinite(nights)) {
    return `${nights} ${nights === 1 ? "night" : "nights"}`;
  }

  return "Flexible duration";
};

const getAvailabilityLabel = (availability) => {
  switch (availability) {
    case "open":
      return "Available";

    case "limited":
      return "Limited Seats";

    case "almost_full":
      return "Almost Full";

    case "full":
      return "Fully Booked";

    case "closed":
      return "Closed";

    default:
      return "Availability on request";
  }
};

const getAvailabilityClasses = (availability) => {
  switch (availability) {
    case "open":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "limited":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "almost_full":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "full":
      return "bg-red-50 text-red-700 border-red-100";

    case "closed":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

/* ============================================================
   BATCH CARD
   ============================================================ */

function BatchCard({ batch }) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = getBatchImage(batch);

  const batchHref = batch?.slug
    ? `/batches/${encodeURIComponent(batch.slug)}`
    : `/batches/${batch?.id}`;

  const packageTitle =
    batch?.package?.title || "Holiday Package";

  const destination =
    batch?.package?.destination || "India";

  const availability =
    batch?.availability || "open";

  return (
    <article
      className="
        group
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-navy/10
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <Link
        to={batchHref}
        className="flex h-full flex-col"
        aria-label={`View ${packageTitle} trip details`}
      >
        {/* =====================================================
            IMAGE
        ===================================================== */}

        <div
          className="
            relative
            aspect-[16/9]
            w-full
            shrink-0
            overflow-hidden
            bg-surface
          "
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`${packageTitle} - ${destination}`}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                group-hover:scale-[1.04]
              "
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                bg-surface
              "
            >
              <ImageOff
                className="h-8 w-8 text-navy/20"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Image overlay */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/55
              via-black/5
              to-transparent
            "
          />

          {/* Availability */}
          <div className="absolute left-3 top-3">
            <span
              className={`
                inline-flex
                items-center
                rounded-full
                border
                px-2.5
                py-1
                text-[11px]
                font-semibold
                shadow-sm
                backdrop-blur-sm
                ${getAvailabilityClasses(availability)}
              `}
            >
              {getAvailabilityLabel(availability)}
            </span>
          </div>

          {/* Destination on image */}
          <div
            className="
              absolute
              bottom-3
              left-3
              right-3
              flex
              min-w-0
              items-center
              gap-1.5
              text-xs
              font-medium
              text-white
            "
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">
              {destination}
            </span>
          </div>
        </div>

        {/* =====================================================
            CARD CONTENT
        ===================================================== */}

        <div
          className="
            flex
            flex-1
            flex-col
            p-4
            sm:p-5
          "
        >
          {/* Destination */}
          <div
            className="
              flex
              items-center
              gap-1.5
              text-[11px]
              font-medium
              uppercase
              tracking-wide
              text-navy/45
            "
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">
              {destination}
            </span>
          </div>

          {/* Title */}
          <h2
            className="
              mt-1.5
              line-clamp-2
              font-display
              text-lg
              font-semibold
              leading-snug
              text-navy
              transition-colors
              group-hover:text-accent
              sm:text-xl
            "
          >
            {packageTitle}
          </h2>

          {/* =================================================
              DATES
              ================================================= */}

          <div
            className="
              mt-4
              grid
              grid-cols-2
              gap-3
              border-t
              border-navy/10
              pt-3.5
            "
          >
            {/* Departure */}
            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-navy/40
                "
              >
                <CalendarDays
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />

                <span>Departure</span>
              </div>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  font-semibold
                  text-navy/75
                  sm:text-sm
                "
              >
                {formatDate(batch?.departure_date)}
              </p>
            </div>

            {/* Return */}
            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-wide
                  text-navy/40
                "
              >
                <CalendarDays
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />

                <span>Return</span>
              </div>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  font-semibold
                  text-navy/75
                  sm:text-sm
                "
              >
                {formatDate(batch?.return_date)}
              </p>
            </div>
          </div>

          {/* =================================================
              PRICE + DURATION
              ================================================= */}

          <div
            className="
              mt-4
              flex
              items-end
              justify-between
              gap-3
            "
          >
            {/* Price */}
            <div className="min-w-0">
              <p className="text-[10px] text-navy/40 sm:text-xs">
                Starting from
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-base
                  font-bold
                  text-navy
                  sm:text-lg
                "
              >
                {formatPrice(batch?.price_per_person)}
              </p>

              {batch?.price_per_person !== null &&
                batch?.price_per_person !== undefined && (
                  <p className="text-[10px] text-navy/40 sm:text-xs">
                    per person
                  </p>
                )}
            </div>

            {/* Duration */}
            <div
              className="
                flex
                max-w-[48%]
                items-center
                justify-end
                gap-1.5
                text-right
                text-[11px]
                font-medium
                text-navy/55
                sm:text-xs
              "
            >
              <Clock3
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />

              <span className="line-clamp-2">
                {getDurationText(batch)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="
              mt-auto
              flex
              items-center
              justify-between
              gap-3
              border-t
              border-navy/10
              pt-4
              sm:mt-5
            "
          >
            <span
              className="
                text-xs
                font-semibold
                text-accent
                sm:text-sm
              "
            >
              View Trip Details
            </span>

            <span
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-accent/10
                text-accent
                transition-all
                duration-200
                group-hover:bg-accent
                group-hover:text-white
              "
            >
              <ArrowRight
                className="
                  h-3.5
                  w-3.5
                  transition-transform
                  duration-200
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ============================================================
   BATCH SKELETON
   ============================================================ */

function BatchSkeleton() {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-navy/10
        bg-white
      "
      aria-hidden="true"
    >
      {/* Image */}
      <div
        className="
          aspect-[16/9]
          animate-pulse
          bg-navy/5
        "
      />

      {/* Content */}
      <div className="space-y-4 p-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-navy/10" />

        <div className="space-y-2">
          <div className="h-5 w-[88%] animate-pulse rounded bg-navy/10" />
          <div className="h-5 w-[62%] animate-pulse rounded bg-navy/10" />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-navy/10 pt-4">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-navy/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-navy/10" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-navy/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-navy/10" />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-navy/10" />
            <div className="h-5 w-28 animate-pulse rounded bg-navy/10" />
          </div>

          <div className="h-4 w-24 animate-pulse rounded bg-navy/10" />
        </div>

        <div className="flex justify-between border-t border-navy/10 pt-4">
          <div className="h-4 w-28 animate-pulse rounded bg-navy/10" />
          <div className="h-7 w-7 animate-pulse rounded-full bg-navy/10" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEO STRUCTURED DATA
   ============================================================ */

function BatchStructuredData({ batches, siteUrl }) {
  const itemList = batches.map((batch, index) => {
    const title =
      batch?.package?.title || "Holiday Package";

    const destination =
      batch?.package?.destination || "India";

    const slug = batch?.slug
      ? encodeURIComponent(batch.slug)
      : batch?.id;

    return {
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/batches/${slug}`,
      name: `${title} - ${destination}`,
    };
  });

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Upcoming Trips - On a Trip Holidays",
      description:
        "Upcoming scheduled trips, departures and holiday packages from On a Trip Holidays.",
      numberOfItems: batches.length,
      itemListElement: itemList,
    },

    ...batches.slice(0, 20).map((batch) => {
      const title =
        batch?.package?.title || "Holiday Package";

      const destination =
        batch?.package?.destination || "India";

      const slug = batch?.slug
        ? encodeURIComponent(batch.slug)
        : batch?.id;

      return {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: title,
        description: `Upcoming ${title} trip to ${destination}.`,
        url: `${siteUrl}/batches/${slug}`,
        touristType: "Leisure travelers",
        itinerary: {
          "@type": "ItemList",
          name: title,
        },
        offers:
          batch?.price_per_person !== null &&
          batch?.price_per_person !== undefined
            ? {
                "@type": "Offer",
                price: Number(batch.price_per_person),
                priceCurrency: "INR",
                availability:
                  batch?.availability === "full"
                    ? "https://schema.org/SoldOut"
                    : "https://schema.org/InStock",
              }
            : undefined,
      };
    }),
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`batch-schema-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================================
     FETCH
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUpcomingBatches();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : [];

        if (!cancelled) {
          setBatches(data);
        }
      } catch (err) {
        console.error(
          "Failed to load upcoming batches:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to load upcoming trips right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     SEO
     ========================================================== */

  const siteUrl =
    import.meta.env.VITE_SITE_URL ||
    "https://onatripholidays.com";

  const canonicalUrl = `${siteUrl}/batches`;

  const seoTitle =
    "Upcoming Trips & Holiday Batches | On a Trip Holidays";

  const seoDescription =
    "Explore upcoming trips and scheduled holiday batches from On a Trip Holidays. Check departure dates, return dates, destinations, trip durations and prices.";

  /* ==========================================================
     SUMMARY
     ========================================================== */

  const tripCountText = useMemo(() => {
    if (batches.length === 1) {
      return "1 upcoming trip";
    }

    return `${batches.length} upcoming trips`;
  }, [batches.length]);

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
      />

      {!loading && batches.length > 0 && (
        <BatchStructuredData
          batches={batches}
          siteUrl={siteUrl}
        />
      )}

      <main className="min-h-screen bg-white">
        {/* ====================================================
            HERO
            ==================================================== */}

        <section
          className="
            border-b
            border-navy/10
            bg-surface
          "
        >
          <div
            className="
              mx-auto
              max-w-7xl
              px-4
              py-8
              sm:px-6
              sm:py-10
              lg:px-8
              lg:py-12
            "
          >
            <div className="max-w-3xl">
              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-accent
                  sm:text-xs
                "
              >
                Travel with On a Trip
              </p>

              <h1
                className="
                  mt-1.5
                  font-display
                  text-3xl
                  font-semibold
                  leading-tight
                  text-navy
                  sm:text-4xl
                  lg:text-5xl
                "
              >
                Upcoming Trips
              </h1>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-navy/60
                  sm:text-base
                  sm:leading-7
                "
              >
                Explore scheduled departures, destinations,
                travel dates and holiday packages for your
                next journey.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            RESULTS
            ==================================================== */}

        <section
          className="
            bg-white
            py-8
            sm:py-10
            lg:py-12
          "
        >
          <div
            className="
              mx-auto
              max-w-7xl
              px-4
              sm:px-6
              lg:px-8
            "
          >
            {/* Results heading */}
            {!loading && !error && batches.length > 0 && (
              <div
                className="
                  mb-5
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <h2
                    className="
                      font-display
                      text-xl
                      font-semibold
                      text-navy
                      sm:text-2xl
                    "
                  >
                    Scheduled Departures
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-navy/50
                      sm:text-sm
                    "
                  >
                    {tripCountText}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                LOADING
                ================================================= */}

            {loading && (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                  xl:gap-6
                "
              >
                {Array.from({ length: 6 }).map(
                  (_, index) => (
                    <BatchSkeleton key={index} />
                  )
                )}
              </div>
            )}

            {/* =================================================
                ERROR
                ================================================= */}

            {!loading && error && (
              <div
                className="
                  mx-auto
                  max-w-xl
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-6
                  text-center
                  sm:p-8
                "
              >
                <h2
                  className="
                    font-display
                    text-lg
                    font-semibold
                    text-navy
                    sm:text-xl
                  "
                >
                  Couldn't load upcoming trips
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-navy/60
                  "
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-accent
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition-colors
                    hover:bg-accent-hover
                  "
                >
                  Try Again

                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}

            {/* =================================================
                EMPTY
                ================================================= */}

            {!loading &&
              !error &&
              batches.length === 0 && (
                <div
                  className="
                    mx-auto
                    max-w-xl
                    rounded-2xl
                    border
                    border-navy/10
                    bg-surface
                    p-8
                    text-center
                    sm:p-10
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-navy/10
                      bg-white
                    "
                  >
                    <CalendarDays
                      className="
                        h-5
                        w-5
                        text-navy/40
                      "
                      aria-hidden="true"
                    />
                  </div>

                  <h2
                    className="
                      mt-4
                      font-display
                      text-xl
                      font-semibold
                      text-navy
                    "
                  >
                    No Upcoming Trips
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-md
                      text-sm
                      leading-6
                      text-navy/60
                    "
                  >
                    There are currently no upcoming trips
                    available. Please check back soon for
                    new departures.
                  </p>

                  <Link
                    to="/packages"
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-navy/15
                      bg-white
                      px-5
                      py-2.5
                      text-sm
                      font-semibold
                      text-navy
                      transition-colors
                      hover:border-accent
                      hover:text-accent
                    "
                  >
                    Explore Packages

                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              )}

            {/* =================================================
                BATCH GRID
                ================================================= */}

            {!loading &&
              !error &&
              batches.length > 0 && (
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-5
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:gap-6
                  "
                >
                  {batches.map((batch) => (
                    <BatchCard
                      key={batch?.id || batch?.slug}
                      batch={batch}
                    />
                  ))}
                </div>
              )}
          </div>
        </section>
      </main>

      {/* ======================================================
          FAQ
          ====================================================== */}

      <FAQSection category="batches" />

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <Footer />
    </>
  );
}
