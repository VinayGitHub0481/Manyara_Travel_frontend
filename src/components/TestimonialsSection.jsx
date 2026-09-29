import { useEffect, useRef, useState } from "react";
import {
  Star,
  Quote,
  MessageSquareHeart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTestimonials } from "../api/content";
import { Link } from "react-router-dom";
import ReviewFormModal from "./ReviewFormModal";

/* =========================================================
   STAR RATING
========================================================= */

function Stars({ rating }) {
  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <div
      className="flex gap-0.5 text-accent"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill={i <= safeRating ? "currentColor" : "none"}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function TestimonialCard({ item }) {
  const initials =
    item?.customer_name
      ?.trim()
      ?.split(/\s+/)
      ?.map((name) => name[0])
      ?.slice(0, 2)
      ?.join("")
      ?.toUpperCase() || "TR";

  const reviewSlug = item?.slug;

  return (
    <Link
      to={reviewSlug ? `/reviews/${reviewSlug}` : "/reviews"}
      className="group block h-full w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:rounded-3xl"
      aria-label={`Read ${item?.customer_name || "traveller"}'s review`}
    >
      <article className="relative flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:min-h-[340px] sm:rounded-3xl sm:p-6 lg:min-h-[360px] lg:p-6 xl:min-h-[370px]">
        {/* Quote Icon */}
        <Quote
          className="pointer-events-none absolute right-5 top-5 h-9 w-9 text-surface sm:right-6 sm:top-6 sm:h-10 sm:w-10"
          aria-hidden="true"
        />

        {/* Rating */}
        <div className="shrink-0">
          <Stars rating={item?.rating} />
        </div>

        {/* Review */}
        <div className="mt-4 flex-1">
          <p className="line-clamp-6 pr-7 text-sm leading-6 text-navy/75 sm:text-base sm:leading-7">
            “{item?.review || "A wonderful travel experience."}”
          </p>
        </div>

        {/* Customer Details */}
        <div className="mt-5 flex min-w-0 items-center gap-3 border-t border-navy/10 pt-4 sm:mt-6">
          {/* Customer Image / Initials */}
          {item?.image?.url ? (
            <img
              src={item.image.url}
              loading="lazy"
              decoding="async"
              alt={`${item?.customer_name || "Traveller"} profile`}
              className="h-11 w-11 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-xs font-semibold text-secondary sm:h-12 sm:w-12"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          {/* Name + City + Destination */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy sm:text-base">
              {item?.customer_name || "Traveller"}
            </p>

            <p className="mt-0.5 truncate text-xs text-navy/55 sm:text-sm">
              {item?.customer_city || "Traveller"}

              {item?.destination && (
                <>
                  <span className="mx-1">·</span>
                  {item.destination}
                </>
              )}
            </p>
          </div>

          {/* Small arrow indicator */}
          <ArrowRight
            className="h-4 w-4 shrink-0 text-navy/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent"
            aria-hidden="true"
          />
        </div>
      </article>
    </Link>
  );
}

/* =========================================================
   MAIN TESTIMONIALS SECTION
========================================================= */

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);

  const carouselRef = useRef(null);

  const openReviewForm = () => setReviewOpen(true);

  /* =========================================================
     LOAD PUBLISHED TESTIMONIALS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    getTestimonials()
      .then((data) => {
        if (!mounted) return;

        setTestimonials(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!mounted) return;

        console.error("Failed to load testimonials:", error);

        setTestimonials([]);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     SCROLL ONE CARD AT A TIME
  ========================================================= */

  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const firstCard = container.querySelector("[data-testimonial-card]");

    if (!firstCard) {
      return;
    }

    const cardWidth = firstCard.getBoundingClientRect().width;

    const computedStyle = window.getComputedStyle(container);

    const gap =
      parseFloat(computedStyle.columnGap) ||
      parseFloat(computedStyle.gap) ||
      24;

    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="testimonials"
      className="w-full overflow-hidden py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =================================================
            SECTION HEADING
            Title on the left, review button on the right.
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-hover">
              <MessageSquareHeart
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              Real trips, real words
            </p>

            <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              TRAVELLER STORIES
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/60 sm:text-base">
              Real experiences from travellers who explored destinations with
              On a Trip Holiday.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {/* Desktop View More */}
            {testimonials.length > 0 && (
              <Link
                to="/reviews"
                className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-secondary transition-colors hover:text-accent hover:underline sm:inline-flex"
              >
                View More Reviews

                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}

            {/* Open the review form */}
            <button
              type="button"
              onClick={openReviewForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:text-base"
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Your Valuable Review
            </button>
          </div>
        </div>

        {/* =================================================
            LOADING SKELETON
        ================================================= */}

        {loading ? (
          <div className="flex gap-5 overflow-hidden sm:gap-6 lg:gap-7">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full basis-full shrink-0 sm:w-[calc(50%-12px)] sm:basis-auto lg:w-[calc(25%-21px)]"
              >
                <div className="h-[320px] animate-pulse rounded-2xl bg-surface sm:h-[340px] sm:rounded-3xl lg:h-[360px]" />
              </div>
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          /* =================================================
              EMPTY STATE
              (keeps the review button reachable before the
              first review is published)
          ================================================= */

          <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <MessageSquareHeart
                className="h-7 w-7 text-accent"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-5 font-display text-xl font-semibold text-navy">
              Be the first to share your experience
            </h3>

            <p className="mx-auto mb-6 mt-2 max-w-md text-sm text-navy/60">
              Your experience can help other travellers plan their next
              journey.
            </p>

            <button
              type="button"
              onClick={openReviewForm}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-hover"
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Write a Review
            </button>
          </div>
        ) : (
          <>
            {/* =================================================
                CAROUSEL

                Mobile:  1 full card
                Tablet:  exactly 2 cards
                Desktop: exactly 4 cards
            ================================================= */}

            <div className="relative">
              {/* LEFT BUTTON */}

              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                aria-label="Previous testimonials"
                className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy shadow-xl transition-all duration-300 hover:scale-105 hover:bg-navy hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:h-12 sm:w-12"
              >
                <ChevronLeft
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  aria-hidden="true"
                />
              </button>

              <div
                ref={carouselRef}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 lg:gap-7"
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={
                      testimonial?.id ||
                      testimonial?.slug ||
                      testimonial?.customer_name
                    }
                    data-testimonial-card
                    className="w-full basis-full shrink-0 snap-start sm:w-[calc(50%-12px)] sm:basis-auto lg:w-[calc(25%-21px)]"
                  >
                    <TestimonialCard item={testimonial} />
                  </div>
                ))}
              </div>

              {/* RIGHT BUTTON */}

              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                aria-label="Next testimonials"
                className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy shadow-xl transition-all duration-300 hover:scale-105 hover:bg-navy hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:h-12 sm:w-12"
              >
                <ChevronRight
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* =================================================
                MOBILE VIEW MORE
            ================================================= */}

            <div className="mt-7 flex justify-center sm:hidden">
              <Link
                to="/reviews"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <span>View More Reviews</span>

                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* =================================================
          REVIEW FORM POP-UP
      ================================================= */}

      <ReviewFormModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </section>
  );
}


