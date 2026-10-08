

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gem,
  ImageOff,
  MapPin,
  PackageOpen,
  Sparkles,
} from "lucide-react";

import { getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import { Reveal, useInView } from "./Reveal";

/* =========================================================
   PACKAGES: "MADE TO MEASURE"

   One compact section instead of six carousels.
   - Left column (desktop): heading, collection tabs, arrows, view all.
   - Right column: one carousel of mat-framed journey cards.
   - Tabs only appear for collections that actually have packages.
   - Other collections (Most Visited, Trending, Popular) live on
     /packages?collection=<key>, which "View all journeys" links to.

   Visual language is deliberately different from its neighbours:
     Seasonal     -> full-bleed photo cards
     Most Visited -> arch windows
     Packages     -> framed "print" cards, details on a light card
========================================================= */

const PACKAGE_PLACEHOLDER = "/images/package-placeholder.webp";

const BRAND_NAME = "Manyara Privé Vacations";

/* Home-page collections. Order = tab order. Add a row to show another. */
const COLLECTIONS = [
  {
    key: "featured",
    flag: "is_featured",
    icon: Gem,
    tab: "Signature",
    description: `Our signature edit, handpicked by the ${BRAND_NAME} team.`,
  },
  {
    key: "recommended",
    flag: "is_recommended",
    icon: Award,
    tab: "Handpicked",
    description: "Thoughtfully chosen journeys for your next getaway.",
  },
  {
    key: "new",
    flag: "is_new",
    icon: Sparkles,
    tab: "New",
    description: "Fresh escapes, added to our collection this season.",
  },
];

/* Phones show the next card peeking so people know to swipe */
const CARD_BASIS =
  "min-w-0 shrink-0 basis-[78%] snap-start sm:basis-[calc(50%-10px)] xl:basis-[calc(44%-12px)]";

const NAV_BUTTON =
  "hidden h-12 w-12 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark shadow-travel-card transition-all duration-300 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 lg:flex";

const VIEW_ALL =
  "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-champagne/60 bg-white px-5 text-sm font-semibold tracking-wide text-text-dark transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/* =========================================================
   HELPERS
========================================================= */

const isTruthy = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

const isPublishedPackage = (packageItem) => {
  const status = String(packageItem?.status ?? "")
    .trim()
    .toLowerCase();

  return (
    status === "" ||
    status === "published" ||
    packageItem?.is_published === true
  );
};

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (typeof image === "object") return image?.url || image?.src || "";
  return "";
};

const getPackageImage = (packageItem) => {
  if (!packageItem) return PACKAGE_PLACEHOLDER;

  if (Array.isArray(packageItem.images)) {
    for (const image of packageItem.images) {
      const imageUrl = getImageUrl(image);
      if (imageUrl) return imageUrl;
    }
  }

  return (
    getImageUrl(packageItem.image) ||
    getImageUrl(packageItem.cover_image) ||
    getImageUrl(packageItem.coverImage) ||
    PACKAGE_PLACEHOLDER
  );
};

const getDuration = (packageItem) => {
  if (!packageItem) return "";

  if (packageItem.duration) return String(packageItem.duration);

  const days = Number(packageItem.duration_days);
  const nights = Number(packageItem.duration_nights);

  if (days > 0 && nights >= 0) {
    return `${days} ${days === 1 ? "Day" : "Days"} / ${nights} ${
      nights === 1 ? "Night" : "Nights"
    }`;
  }
  if (days > 0) return `${days} ${days === 1 ? "Day" : "Days"}`;
  if (nights > 0) return `${nights} ${nights === 1 ? "Night" : "Nights"}`;

  return "";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "";

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return String(price);

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

/* First usable short line a package offers, if any. */
const getHighlight = (packageItem) => {
  const candidates = [
    packageItem?.tagline,
    packageItem?.subtitle,
    packageItem?.short_description,
    packageItem?.summary,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
};

const getPackageKey = (packageItem, index) =>
  packageItem?.id ||
  packageItem?.slug ||
  `${packageItem?.title || "package"}-${index}`;

const sortByOrder = (a, b) =>
  Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0);

/* Last word set in italic, same treatment as the hero. */
function renderTitle(text) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 3) return text;
  const last = words.pop();
  return (
    <>
      {words.join(" ")}{" "}
      <em className="font-normal italic text-ink/70">{last}</em>
    </>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function PackageCardSkeleton() {
  return (
    <div className={CARD_BASIS} aria-hidden="true">
      <div className="animate-pulse rounded-[1.75rem] border border-champagne/50 bg-white p-1.5">
        <div className="aspect-[10/11] w-full rounded-[1.4rem] bg-surface-strong" />
        <div className="space-y-3 px-4 pb-4 pt-5">
          <div className="h-3 w-24 rounded bg-surface-strong" />
          <div className="h-7 w-3/4 rounded bg-surface-strong" />
          <div className="h-4 w-full rounded bg-surface-strong" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PACKAGE CARD

   A white mat frames the photo like a print. Duration sits on the
   photo; destination, title, one-line highlight and price sit on the
   light card below, so text never fights the image.
   Hover (mouse) or press (touch) lifts the card and slowly zooms the photo.
========================================================= */

const PackageCard = memo(function PackageCard({ packageItem, badge }) {
  const [imageFailed, setImageFailed] = useState(false);

  const image = getPackageImage(packageItem);
  const title = packageItem?.title || packageItem?.name || "Travel Package";
  const destination = packageItem?.destination || packageItem?.location || "";
  const duration = getDuration(packageItem);
  const highlight = getHighlight(packageItem);
  const price = formatPrice(
    packageItem?.price_per_person ??
      packageItem?.price ??
      packageItem?.starting_price ??
      packageItem?.starting_from
  );
  const slug = packageItem?.slug;

  const BadgeIcon = badge?.icon;

  const frameClass =
    "group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-[1.75rem]";

  const content = (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-champagne/70 bg-white p-1.5 shadow-travel-card transition-[transform,box-shadow,border-color] duration-500 ease-soft group-hover:-translate-y-1.5 group-hover:border-champagne group-hover:shadow-[0_30px_50px_-24px_rgba(47,42,51,0.45)] group-active:-translate-y-1">
      {/* PHOTO */}
      <div className="relative aspect-[10/11] w-full shrink-0 transform-gpu overflow-hidden rounded-[1.4rem] bg-surface-strong">
        {!imageFailed ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-soft group-hover:scale-[1.07] group-active:scale-[1.07]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-surface-soft"
            aria-label="Package image unavailable"
          >
            <ImageOff className="h-8 w-8 text-placeholder" aria-hidden="true" />
          </div>
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-[#14100F]/60 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Secondary collection badge (only if the package belongs to another one) */}
        {badge && (
          <span className="absolute left-3.5 top-3.5 inline-flex h-8 items-center gap-2 rounded-full border border-white/30 bg-ink/50 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white sm:bg-ink/35 sm:backdrop-blur-md">
            <BadgeIcon
              className="h-3.5 w-3.5 text-champagne"
              aria-hidden="true"
            />
            {badge.tab}
          </span>
        )}

        {duration && (
          <span className="absolute bottom-3.5 left-3.5 inline-flex h-8 max-w-[85%] items-center gap-2 rounded-full bg-white/90 px-3 text-[12px] font-medium text-text-dark">
            <Clock3
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">{duration}</span>
          </span>
        )}
      </div>

      {/* DETAILS */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5 text-left antialiased">
        {destination && (
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.22em]">
              {destination}
            </span>
          </div>
        )}

        <h3 className="mt-2 line-clamp-2 font-display text-[1.7rem] font-medium leading-[1.08] tracking-[-0.005em] text-text-display [text-wrap:balance] sm:text-[1.6rem] lg:text-[1.75rem]">
          {title}
        </h3>

        {highlight && (
          <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-text-secondary">
            {highlight}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-champagne/50 pt-4">
          <div className="min-w-0 pt-4">
            {price ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-secondary">
                  From
                </p>
                <p className="mt-1 font-display text-[1.6rem] font-normal leading-none tracking-tight text-text-display tabular-nums">
                  {price}
                </p>
              </>
            ) : (
              <p className="font-display text-lg italic text-text-secondary">
                Price on request
              </p>
            )}
          </div>

          <span
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagne/70 bg-white text-text-dark transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-champagne group-active:border-ink group-active:bg-ink group-active:text-champagne"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </span>
        </div>
      </div>
    </div>
  );

  const label = `${title}${destination ? `, ${destination}` : ""}`;

  return slug ? (
    <Link to={`/packages/${slug}`} className={frameClass} aria-label={label}>
      {content}
    </Link>
  ) : (
    <article className={frameClass} aria-label={label}>
      {content}
    </article>
  );
});

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PackagesSection() {
  /* Same cache system as the rest of the public site. */
  const {
    data: packageResponse,
    loading,
    error: queryError,
  } = useQuery(getPackages);

  const packages = useMemo(() => {
    if (Array.isArray(packageResponse)) return packageResponse;
    if (Array.isArray(packageResponse?.items)) return packageResponse.items;
    if (Array.isArray(packageResponse?.packages)) return packageResponse.packages;
    if (Array.isArray(packageResponse?.data)) return packageResponse.data;
    return [];
  }, [packageResponse]);

  const publishedPackages = useMemo(
    () => packages.filter(isPublishedPackage),
    [packages]
  );

  const errorMessage =
    queryError?.message || (typeof queryError === "string" ? queryError : "");

  /* ---------- Tabs: only collections that have packages ---------- */

  const tabs = useMemo(
    () =>
      COLLECTIONS.map((collection) => ({
        collection,
        items: publishedPackages
          .filter((packageItem) => isTruthy(packageItem?.[collection.flag]))
          .sort(sortByOrder),
      })).filter((tab) => tab.items.length > 0),
    [publishedPackages]
  );

  const [activeKey, setActiveKey] = useState(null);

  const activeTab =
    tabs.find((tab) => tab.collection.key === activeKey) || tabs[0] || null;

  const activeCollection = activeTab?.collection || null;
  const items = activeTab?.items || [];
  const activeCollectionKey = activeCollection?.key;

  /* Badge shows another collection the package belongs to (never the open tab). */
  const getBadge = useCallback(
    (packageItem) =>
      COLLECTIONS.find(
        (collection) =>
          collection.key !== activeCollectionKey &&
          isTruthy(packageItem?.[collection.flag])
      ) || null,
    [activeCollectionKey]
  );

  /* ---------- Carousel ---------- */

  const carouselRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(0);
  const [revealRef, inView] = useInView();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* Booleans only change at the edges, and the progress bar is written
     straight to the DOM, so scrolling never re-renders the cards. */
  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;

    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth
    );
    const currentScroll = container.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(currentScroll > threshold);
    setCanScrollRight(currentScroll < maxScroll - threshold);

    if (progressRef.current) {
      const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;
      progressRef.current.style.transform = `translateX(${progress * 200}%)`;
    }
  }, []);

  /* One update per animation frame, however many scroll events fire. */
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateScrollState();
    });
  }, [updateScrollState]);

  /* Measure on mount, on resize and whenever the visible set changes. */
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return undefined;

    updateScrollState();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollState);
      return () => window.removeEventListener("resize", updateScrollState);
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateScrollState, items.length, loading, activeCollectionKey]);

  /* Switching tabs starts the new row from the first card. */
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    container.scrollTo({ left: 0, behavior: "instant" });
    updateScrollState();
  }, [activeCollectionKey, updateScrollState]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const scrollCarousel = useCallback((direction) => {
    const container = carouselRef.current;
    if (!container) return;

    const card = container.querySelector("[data-package-card]");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const computedStyle = window.getComputedStyle(container);
    const gap =
      parseFloat(computedStyle.columnGap || computedStyle.gap || "0") || 0;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }, []);

  const viewAllHref = activeCollection
    ? `/packages?collection=${activeCollection.key}`
    : "/packages";

  const canScroll = canScrollLeft || canScrollRight;
  const hasContent = !loading && !errorMessage && tabs.length > 0;

  return (
    <section
      id="packages"
      aria-labelledby="packages-section-title"
      className="relative isolate w-full overflow-x-clip bg-gradient-to-b from-background to-surface-alt py-16 antialiased sm:py-20 lg:py-24"
    >
      {/* Top hairline + soft champagne wash, matching the sections above */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_0%_100%,rgba(232,210,180,0.2)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] xl:gap-16">
          {/* =================================================
              LEFT: HEADING, TABS, CONTROLS
          ================================================= */}
          <div className="lg:sticky lg:top-28">
            <Reveal className="max-w-2xl lg:max-w-none">
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8 shrink-0 bg-champagne"
                  aria-hidden="true"
                />
                <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
                  {BRAND_NAME}
                </span>
              </div>

              <h2
                id="packages-section-title"
                className="mt-4 font-display text-[2.6rem] font-medium leading-[1.03] tracking-[-0.015em] text-text-display [text-wrap:balance] sm:text-[3.25rem] lg:text-[3rem] xl:text-[3.5rem]"
              >
                {renderTitle("Journeys made to measure")}
              </h2>

              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:text-base sm:leading-7">
                Every itinerary is planned end to end by our travel team, from
                the first idea to the journey home.
              </p>
            </Reveal>

            {/* TABS */}
            {hasContent && tabs.length > 1 && (
              <div
                role="tablist"
                aria-label="Journey collections"
                className="-mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {tabs.map(({ collection }) => {
                  const TabIcon = collection.icon;
                  const selected = collection.key === activeCollectionKey;

                  return (
                    <button
                      key={collection.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveKey(collection.key)}
                      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        selected
                          ? "border-ink bg-ink text-champagne"
                          : "border-champagne/60 bg-white text-text-dark hover:border-ink"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" aria-hidden="true" />
                      {collection.tab}
                    </button>
                  );
                })}
              </div>
            )}

            {hasContent && activeCollection && (
              <p
                key={activeCollection.key}
                className="mt-4 max-w-xl text-sm leading-6 text-text-secondary"
              >
                {activeCollection.description}
              </p>
            )}

            {/* DESKTOP CONTROLS */}
            {hasContent && (
              <div className="mt-8 hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  disabled={!canScrollLeft}
                  aria-label="Previous journeys"
                  className={NAV_BUTTON}
                >
                  <ChevronLeft
                    className="h-5 w-5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  disabled={!canScrollRight}
                  aria-label="Next journeys"
                  className={NAV_BUTTON}
                >
                  <ChevronRight
                    className="h-5 w-5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>

                <Link to={viewAllHref} className={`${VIEW_ALL} ml-2`}>
                  View all journeys
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT: CAROUSEL / STATES
          ================================================= */}
          <div
            ref={revealRef}
            data-inview={inView}
            className="mt-10 min-w-0 lg:mt-0"
          >
            {/* LOADING */}
            {loading && (
              <div
                className="-mx-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:gap-5 sm:px-1 lg:gap-6"
                role="status"
                aria-label="Loading journeys"
              >
                {[1, 2, 3].map((item) => (
                  <PackageCardSkeleton key={item} />
                ))}
              </div>
            )}

            {/* ERROR */}
            {!loading && errorMessage && (
              <div className="rounded-3xl border border-error/20 bg-error-bg px-6 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white">
                  <PackageOpen
                    className="h-5 w-5 text-error"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-error-text">
                  Unable to load journeys
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-error-text">
                  Please refresh the page and try again.
                </p>
              </div>
            )}

            {/* EMPTY */}
            {!loading && !errorMessage && tabs.length === 0 && (
              <div className="rounded-3xl border border-dashed border-champagne/60 bg-card px-5 py-12 text-center sm:px-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-champagne/60 bg-white">
                  <PackageOpen
                    className="h-6 w-6 text-placeholder"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl font-medium text-text-display">
                  New journeys coming soon
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  We are preparing our next collection of journeys. Please
                  check back soon.
                </p>
              </div>
            )}

            {/* CAROUSEL */}
            {hasContent && (
              <>
                <div
                  ref={carouselRef}
                  onScroll={handleScroll}
                  role="tabpanel"
                  className="-mx-4 flex w-full snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-8 pt-2 sm:mx-0 sm:scroll-pl-0 sm:gap-5 sm:px-1 lg:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {items.map((packageItem, index) => (
                    <div
                      key={getPackageKey(packageItem, index)}
                      data-package-card
                      className={`${CARD_BASIS} reveal-item`}
                      style={{ "--i": Math.min(index, 6) }}
                    >
                      <PackageCard
                        packageItem={packageItem}
                        badge={getBadge(packageItem)}
                      />
                    </div>
                  ))}
                </div>

                {/* PHONE / TABLET FOOTER: swipe progress + view all */}
                <div className="mt-1 flex items-center gap-4 lg:hidden">
                  {canScroll ? (
                    <div
                      className="h-0.5 flex-1 overflow-hidden rounded-full bg-champagne/40"
                      aria-hidden="true"
                    >
                      <div
                        ref={progressRef}
                        className="h-full w-1/3 rounded-full bg-ink/70 will-change-transform"
                      />
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <Link to={viewAllHref} className={VIEW_ALL}>
                    View all journeys
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}




























































// import {
//   memo,
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Link } from "react-router-dom";
// import {
//   ArrowRight,
//   Award,
//   ChevronLeft,
//   ChevronRight,
//   Clock3,
//   Compass,
//   Flame,
//   Gem,
//   ImageOff,
//   MapPin,
//   PackageOpen,
//   Sparkles,
//   TrendingUp,
// } from "lucide-react";

// import { getPackages } from "../api/content";
// import { useQuery } from "../hooks/useQuery";
// import { Reveal, useInView } from "./Reveal";

// /* =========================================================
//    NO TAILWIND PLUGIN NEEDED.
//    Effects use the built-in `group-data-[active=true]:` variant (Tailwind
//    v3.2+ / v4). The card wrapper sets data-active="true" when:
//      - a mouse hovers it (desktop), or
//      - it is the card nearest the screen centre (touch devices).
// ========================================================= */

// /* =========================================================
//    CONSTANTS
// ========================================================= */

// const PACKAGE_PLACEHOLDER = "/images/package-placeholder.webp";

// const BRAND_NAME = "Manyara Privé Vacations";


// const COLLECTIONS = [
//   {
//     key: "new",
//     flag: "is_new",
//     icon: Sparkles,
//     fx: "sheen",
//     tag: "New",
//     eyebrow: "Just added",
//     title: "Newly Opened Destinations",
//     description: "Fresh escapes, added to our collection this season.",
//   },
//   {
//     key: "most_visited",
//     flag: "is_most_visited",
//     icon: Compass,
//     fx: "frame",
//     tag: "Most loved",
//     eyebrow: "Traveller favourites",
//     title: "Most Visited Destinations",
//     description: "The places our travellers return to and talk about.",
//   },
//   {
//     key: "featured",
//     flag: "is_featured",
//     icon: Gem,
//     fx: "ring",
//     tag: "Signature",
//     eyebrow: "Our signature edit",
//     title: "Signature Destinations",
//     description: `Handpicked experiences from ${BRAND_NAME}.`,
//   },
//   {
//     key: "recommended",
//     flag: "is_recommended",
//     icon: Award,
//     fx: "rise",
//     tag: "Handpicked",
//     eyebrow: "Chosen by our team",
//     title: "Handpicked Destinations",
//     description: "Thoughtfully selected places for your next getaway.",
//   },
//   {
//     key: "trending",
//     flag: "is_trending",
//     icon: TrendingUp,
//     fx: "tilt",
//     tag: "Trending",
//     eyebrow: "Right now",
//     title: "Trending Destinations",
//     description: "Where travellers are heading at the moment.",
//   },
//   {
//     key: "popular",
//     flag: "is_popular",
//     icon: Flame,
//     fx: "glow",
//     tag: "Popular",
//     eyebrow: "Crowd pleasers",
//     title: "Popular Destinations",
//     description: "Well-loved places across all our journeys.",
//   },
// ];

// /*
//  * Effect classes, one signature per collection. `fx:` = hover on desktop,
//  * "centre of screen" on touch devices.
//  */
// const FX_CARD = {
//   sheen:
//     "group-data-[active=true]:-translate-y-1.5 group-data-[active=true]:shadow-[0_28px_50px_-18px_rgba(47,42,51,0.55)]",
//   frame:
//     "group-data-[active=true]:-translate-y-1.5 group-data-[active=true]:shadow-[0_28px_50px_-18px_rgba(47,42,51,0.6)]",
//   ring: "ring-1 ring-champagne/0 group-data-[active=true]:ring-champagne group-data-[active=true]:shadow-[0_32px_60px_-20px_rgba(232,210,180,0.8)]",
//   rise: "group-data-[active=true]:-translate-y-1.5 group-data-[active=true]:shadow-[0_28px_50px_-18px_rgba(47,42,51,0.6)]",
//   tilt: "group-data-[active=true]:-translate-y-1.5 group-data-[active=true]:shadow-[0_28px_50px_-18px_rgba(47,42,51,0.6)]",
//   glow: "",
// };

// const FX_IMAGE = {
//   sheen: "group-data-[active=true]:scale-[1.15] group-data-[active=true]:brightness-110",
//   frame: "group-data-[active=true]:scale-[1.14] group-data-[active=true]:-rotate-[0.5deg]",
//   ring: "group-data-[active=true]:scale-[1.12]",
//   rise: "group-data-[active=true]:scale-[1.16] group-data-[active=true]:-translate-y-3",
//   tilt: "group-data-[active=true]:scale-[1.22] group-data-[active=true]:rotate-2",
//   glow: "group-data-[active=true]:scale-[1.15] group-data-[active=true]:saturate-150",
// };

// /* Card width: peeks the next card on phones so people know to swipe */
// const CARD_BASIS =
//   "min-w-0 shrink-0 basis-[82%] snap-start sm:basis-[calc(50%-10px)] lg:basis-[calc(25%-18px)]";

// const CARD_HEIGHT = "h-[25rem] sm:h-[26rem] lg:h-[27rem]";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const isTruthy = (value) =>
//   value === true || value === 1 || value === "1" || value === "true";

// const isPublishedPackage = (packageItem) => {
//   const status = String(packageItem?.status ?? "")
//     .trim()
//     .toLowerCase();

//   return (
//     status === "" ||
//     status === "published" ||
//     packageItem?.is_published === true
//   );
// };

// const getImageUrl = (image) => {
//   if (!image) return "";
//   if (typeof image === "string") return image;
//   if (typeof image === "object") return image?.url || image?.src || "";
//   return "";
// };

// const getPackageImage = (packageItem) => {
//   if (!packageItem) return PACKAGE_PLACEHOLDER;

//   if (Array.isArray(packageItem.images)) {
//     for (const image of packageItem.images) {
//       const imageUrl = getImageUrl(image);
//       if (imageUrl) return imageUrl;
//     }
//   }

//   return (
//     getImageUrl(packageItem.image) ||
//     getImageUrl(packageItem.cover_image) ||
//     getImageUrl(packageItem.coverImage) ||
//     PACKAGE_PLACEHOLDER
//   );
// };

// const getDuration = (packageItem) => {
//   if (!packageItem) return "";

//   if (packageItem.duration) return String(packageItem.duration);

//   const days = Number(packageItem.duration_days);
//   const nights = Number(packageItem.duration_nights);

//   if (days > 0 && nights >= 0) {
//     return `${days} ${days === 1 ? "Day" : "Days"} / ${nights} ${
//       nights === 1 ? "Night" : "Nights"
//     }`;
//   }
//   if (days > 0) return `${days} ${days === 1 ? "Day" : "Days"}`;
//   if (nights > 0) return `${nights} ${nights === 1 ? "Night" : "Nights"}`;

//   return "";
// };

// const formatPrice = (price) => {
//   if (price === null || price === undefined || price === "") return "";

//   const numericPrice = Number(price);
//   if (Number.isNaN(numericPrice)) return String(price);

//   return `₹${numericPrice.toLocaleString("en-IN")}`;
// };

// const getPackageKey = (packageItem, index) =>
//   packageItem?.id ||
//   packageItem?.slug ||
//   `${packageItem?.title || "package"}-${index}`;

// const getCollectionPackages = (collection, packages) => {
//   if (!collection || !Array.isArray(packages)) return [];

//   return packages
//     .filter((packageItem) => isTruthy(packageItem?.[collection.flag]))
//     .sort(
//       (a, b) => Number(a?.display_order ?? 0) - Number(b?.display_order ?? 0)
//     );
// };

// /* Same treatment as the hero: the last word is set in italic (refined, ink tone). */
// function renderTitle(text) {
//   const words = String(text).trim().split(/\s+/);
//   if (words.length < 3) return text;
//   const last = words.pop();
//   return (
//     <>
//       {words.join(" ")}{" "}
//       <em className="font-normal italic text-ink/70">{last}</em>
//     </>
//   );
// }

// /* True on devices with a real mouse. */
// const isHoverDevice = () =>
//   typeof window !== "undefined" &&
//   typeof window.matchMedia === "function" &&
//   window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// /*
//  * Drives data-active on the card wrapper.
//  *  - Mouse: active while hovered.
//  *  - Touch: active while the card crosses the centre of the screen
//  *    (a tap navigates at once, so hover can never show on phones).
//  */
// function useCardActive(ref) {
//   const [active, setActive] = useState(false);

//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return undefined;

//     const cleanups = [];

//     if (isHoverDevice()) {
//       const on = () => setActive(true);
//       const off = () => setActive(false);
//       el.addEventListener("mouseenter", on);
//       el.addEventListener("mouseleave", off);
//       cleanups.push(() => {
//         el.removeEventListener("mouseenter", on);
//         el.removeEventListener("mouseleave", off);
//       });
//     }

//     if (typeof IntersectionObserver !== "undefined" && !isHoverDevice()) {
//       const observer = new IntersectionObserver(
//         ([entry]) => setActive(entry.isIntersecting),
//         { rootMargin: "-30% -12% -30% -12%", threshold: 0.2 }
//       );
//       observer.observe(el);
//       cleanups.push(() => observer.disconnect());
//     }

//     return () => cleanups.forEach((fn) => fn());
//   }, [ref]);

//   return active;
// }

// /* =========================================================
//    SKELETON
// ========================================================= */

// function DestinationCardSkeleton() {
//   return (
//     <div className={CARD_BASIS}>
//       <div
//         className={`${CARD_HEIGHT} animate-pulse overflow-hidden rounded-3xl bg-surface-strong`}
//         aria-hidden="true"
//       />
//     </div>
//   );
// }

// /* =========================================================
//    DESTINATION CARD
//    Full-bleed photo, details over a dark gradient.
//    Each collection has its own signature (collection.fx):

//      sheen  New          light sweep + zoom + pulsing "new" dot
//      frame  Most Visited viewfinder corners close in on the photo
//      ring   Signature    3D tilt + cursor spotlight + champagne ring
//      rise   Handpicked   photo pans up, details slide up, note unfolds
//      tilt   Trending     dark ink curtain rises, photo zooms and tilts
//      glow   Popular      spinning champagne border + soft glow
// ========================================================= */

// function PulseDot() {
//   return (
//     <span className="relative flex h-2 w-2" aria-hidden="true">
//       <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-champagne opacity-75 motion-reduce:animate-none" />
//       <span className="relative inline-flex h-2 w-2 rounded-full bg-champagne" />
//     </span>
//   );
// }

// const CORNER =
//   "pointer-events-none absolute z-10 h-6 w-6 border-champagne opacity-0 transition-all duration-500 ease-out group-data-[active=true]:opacity-100";

// const DestinationCard = memo(function DestinationCard({
//   packageItem,
//   collection,
// }) {
//   const [imageFailed, setImageFailed] = useState(false);
//   const wrapperRef = useRef(null);
//   const active = useCardActive(wrapperRef);

//   const fx = collection.fx;
//   const TagIcon = collection.icon;

//   const image = getPackageImage(packageItem);
//   const title = packageItem?.title || packageItem?.name || "Travel Package";
//   const destination = packageItem?.destination || packageItem?.location || "";
//   const duration = getDuration(packageItem);
//   const price = formatPrice(
//     packageItem?.price_per_person ??
//       packageItem?.price ??
//       packageItem?.starting_price ??
//       packageItem?.starting_from
//   );
//   const slug = packageItem?.slug;

//   /* Cursor spotlight + 3D tilt (mouse only; touch uses the active state). */
//   const handlePointerMove = (event) => {
//     if (event.pointerType === "touch") return;
//     const el = wrapperRef.current;
//     if (!el) return;

//     const rect = el.getBoundingClientRect();
//     const x = (event.clientX - rect.left) / rect.width;
//     const y = (event.clientY - rect.top) / rect.height;

//     el.style.setProperty("--mx", `${x * 100}%`);
//     el.style.setProperty("--my", `${y * 100}%`);

//     if (fx === "ring") {
//       el.style.transition = "transform 120ms ease-out";
//       el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 9}deg) rotateY(${(x - 0.5) * 11}deg) translateY(-6px)`;
//     }
//   };

//   const handlePointerLeave = () => {
//     const el = wrapperRef.current;
//     if (!el || fx !== "ring") return;
//     el.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
//     el.style.transform = "";
//   };

//   const radius = fx === "glow" ? "rounded-[1.375rem]" : "rounded-3xl";

//   const cardClass = `relative isolate block ${CARD_HEIGHT} transform-gpu overflow-hidden ${radius} bg-ink shadow-travel-card transition-all duration-500 ease-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${FX_CARD[fx]}`;

//   const content = (
//     <>
//       {/* PHOTO (own clipped layer so the zoom never leaks).
//           Lazy: the browser only fetches/decodes it near the viewport. */}
//       <div
//         className="absolute inset-0 -z-20 overflow-hidden"
//         aria-hidden={imageFailed ? undefined : "true"}
//       >
//         {!imageFailed ? (
//           <img
//             src={image}
//             alt=""
//             loading="lazy"
//             decoding="async"
//             fetchPriority="low"
//             draggable={false}
//             onError={() => setImageFailed(true)}
//             className={`h-full w-full object-cover transition-[transform,filter] duration-[1200ms] ease-soft group-active:scale-110 group-data-[active=true]:will-change-transform ${FX_IMAGE[fx]}`}
//           />
//         ) : (
//           <div
//             className="flex h-full w-full items-center justify-center bg-surface-soft"
//             aria-label="Package image unavailable"
//           >
//             <ImageOff className="h-8 w-8 text-placeholder" aria-hidden="true" />
//           </div>
//         )}
//       </div>

//       {/* READABILITY GRADIENT (neutral dark ink) */}
//       <div
//         className="absolute inset-0 -z-10 bg-gradient-to-t from-[#14100F]/90 via-[#1A1416]/25 to-[#1A1416]/20"
//         aria-hidden="true"
//       />

//       {/* ---------- FX LAYERS ---------- */}

//       {/* sheen: wide light sweep, plus a champagne edge glow */}
//       {fx === "sheen" && (
//         <>
//           <div
//             className="pointer-events-none absolute inset-y-0 -left-2/3 z-10 w-1/2 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[1200ms] ease-out group-data-[active=true]:translate-x-[460%] group-active:translate-x-[460%]"
//             aria-hidden="true"
//           />
//           <div
//             className="pointer-events-none absolute inset-0 z-10 rounded-3xl opacity-0 shadow-[inset_0_0_0_1px_rgba(247,235,219,0.85),inset_0_0_40px_rgba(247,235,219,0.25)] transition-opacity duration-500 group-data-[active=true]:opacity-100"
//             aria-hidden="true"
//           />
//         </>
//       )}

//       {/* frame: viewfinder corners slide in from the edges */}
//       {fx === "frame" && (
//         <>
//           <span className={`${CORNER} left-6 top-6 border-l-2 border-t-2 group-data-[active=true]:left-4 group-data-[active=true]:top-4`} aria-hidden="true" />
//           <span className={`${CORNER} right-6 top-6 border-r-2 border-t-2 group-data-[active=true]:right-4 group-data-[active=true]:top-4`} aria-hidden="true" />
//           <span className={`${CORNER} bottom-6 left-6 border-b-2 border-l-2 group-data-[active=true]:bottom-4 group-data-[active=true]:left-4`} aria-hidden="true" />
//           <span className={`${CORNER} bottom-6 right-6 border-b-2 border-r-2 group-data-[active=true]:bottom-4 group-data-[active=true]:right-4`} aria-hidden="true" />
//           <div
//             className="pointer-events-none absolute inset-0 z-[5] bg-ink/0 transition-colors duration-500 group-data-[active=true]:bg-ink/15"
//             aria-hidden="true"
//           />
//         </>
//       )}

//       {/* ring: champagne spotlight that follows the cursor (centred on touch) */}
//       {fx === "ring" && (
//         <div
//           className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-data-[active=true]:opacity-100"
//           style={{
//             background:
//               "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(247,235,219,0.38), transparent 55%)",
//           }}
//           aria-hidden="true"
//         />
//       )}

//       {/* tilt: dark ink curtain rises from the bottom */}
//       {fx === "tilt" && (
//         <div
//           className="pointer-events-none absolute inset-0 -z-[5] translate-y-full bg-gradient-to-t from-[#1A1416]/85 via-[#1A1416]/35 to-transparent transition-transform duration-700 ease-soft group-data-[active=true]:translate-y-0 group-active:translate-y-0"
//           aria-hidden="true"
//         />
//       )}

//       {/* glow: soft champagne light rising from the bottom edge */}
//       {fx === "glow" && (
//         <div
//           className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-3/4 bg-[radial-gradient(ellipse_at_50%_110%,rgba(232,210,180,0.55)_0%,transparent_70%)] opacity-0 transition-opacity duration-700 group-data-[active=true]:opacity-100"
//           aria-hidden="true"
//         />
//       )}

//       {/* rise: extra darkening so the unfolded note stays readable */}
//       {fx === "rise" && (
//         <div
//           className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-t from-[#14100F]/70 to-transparent opacity-0 transition-opacity duration-500 group-data-[active=true]:opacity-100"
//           aria-hidden="true"
//         />
//       )}

//       {/* COLLECTION TAG (blur only from sm: up, it is costly on phones) */}
//       <span className="absolute left-4 top-4 z-20 inline-flex h-8 items-center gap-2 rounded-full border border-white/30 bg-ink/50 px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white sm:bg-ink/35 sm:backdrop-blur-md">
//         {(fx === "sheen" || fx === "tilt") && <PulseDot />}
//         <TagIcon
//           className={`h-3.5 w-3.5 text-champagne transition-transform duration-500 ${
//             fx === "tilt"
//               ? "group-data-[active=true]:-translate-y-0.5 group-data-[active=true]:translate-x-0.5"
//               : fx === "ring"
//                 ? "group-data-[active=true]:rotate-12 group-data-[active=true]:scale-125"
//                 : ""
//           }`}
//           aria-hidden="true"
//         />
//         {collection.tag}
//       </span>

//       {/* DETAILS */}
//       <div
//         className={`absolute inset-x-0 bottom-0 z-20 flex flex-col p-5 text-left antialiased transition-transform duration-500 ease-soft sm:p-6 ${
//           fx === "rise" ? "sm:group-data-[active=true]:-translate-y-1" : ""
//         }`}
//       >
//         {destination && (
//           <div className="mb-2 flex items-center gap-2 text-champagne">
//             <span
//               className="h-px w-6 shrink-0 bg-champagne/70 transition-all duration-500 group-data-[active=true]:w-10"
//               aria-hidden="true"
//             />
//             <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
//             <span className="truncate text-[11px] font-medium uppercase tracking-[0.22em]">
//               {destination}
//             </span>
//           </div>
//         )}

//         <h4 className="line-clamp-2 font-display text-[1.9rem] font-medium leading-[1.08] tracking-[0.005em] text-white [text-wrap:balance] sm:text-[1.75rem] lg:text-[2rem]">
//           {title}
//         </h4>

//         {/* rise: the note unfolds on hover/active (always open on phones) */}
//         {fx === "rise" && (
//           <p className="max-h-12 overflow-hidden text-[13px] italic leading-5 text-champagne-light opacity-100 transition-all duration-500 sm:max-h-0 sm:opacity-0 sm:group-data-[active=true]:mt-2 sm:group-data-[active=true]:max-h-12 sm:group-data-[active=true]:opacity-100">
//             Planned end to end by our travel team.
//           </p>
//         )}

//         {duration && (
//           <div className="mt-2.5 flex items-center gap-2 text-[13px] text-white/85">
//             <Clock3
//               className="h-4 w-4 shrink-0 text-champagne"
//               aria-hidden="true"
//             />
//             <span className="truncate">{duration}</span>
//           </div>
//         )}

//         <div className="mt-4 flex items-end justify-between gap-3 border-t border-champagne/30 pt-4">
//           <div className="min-w-0">
//             {price && (
//               <>
//                 <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/70">
//                   Starts from
//                 </p>
//                 <p className="mt-1 font-display text-[1.75rem] font-normal leading-none tracking-tight text-white tabular-nums">
//                   {price}
//                 </p>
//               </>
//             )}
//           </div>

//           <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-champagne/60 bg-white/10 px-4 text-[13px] font-medium tracking-[0.08em] text-white transition-all duration-300 group-data-[active=true]:border-champagne group-data-[active=true]:bg-champagne group-data-[active=true]:text-ink">
//             Discover
//             <ArrowRight
//               className="h-4 w-4 transition-transform duration-300 group-data-[active=true]:translate-x-1"
//               aria-hidden="true"
//             />
//           </span>
//         </div>
//       </div>
//     </>
//   );

//   const card = slug ? (
//     <Link
//       to={`/packages/${slug}`}
//       className={cardClass}
//       aria-label={`${title}${destination ? `, ${destination}` : ""}`}
//     >
//       {content}
//     </Link>
//   ) : (
//     <article className={cardClass}>{content}</article>
//   );

//   return (
//     <div
//       ref={wrapperRef}
//       data-active={active}
//       onPointerMove={fx === "ring" ? handlePointerMove : undefined}
//       onPointerLeave={fx === "ring" ? handlePointerLeave : undefined}
//       className={`group relative rounded-3xl ${
//         fx === "glow"
//           ? "overflow-hidden bg-champagne/50 p-[2px] transition-shadow duration-500 hover:shadow-[0_28px_50px_-18px_rgba(232,210,180,0.7)] data-[active=true]:shadow-[0_28px_50px_-18px_rgba(232,210,180,0.7)]"
//           : ""
//       }`}
//     >
//       {/* glow: spinning champagne/ivory border (only the 2px edge shows) */}
//       {fx === "glow" && (
//         <span
//           className="pointer-events-none absolute -inset-1/2 animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#E8D2B4_90deg,#FFF6E6_180deg,transparent_270deg)] opacity-0 transition-opacity duration-500 group-data-[active=true]:opacity-100 motion-reduce:animate-none"
//           aria-hidden="true"
//         />
//       )}
//       {card}
//     </div>
//   );
// });

// /* =========================================================
//    COLLECTION ROW
//    One observer per row: header first, then cards staggered.
//    content-visibility skips layout/paint for rows far off-screen.
// ========================================================= */

// const ARROW_BUTTON =
//   "absolute top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-champagne/60 bg-white/95 text-text-dark shadow-travel-card backdrop-blur transition-all duration-300 hover:scale-105 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex";

// function CollectionRow({ collection, packages }) {
//   const carouselRef = useRef(null);
//   const progressRef = useRef(null);
//   const rafRef = useRef(0);
//   const [revealRef, inView] = useInView();

//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(false);

//   const HeaderIcon = collection.icon;

//   const collectionPackages = useMemo(
//     () => getCollectionPackages(collection, packages),
//     [collection, packages]
//   );

//   /* Booleans only change at the edges (React skips unchanged state), and
//      the progress bar is written straight to the DOM, so scrolling never
//      re-renders the row. */
//   const updateScrollState = useCallback(() => {
//     const container = carouselRef.current;
//     if (!container) return;

//     const maxScroll = Math.max(
//       0,
//       container.scrollWidth - container.clientWidth
//     );
//     const currentScroll = container.scrollLeft;
//     const threshold = 4;

//     setCanScrollLeft(currentScroll > threshold);
//     setCanScrollRight(currentScroll < maxScroll - threshold);

//     if (progressRef.current) {
//       const progress = maxScroll > 0 ? currentScroll / maxScroll : 0;
//       progressRef.current.style.transform = `translateX(${progress * 200}%)`;
//     }
//   }, []);

//   /* One update per animation frame, however many scroll events fire. */
//   const handleScroll = useCallback(() => {
//     if (rafRef.current) return;
//     rafRef.current = requestAnimationFrame(() => {
//       rafRef.current = 0;
//       updateScrollState();
//     });
//   }, [updateScrollState]);

//   /* Measure on mount and on resize so the arrows and progress bar show
//      correctly before the first scroll. */
//   useEffect(() => {
//     const container = carouselRef.current;
//     if (!container) return undefined;

//     updateScrollState();

//     if (typeof ResizeObserver === "undefined") {
//       window.addEventListener("resize", updateScrollState);
//       return () => window.removeEventListener("resize", updateScrollState);
//     }

//     const observer = new ResizeObserver(updateScrollState);
//     observer.observe(container);
//     return () => observer.disconnect();
//   }, [updateScrollState, collectionPackages.length]);

//   useEffect(
//     () => () => {
//       if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     },
//     []
//   );

//   const scrollCarousel = (direction) => {
//     const container = carouselRef.current;
//     if (!container) return;

//     const card = container.querySelector("[data-package-card]");
//     if (!card) return;

//     const cardWidth = card.getBoundingClientRect().width;
//     const computedStyle = window.getComputedStyle(container);
//     const gap =
//       parseFloat(computedStyle.columnGap || computedStyle.gap || "0") || 0;

//     container.scrollBy({
//       left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
//       behavior: "smooth",
//     });
//   };

//   if (collectionPackages.length === 0) return null;

//   const canScroll = canScrollLeft || canScrollRight;

//   return (
//     <div
//       ref={revealRef}
//       data-inview={inView}
//       className="mt-14 [contain-intrinsic-size:auto_640px] [content-visibility:auto] first:mt-0 sm:mt-16"
//     >
//       {/* ROW HEADER */}
//       <div
//         className="reveal-item mb-6 flex items-end justify-between gap-4 sm:mb-8"
//         style={{ "--i": 0 }}
//       >
//         <div className="flex min-w-0 items-start gap-4">
//           <span className="mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne/60 bg-white text-primary shadow-travel-card sm:flex">
//             <HeaderIcon className="h-5 w-5" aria-hidden="true" />
//           </span>

//           <div className="min-w-0">
//             <div className="flex max-w-full items-center gap-3">
//               <span
//                 className="h-px w-8 shrink-0 bg-champagne"
//                 aria-hidden="true"
//               />
//               <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
//                 {collection.eyebrow}
//               </span>
//             </div>

//             <h3 className="mt-2 font-display text-[2.125rem] font-medium leading-[1.06] tracking-[-0.01em] text-text-display antialiased [text-wrap:balance] sm:text-[2.5rem]">
//               {renderTitle(collection.title)}
//             </h3>

//             <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-[15px]">
//               {collection.description}
//             </p>
//           </div>
//         </div>

//         <Link
//           to={`/packages?collection=${collection.key}`}
//           className="group hidden h-11 shrink-0 items-center gap-2 rounded-full border border-champagne/60 bg-white px-5 text-sm font-semibold tracking-wide text-text-dark transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex"
//         >
//           View all
//           <ArrowRight
//             className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
//             aria-hidden="true"
//           />
//         </Link>
//       </div>

//       {/* CAROUSEL */}
//       <div className="relative w-full">
//         {canScrollLeft && (
//           <button
//             type="button"
//             onClick={() => scrollCarousel("left")}
//             aria-label={`Previous ${collection.title}`}
//             className={`${ARROW_BUTTON} left-0 -translate-x-1/2`}
//           >
//             <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
//           </button>
//         )}

//         {/* Bleeds to the screen edge on phones so the next card peeks in.
//             Vertical padding keeps hover lifts and shadows from clipping. */}
//         <div
//           ref={carouselRef}
//           onScroll={handleScroll}
//           className="-mx-4 flex w-full snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-2 sm:mx-0 sm:scroll-pl-0 sm:gap-5 sm:px-1 lg:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
//         >
//           {collectionPackages.map((packageItem, index) => (
//             <div
//               key={getPackageKey(packageItem, index)}
//               data-package-card
//               className={`${CARD_BASIS} reveal-item`}
//               style={{ "--i": Math.min(index + 1, 6) }}
//             >
//               <DestinationCard
//                 packageItem={packageItem}
//                 collection={collection}
//               />
//             </div>
//           ))}
//         </div>

//         {canScrollRight && (
//           <button
//             type="button"
//             onClick={() => scrollCarousel("right")}
//             aria-label={`Next ${collection.title}`}
//             className={`${ARROW_BUTTON} right-0 translate-x-1/2`}
//           >
//             <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
//           </button>
//         )}
//       </div>

//       {/* PHONE FOOTER: swipe progress + view all */}
//       <div className="mt-1 flex items-center gap-4 sm:hidden">
//         {canScroll ? (
//           <div
//             className="h-0.5 flex-1 overflow-hidden rounded-full bg-champagne/30"
//             aria-hidden="true"
//           >
//             <div
//               ref={progressRef}
//               className="h-full w-1/3 rounded-full bg-ink/70 will-change-transform"
//             />
//           </div>
//         ) : (
//           <div className="flex-1" />
//         )}

//         <Link
//           to={`/packages?collection=${collection.key}`}
//           className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-champagne/60 bg-white px-4 text-[13px] font-semibold tracking-wide text-text-dark transition-colors hover:border-ink hover:bg-ink hover:text-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
//         >
//           View all
//           <ArrowRight className="h-4 w-4" aria-hidden="true" />
//         </Link>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    MAIN COMPONENT
// ========================================================= */

// export default function PackagesSection() {
//   /* Same cache system as the rest of the public site. */
//   const {
//     data: packageResponse,
//     loading,
//     error: queryError,
//   } = useQuery(getPackages);

//   const packages = useMemo(() => {
//     if (Array.isArray(packageResponse)) return packageResponse;
//     if (Array.isArray(packageResponse?.items)) return packageResponse.items;
//     if (Array.isArray(packageResponse?.packages)) return packageResponse.packages;
//     if (Array.isArray(packageResponse?.data)) return packageResponse.data;
//     return [];
//   }, [packageResponse]);

//   const publishedPackages = useMemo(
//     () => packages.filter(isPublishedPackage),
//     [packages]
//   );

//   const errorMessage =
//     queryError?.message || (typeof queryError === "string" ? queryError : "");

//   return (
//     <section
//       id="packages"
//       aria-labelledby="packages-section-title"
//       className="relative isolate w-full overflow-x-clip bg-gradient-to-b from-background to-surface-alt py-16 antialiased sm:py-20 lg:py-24"
//     >
//       {/* Soft champagne wash, echoing the hero */}
//       <div
//         className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,210,180,0.18)_0%,transparent_60%)]"
//         aria-hidden="true"
//       />

//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         {/* MAIN HEADER */}
//         <Reveal className="mx-auto max-w-3xl text-left sm:text-center">
//           <div className="flex max-w-full items-center gap-3 sm:justify-center">
//             <span
//               className="h-px w-8 shrink-0 bg-champagne"
//               aria-hidden="true"
//             />
//             <span className="truncate text-[11px] font-medium uppercase tracking-[0.24em] text-primary sm:text-xs">
//               {BRAND_NAME}
//             </span>
//             <span
//               className="hidden h-px w-8 shrink-0 bg-champagne sm:block"
//               aria-hidden="true"
//             />
//           </div>

//           <h2
//             id="packages-section-title"
//             className="mt-4 font-display text-[2.75rem] font-medium leading-[1.03] tracking-[-0.015em] text-text-display [text-wrap:balance] sm:text-[3.25rem] lg:text-[3.75rem]"
//           >
//             {renderTitle("Destinations worth the journey")}
//           </h2>

//           <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:mx-auto sm:max-w-2xl sm:text-lg sm:leading-8">
//             Explore places chosen with care, each one planned from the first
//             idea to the journey home.
//           </p>
//         </Reveal>

//         {/* LOADING */}
//         {loading && (
//           <div className="mt-12 sm:mt-14" role="status" aria-label="Loading destinations">
//             {COLLECTIONS.slice(0, 2).map((collection, collectionIndex) => (
//               <div
//                 key={collection.key}
//                 className={collectionIndex === 0 ? "" : "mt-14 sm:mt-16"}
//               >
//                 <div className="mb-6 sm:mb-8">
//                   <div className="h-3 w-32 animate-pulse rounded bg-surface-strong" />
//                   <div className="mt-3 h-9 w-64 max-w-full animate-pulse rounded bg-surface-strong sm:h-10" />
//                   <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-surface-strong" />
//                 </div>

//                 <div className="-mx-4 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:gap-5 sm:px-0 lg:gap-6">
//                   {Array.from({ length: 4 }).map((_, index) => (
//                     <DestinationCardSkeleton key={index} />
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ERROR */}
//         {!loading && errorMessage && (
//           <div className="mt-12 rounded-3xl border border-error/20 bg-error-bg px-6 py-10 text-center">
//             <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white">
//               <PackageOpen className="h-5 w-5 text-error" aria-hidden="true" />
//             </div>
//             <h3 className="mt-3 text-lg font-semibold text-error-text">
//               Unable to load destinations
//             </h3>
//             <p className="mx-auto mt-1.5 max-w-md text-sm text-error-text">
//               Please refresh the page and try again.
//             </p>
//           </div>
//         )}

//         {/* EMPTY */}
//         {!loading && !errorMessage && publishedPackages.length === 0 && (
//           <div className="mt-12 rounded-3xl border border-dashed border-champagne/60 bg-card px-5 py-12 text-center sm:px-8">
//             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-champagne/60 bg-white">
//               <PackageOpen
//                 className="h-6 w-6 text-placeholder"
//                 aria-hidden="true"
//               />
//             </div>
//             <h3 className="mt-4 font-display text-2xl font-medium text-text-display">
//               New destinations coming soon
//             </h3>
//             <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
//               We are preparing our next collection of journeys. Please check
//               back soon.
//             </p>
//           </div>
//         )}

//         {/* COLLECTION ROWS */}
//         {!loading && !errorMessage && publishedPackages.length > 0 && (
//           <div className="mt-12 sm:mt-14">
//             {COLLECTIONS.map((collection) => (
//               <CollectionRow
//                 key={collection.key}
//                 collection={collection}
//                 packages={publishedPackages}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }




