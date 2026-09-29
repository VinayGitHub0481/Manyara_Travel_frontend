

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Heart,
  Images,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getHappyMoments } from "../api/content";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";


/* =========================================================
   IMAGE HELPER
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


/* =========================================================
   DATE HELPER
========================================================= */

function formatTravelDate(value) {
  if (!value) return "";

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return String(value);
  }
}


/* =========================================================
   HAPPY MOMENT CARD
========================================================= */

function HappyMomentCard({ item }) {
  const title =
    item?.title?.trim() || "Happy Travel Moment";

  const placeName = item?.place_name?.trim() || "";

  const caption =
    item?.short_caption?.trim() ||
    item?.place_description?.trim() ||
    "";

  const coverImage = getImageUrl(item?.image);

  const galleryCount = Array.isArray(item?.gallery_images)
    ? item.gallery_images.length
    : 0;

  const totalPhotos =
    (coverImage ? 1 : 0) + galleryCount;

  const travelDate = formatTravelDate(item?.travel_date);

  return (
    <Link
      to={`/happy-moments/${item?.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition hover:shadow-lg"
    >
      {/* Cover */}

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {coverImage ? (
          <img
            src={coverImage}
            alt={
              placeName
                ? `${title} in ${placeName}`
                : title
            }
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Heart
              className="h-10 w-10 text-navy/10"
              aria-hidden="true"
            />
          </div>
        )}

        {totalPhotos > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Images
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {totalPhotos} Photos
          </span>
        )}
      </div>

      {/* Content */}

      <div className="flex flex-1 flex-col gap-3 p-5">
        {placeName && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
            <MapPin
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {placeName}
          </p>
        )}

        <h3 className="font-display text-lg font-semibold text-navy leading-snug">
          {title}
        </h3>

        {caption && (
          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-navy/65">
            {caption}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between border-t border-navy/10 pt-3">
          {travelDate ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-navy/55">
              <CalendarDays
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              {travelDate}
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Read story
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}


/* =========================================================
   HAPPY MOMENTS PAGE
========================================================= */

export default function HappyMoments() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMoments = async () => {
      try {
        setLoading(true);

        const response = await getHappyMoments();

        const data = response?.data ?? response ?? [];

        if (!mounted) return;

        setMoments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Failed to load happy moments:",
          error
        );

        if (mounted) {
          setMoments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMoments();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <main className="min-h-screen bg-surface">

      {/* =================================================
        HERO
    ================================================= */}
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
        <Link
          to="/"
          className="
            mb-4
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
            <Heart
              className="h-4 w-4 mb-1"
              fill="currentColor"
              aria-hidden="true"
            />
            Memories from our travellers
          </p>

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
            Happy Moments
          </h1>

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
            Real journeys, real smiles. Explore travel
            memories created with On a Trip Holidays.
          </p>
        </div>
      </div>
    </section>

        {/* =================================================
            GRID
        ================================================= */}

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Travel stories
        </p>

        <h2 className="mt-1 font-display text-2xl font-semibold text-navy sm:text-3xl">
          Moments worth remembering
        </h2>
      </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-navy/10 bg-white"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : moments.length === 0 ? (
            <div className="rounded-2xl border border-navy/10 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Heart
                  className="h-7 w-7 text-accent"
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold text-navy">
                No happy moments yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-navy/60">
                Travel stories will appear here once our
                team publishes them.
              </p>

              <Link
                to="/packages"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-hover"
              >
                Explore Packages
                <ArrowRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {moments.map((moment) => (
                <HappyMomentCard
                  key={moment.id || moment.slug}
                  item={moment}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <FAQSection category="general" />

      <Footer />
    </>
  );
}


