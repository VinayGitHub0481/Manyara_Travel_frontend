

import { useEffect, useRef, useState } from "react";
import { Heart, MapPin, Quote, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFeaturedHappyMoments } from "../api/content";

const AUTO_SCROLL_INTERVAL = 2000;
const AUTO_SCROLL_DURATION = 700;

/*
 * Responsive card sizing (flex-basis at EVERY breakpoint so nothing conflicts):
 *   mobile  (<640px)  -> 1 card   (gap-5 = 20px)
 *   sm      (>=640px) -> 2 cards  (gap-6 = 24px -> 50% - 12px)
 *   lg      (>=1024px)-> 4 cards  (gap-7 = 28px -> 25% - 21px)
 */
const CARD_SIZE_CLASSES =
  "min-w-0 shrink-0 grow-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-21px)]";

export default function HappyMomentsSection() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const isPausedRef = useRef(false);

  // Keep the scroll calculations aligned with the actual responsive CSS gap.
  const getCarouselGap = (container) => {
    if (!container) return 0;

    const styles = window.getComputedStyle(container);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");

    return Number.isFinite(gap) ? gap : 0;
  };

  // Returns { step, setWidth } for the current screen size.
  const getMeasurements = () => {
    const container = carouselRef.current;
    if (!container || moments.length === 0) return null;

    const firstCard = container.querySelector("[data-happy-moment-card]");
    if (!firstCard) return null;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = getCarouselGap(container);
    const step = cardWidth + gap;

    return { container, step, setWidth: moments.length * step };
  };

  /* ============================================================
     FETCH HAPPY MOMENTS
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    getFeaturedHappyMoments(6)
      .then((data) => {
        if (!mounted) return;

        const sortedMoments = Array.isArray(data)
          ? [...data].sort(
              (a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0)
            )
          : [];

        setMoments(sortedMoments.slice(0, 6));
      })
      .catch((error) => {
        console.error("Happy moments loading failed:", error);

        if (mounted) {
          setMoments([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     RESET INFINITE LOOP POSITION

     We render [copy 1] [copy 2] [copy 3] and start at copy 2.
     When we drift towards either end, we silently jump by exactly
     one set of cards so the loop looks continuous.
  ============================================================ */

  const resetInfinitePosition = () => {
    const m = getMeasurements();
    if (!m) return;

    const { container, setWidth } = m;

    if (container.scrollLeft >= setWidth * 2) {
      container.scrollLeft -= setWidth;
    }

    if (container.scrollLeft < setWidth * 0.5) {
      container.scrollLeft += setWidth;
    }
  };

  /* ============================================================
     SNAP TO NEAREST CARD

     If the user hovers mid-animation, the carousel can stop
     between two cards (cutting a card off). This re-aligns it.
  ============================================================ */

  const alignToNearestCard = () => {
    const m = getMeasurements();
    if (!m) return;

    const { container, step } = m;
    container.scrollLeft = Math.round(container.scrollLeft / step) * step;
  };

  /* ============================================================
     SMOOTH SCROLL ONE CARD TO LEFT
  ============================================================ */

  const scrollOneCardLeft = () => {
    const m = getMeasurements();

    if (!m || isPausedRef.current) return;

    const { container, step } = m;

    const startPosition = container.scrollLeft;
    const targetPosition = startPosition + step;
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (isPausedRef.current) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / AUTO_SCROLL_DURATION, 1);

      // Smooth ease-in-out.
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      container.scrollLeft =
        startPosition + (targetPosition - startPosition) * easedProgress;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;

        resetInfinitePosition();
        scheduleNextScroll();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  /* ============================================================
     WAIT 2 SECONDS BEFORE NEXT CARD
  ============================================================ */

  const scheduleNextScroll = () => {
    if (isPausedRef.current || moments.length === 0) return;

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }

    autoScrollTimerRef.current = setTimeout(() => {
      scrollOneCardLeft();
    }, AUTO_SCROLL_INTERVAL);
  };

  /* ============================================================
     PAUSE / RESUME
  ============================================================ */

  const pauseCarousel = () => {
    isPausedRef.current = true;

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resumeCarousel = () => {
    isPausedRef.current = false;

    // Make sure no card is left cut off after an interrupted animation.
    alignToNearestCard();

    scheduleNextScroll();
  };

  /* ============================================================
     INITIALISE AUTO CAROUSEL
  ============================================================ */

  useEffect(() => {
    if (loading || moments.length === 0) return;

    const startCarousel = () => {
      const m = getMeasurements();
      if (!m) return;

      // Start from the middle copy.
      m.container.scrollLeft = m.setWidth;

      scheduleNextScroll();
    };

    // Let the browser finish rendering before measuring card widths.
    const frame = requestAnimationFrame(startCarousel);

    return () => {
      cancelAnimationFrame(frame);

      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, moments]);

  /* ============================================================
     HANDLE RESIZE
  ============================================================ */

  useEffect(() => {
    if (loading || moments.length === 0) return;

    const handleResize = () => {
      const m = getMeasurements();
      if (!m) return;

      // Keep the carousel on the middle copy after width changes.
      m.container.scrollLeft = m.setWidth;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, moments]);

  /* ============================================================
     OPEN DETAIL PAGE
  ============================================================ */

  const openMoment = (slug) => {
    if (!slug) return;

    navigate(`/happy-moments/${slug}`);
  };

  /* ============================================================
     EMPTY STATE
  ============================================================ */

  if (!loading && moments.length === 0) {
    return null;
  }

  /* ============================================================
     CREATE INFINITE LOOP DATA  ->  [copy 1] [copy 2] [copy 3]
  ============================================================ */

  const carouselMoments = [...moments, ...moments, ...moments];

  return (
    <section
      id="happy-moments"
      className="w-full overflow-hidden bg-[#061B45] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* ======================================================
            SECTION HEADER
        ====================================================== */}

        <div className="mb-8 text-center sm:mb-10 lg:mb-12">
          <p className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5A2A] sm:text-sm sm:tracking-[0.2em]">
            <Heart
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
              fill="currentColor"
            />

            <span>Real trips, real people</span>
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Happy Moments
          </h2>

          <p className="mx-auto mt-4 max-w-2xl px-2 text-sm leading-7 text-white/75 sm:px-0 sm:text-base">
            Real memories from travellers who explored beautiful destinations
            with On a Trip Holiday.
          </p>
        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div className="flex gap-5 overflow-hidden sm:gap-6 lg:gap-7">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${CARD_SIZE_CLASSES} overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm sm:rounded-3xl`}
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-[#E9EDF2]" />

                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="h-4 w-28 animate-pulse rounded bg-[#E9EDF2]" />
                  <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-[#E9EDF2]" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#E9EDF2]" />
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-[#E9EDF2]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ==================================================
                INFINITE HAPPY MOMENTS CAROUSEL
            ================================================== */}

            <div
              className="relative w-full"
              onMouseEnter={pauseCarousel}
              onMouseLeave={resumeCarousel}
              onFocus={pauseCarousel}
              onBlur={(event) => {
                // Resume only when focus leaves the entire carousel.
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  resumeCarousel();
                }
              }}
            >
              {/*
                CAROUSEL ROW
                NOTE: no `scroll-smooth`, `snap-x` or `snap-mandatory` here.
                Scrolling is animated manually with requestAnimationFrame, and
                those classes would fight the animation and make the silent
                loop reset visibly scroll backwards.
              */}
              <div
                ref={carouselRef}
                className="flex w-full gap-5 overflow-x-hidden sm:gap-6 lg:gap-7"
              >
                {carouselMoments.map((moment, index) => {
                  const imageUrl = moment?.image?.url;
                  const placeName = moment?.place_name?.trim();
                  const title = moment?.title?.trim();
                  const shortCaption = moment?.short_caption?.trim();
                  const slug = moment?.slug;

                  return (
                    <article
                      key={`${moment?.id}-${index}`}
                      data-happy-moment-card
                      onClick={() => openMoment(slug)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openMoment(slug);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={
                        title
                          ? `View ${title}`
                          : placeName
                          ? `View happy moment from ${placeName}`
                          : "View happy travel moment"
                      }
                      className={`group ${CARD_SIZE_CLASSES} cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A2A] focus:ring-offset-2 focus:ring-offset-[#061B45] sm:rounded-3xl`}
                    >
                      {/* ======================================
                          IMAGE
                      ======================================= */}

                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E9EDF2]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            loading={index < 4 ? "eager" : "lazy"}
                            decoding="async"
                            alt={
                              title
                                ? `${title} — On a Trip Holiday`
                                : placeName
                                ? `Traveller enjoying a trip in ${placeName} with On a Trip Holiday`
                                : "Happy traveller moment with On a Trip Holiday"
                            }
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center bg-[#E9EDF2]"
                            aria-hidden="true"
                          >
                            <Heart className="h-10 w-10 text-[#061B45]/15" />
                          </div>
                        )}

                        {/* Image overlay */}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#03112D]/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80"
                          aria-hidden="true"
                        />

                        {/* Location badge */}
                        {placeName && (
                          <div className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-24px)] items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#061B45] shadow-sm backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-sm">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0 text-[#FF3B0B]"
                              aria-hidden="true"
                            />

                            <span className="truncate">{placeName}</span>
                          </div>
                        )}
                      </div>

                      {/* ======================================
                          CONTENT
                      ======================================= */}

                      <div className="p-4 sm:p-5 lg:p-6">
                        {/* Location */}
                        {placeName && (
                          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[#FF3B0B] sm:text-sm">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />

                            <span className="truncate">{placeName}</span>
                          </div>
                        )}

                        {/* Title */}
                        {title && (
                          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#061B45] sm:text-lg lg:text-xl">
                            {title}
                          </h3>
                        )}

                        {/* Short customer experience */}
                        {shortCaption ? (
                          <div className="relative mt-3">
                            <Quote
                              className="absolute -left-1 -top-1 h-5 w-5 text-[#FF3B0B]/20"
                              aria-hidden="true"
                            />

                            <p className="line-clamp-3 pl-5 text-sm leading-relaxed text-[#061B45]/70 sm:text-base">
                              "{shortCaption}"
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm italic text-[#061B45]/50">
                            A beautiful travel memory with On a Trip Holiday.
                          </p>
                        )}

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#061B45]/10 pt-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF3B0B]/10">
                              <Heart
                                className="h-4 w-4 text-[#FF3B0B]"
                                fill="currentColor"
                                aria-hidden="true"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-[#061B45] sm:text-sm">
                                Happy Traveller
                              </p>

                              <p className="truncate text-[11px] text-[#061B45]/50 sm:text-xs">
                                On a Trip Holiday
                              </p>
                            </div>
                          </div>

                          {/* View */}
                          <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#FF3B0B] transition-transform duration-300 group-hover:translate-x-1 sm:text-sm">
                            <span>View</span>

                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* ==================================================
                VIEW ALL
            ================================================== */}

            <div className="mt-8 flex justify-center sm:mt-10 lg:mt-12">
              <button
                type="button"
                onClick={() => navigate("/happy-moments")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#061B45] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FF5A2A] hover:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF5A2A] focus:ring-offset-2 focus:ring-offset-[#061B45] sm:px-6 sm:text-base"
              >
                <span>View All Happy Moments</span>

                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

