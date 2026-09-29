
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getMostVisited } from "../api/content";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image.url || image.secure_url || "";
  }

  return "";
}

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Contact us";
  }

  const numericPrice = Number(value);

  if (Number.isNaN(numericPrice)) {
    return String(value);
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
}

/* =========================================================
   DESTINATION CARD
========================================================= */

function DestinationCard({ item }) {
  const placeName =
    item?.place_name?.trim() || "Destination";

  const slug = item?.slug?.trim() || "";

  const image = getImageUrl(item?.image);

  const description =
    item?.description?.trim() || "";

  const bestTime =
    item?.best_time_to_visit?.trim() || "";

  const packageCount = Array.isArray(item?.packages)
    ? item.packages.length
    : 0;

  /*
    A destination must have a slug because the public
    destination URL is:

      /destinations/:slug
  */
  if (!slug) {
    return null;
  }

  return (
    <Link
      to={`/destinations/${slug}`}
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
        transition
        hover:-translate-y-0.5
        hover:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-accent
        focus:ring-offset-2
      "
    >
      {/* =================================================
          IMAGE
      ================================================== */}

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {image ? (
          <img
            src={image}
            alt={`${placeName} — popular travel destination`}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin
              className="h-10 w-10 text-navy/10"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Image gradient */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-navy/60
            via-transparent
            to-transparent
          "
        />

        {/* Destination name on image */}
        <div
          className="
            absolute
            bottom-3
            left-4
            right-4
            flex
            items-center
            gap-1.5
            text-white
          "
        >
          <MapPin
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          />

          <span className="truncate text-sm font-semibold">
            {placeName}
          </span>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================== */}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Explore {placeName}
          </h3>

          {description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-navy/65">
              {description}
            </p>
          )}
        </div>

        {/* Best time */}
        {bestTime && (
          <p className="inline-flex items-center gap-1.5 text-xs text-navy/55">
            <CalendarDays
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />

            Best time: {bestTime}
          </p>
        )}

        {/* =================================================
            PACKAGE INFORMATION
        ================================================== */}

        <div className="mt-auto">
          {packageCount > 0 && (
            <p className="mb-3 text-xs font-medium text-navy/55">
              {packageCount}{" "}
              {packageCount === 1
                ? "holiday package"
                : "holiday packages"}{" "}
              available
            </p>
          )}

          <div className="flex items-end justify-between border-t border-navy/10 pt-3">
            {/* Starting price */}
            <div>
              <p className="text-xs text-navy/50">
                Starting from
              </p>

              <p className="font-display text-lg font-semibold text-navy">
                {formatPrice(item?.starting_from)}
              </p>
            </div>

            {/* CTA */}
            <span
              className="
                inline-flex
                items-center
                gap-1
                text-sm
                font-semibold
                text-accent
              "
            >
              View details

              <ArrowRight
                className="
                  h-4
                  w-4
                  transition-transform
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   MOST VISITED PAGE
========================================================= */

export default function MostVisited() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPlaces = async () => {
      try {
        setLoading(true);

        const response = await getMostVisited();

        /*
          Support both:

            [...]
          
          and:

            { data: [...] }

          and:

            { items: [...] }
        */
        const data =
          response?.data ??
          response?.items ??
          response ??
          [];

        if (!mounted) return;

        const destinationList = Array.isArray(data)
          ? data
          : [];

        /*
          Only published destinations should normally arrive
          from the public backend.

          This extra check keeps the frontend safe if the
          API response ever contains status information.
        */
        const publishedDestinations =
          destinationList.filter(
            (item) =>
              item?.status === undefined ||
              item?.status === "published"
          );

        /*
          Keep the admin-controlled display order.
        */
        publishedDestinations.sort(
          (a, b) =>
            Number(a?.display_order ?? 0) -
            Number(b?.display_order ?? 0)
        );

        setPlaces(publishedDestinations);
      } catch (error) {
        console.error(
          "Failed to load most visited destinations:",
          error
        );

        if (mounted) {
          setPlaces([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <main className="min-h-screen bg-surface">

        {/* =================================================
            HERO
        ================================================== */}

        <section className="border-b border-navy/10 bg-white">
          <div
            className="
              mx-auto
              max-w-6xl
              px-4
              py-6
              sm:px-6
              sm:py-8
              lg:px-8
              lg:py-10
            "
          >
            {/* Back */}
            <Link
              to="/"
              className="
                mb-5
                inline-flex
                items-center
                gap-2
                text-sm
                text-navy/60
                transition
                hover:text-navy
              "
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />

              Back to Home
            </Link>

            <div className="max-w-3xl">

              {/* Eyebrow */}
              <p
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-accent
                "
              >
                <MapPin
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                Traveller favourites
              </p>

              {/* Heading */}
              <h1
                className="
                  mt-1
                  font-display
                  text-2xl
                  font-semibold
                  leading-tight
                  text-navy
                  sm:text-3xl
                  lg:text-4xl
                "
              >
                Most Visited Destinations
              </h1>

              {/* Description */}
              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-navy/60
                  sm:text-base
                "
              >
                Explore destinations loved by our travellers,
                discover the best time to visit, and find
                holiday packages for your next journey.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            DESTINATIONS GRID
        ================================================== */}

        <section
          className="
            mx-auto
            max-w-6xl
            px-4
            py-7
            sm:px-6
            sm:py-9
            lg:px-8
            lg:py-10
          "
        >
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Popular places
            </p>

            <h2
              className="
                mt-1
                font-display
                text-2xl
                font-semibold
                text-navy
                sm:text-3xl
              "
            >
              Pick your next destination
            </h2>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div
              className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                sm:gap-6
                lg:grid-cols-3
              "
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="
                    h-80
                    animate-pulse
                    rounded-2xl
                    border
                    border-navy/10
                    bg-white
                  "
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : places.length === 0 ? (

            /* =================================================
               EMPTY STATE
            ================================================== */

            <div
              className="
                rounded-2xl
                border
                border-navy/10
                bg-white
                p-10
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-accent/10
                "
              >
                <MapPin
                  className="h-7 w-7 text-accent"
                  aria-hidden="true"
                />
              </div>

              <h3
                className="
                  mt-5
                  font-display
                  text-xl
                  font-semibold
                  text-navy
                "
              >
                No destinations published yet
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  text-navy/60
                "
              >
                Destinations will appear here once our team
                adds and publishes them.
              </p>

              <Link
                to="/packages"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-accent
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-accent-hover
                "
              >
                Explore Packages

                <ArrowRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>

          ) : (

            /* =================================================
               DESTINATION CARDS
            ================================================== */

            <div
              className="
                grid
                grid-cols-1
                gap-5
                sm:grid-cols-2
                sm:gap-6
                lg:grid-cols-3
              "
            >
              {places.map((place) => (
                <DestinationCard
                  key={place?.id ?? place?.slug}
                  item={place}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <FAQSection category="most_visited" />

      <Footer />
    </>
  );
}
