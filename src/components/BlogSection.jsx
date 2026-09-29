

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Newspaper,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getBlogs } from "../api/content";

/*
 * Responsive card sizing (flex-basis at EVERY breakpoint so classes never conflict):
 *   mobile  (<640px)   -> 1 full card, nothing cut off   (gap-5 = 20px)
 *   sm      (>=640px)  -> 2 cards                        (gap-6 = 24px -> 50% - 12px)
 *   lg      (>=1024px) -> 3 cards                        (gap-7 = 28px -> 33.333% - 18.667px)
 */
const CARD_SIZE_CLASSES =
  "min-w-0 shrink-0 grow-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-18.667px)]";

/* ============================================================
   BLOG CARD
============================================================ */

function BlogCard({ post }) {
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = post?.cover_image?.url;

  // Handle images that are already cached (onLoad may not fire for them).
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [imageUrl]);

  const showImage = imageUrl && !imageFailed;

  return (
    <Link
      to={`/blog/${post?.slug || post?.id}`}
      className="
        group
        flex
        h-full
        w-full
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
        hover:shadow-xl
        focus:outline-none
        focus:ring-2
        focus:ring-accent
        focus:ring-offset-2
        sm:rounded-3xl
      "
    >
      {/* Image with loader */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface lg:aspect-[16/10]">
        {showImage ? (
          <>
            {/* Shimmer shown until the image has finished loading */}
            {!imageLoaded && (
              <div
                className="absolute inset-0 animate-pulse bg-surface"
                aria-hidden="true"
              />
            )}

            <img
              ref={imgRef}
              src={imageUrl}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
              alt={
                post?.title
                  ? `${post.title} — On a Trip Holiday`
                  : "On a Trip Holiday travel blog"
              }
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-navy/30">
            No image
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
        {post?.published_at && (
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-navy/50 sm:text-sm">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />

            {new Date(post.published_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}

        <h3 className="line-clamp-2 font-display text-xl font-semibold leading-snug text-navy sm:text-2xl">
          {post?.title}
        </h3>

        {post?.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-navy/60 sm:text-base sm:leading-7">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-1 sm:text-base">
          <span>Read More</span>

          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   SKELETON CARD (loader)
============================================================ */

function BlogCardSkeleton() {
  return (
    <div
      className={`${CARD_SIZE_CLASSES} overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm sm:rounded-3xl`}
    >
      <div className="aspect-[16/9] w-full animate-pulse bg-surface lg:aspect-[16/10]" />

      <div className="p-5 sm:p-6 lg:p-7">
        <div className="h-3 w-28 animate-pulse rounded bg-surface" />
        <div className="mt-5 h-6 w-4/5 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-6 w-3/5 animate-pulse rounded bg-surface" />
        <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface" />
        <div className="mt-6 h-4 w-24 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

/* ============================================================
   BLOG SECTION
============================================================ */

export default function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const carouselRef = useRef(null);

  /* ------------------------------------------------------------
     FETCH POSTS
  ------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    getBlogs()
      .then((data) => {
        if (!mounted) return;

        const blogs = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.blogs)
          ? data.blogs
          : [];

        // Keep enough posts for the carousel.
        setPosts(blogs.slice(0, 6));
      })
      .catch((error) => {
        console.error("Failed to load blogs:", error);

        if (mounted) {
          setPosts([]);
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

  /* ------------------------------------------------------------
     CHEVRON STATE (disable at the ends / hide if everything fits)
  ------------------------------------------------------------ */

  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;

    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;

    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    if (loading || posts.length === 0) return;

    const frame = requestAnimationFrame(updateScrollState);

    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [loading, posts, updateScrollState]);

  /* ------------------------------------------------------------
     SCROLL BY ONE CARD
  ------------------------------------------------------------ */

  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) return;

    const firstCard = container.querySelector("[data-blog-card]");

    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;

    const computedStyle = window.getComputedStyle(container);
    const gap =
      parseFloat(computedStyle.columnGap) ||
      parseFloat(computedStyle.gap) ||
      28;

    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!loading && posts.length === 0) {
    return null;
  }

  const showChevrons = !loading && (canScrollLeft || canScrollRight);

  return (
    <section
      id="blog"
      className="w-full overflow-hidden py-14 sm:py-16 lg:py-20"
      aria-busy={loading}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-hover">
              <Newspaper className="h-4 w-4 shrink-0" aria-hidden="true" />

              Travel notes
            </p>

            <h2 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              From the Blog
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-navy/60 sm:text-base">
              Travel inspiration, destination guides, tips, and stories from
              On a Trip Holiday.
            </p>
          </div>

          {/* Desktop View All */}
          <Link
            to="/blog"
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-secondary transition-colors hover:text-accent hover:underline sm:inline-flex"
          >
            View all posts

            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading blog posts…</span>

            <div className="flex gap-5 overflow-hidden sm:gap-6 lg:gap-7">
              {[1, 2, 3].map((i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* LEFT CHEVRON
                  Inside the edge on mobile (so it is never clipped),
                  half outside the edge on larger screens. */}
              {showChevrons && (
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  disabled={!canScrollLeft}
                  aria-label="Previous blog posts"
                  className="
                    absolute
                    left-2
                    top-1/2
                    z-20
                    flex
                    h-11
                    w-11
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-navy/10
                    bg-white
                    text-navy
                    shadow-xl
                    transition-all
                    duration-300
                    hover:scale-105
                    hover:bg-navy
                    hover:text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-accent
                    focus:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-0
                    sm:left-0
                    sm:h-12
                    sm:w-12
                    sm:-translate-x-1/2
                  "
                >
                  <ChevronLeft
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* CAROUSEL
                  snap-x + snap-mandatory keep cards aligned after the
                  smooth scroll from the chevrons or a finger swipe. */}
              <div
                ref={carouselRef}
                onScroll={updateScrollState}
                className="
                  flex
                  snap-x
                  snap-mandatory
                  gap-5
                  overflow-x-auto
                  scroll-smooth
                  pb-5
                  pt-2
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                  sm:gap-6
                  lg:gap-7
                "
              >
                {posts.map((post) => (
                  <div
                    key={post?.id || post?.slug}
                    data-blog-card
                    className={`flex snap-start ${CARD_SIZE_CLASSES}`}
                  >
                    <BlogCard post={post} />
                  </div>
                ))}
              </div>

              {/* RIGHT CHEVRON */}
              {showChevrons && (
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  disabled={!canScrollRight}
                  aria-label="Next blog posts"
                  className="
                    absolute
                    right-2
                    top-1/2
                    z-20
                    flex
                    h-11
                    w-11
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-navy/10
                    bg-white
                    text-navy
                    shadow-xl
                    transition-all
                    duration-300
                    hover:scale-105
                    hover:bg-navy
                    hover:text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-accent
                    focus:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-0
                    sm:right-0
                    sm:h-12
                    sm:w-12
                    sm:translate-x-1/2
                  "
                >
                  <ChevronRight
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {/* Mobile View All */}
            <div className="mt-7 flex justify-center sm:hidden">
              <Link
                to="/blog"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <span>View All Posts</span>

                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

