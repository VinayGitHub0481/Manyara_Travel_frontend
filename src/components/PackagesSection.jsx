

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImageOff,
  MapPin,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { getPackages } from "../api/content";

/* =========================================================
   COLLECTION CONFIG
========================================================= */

const COLLECTIONS = [
  {
    key: "new",
    label: "New",
    description: "Explore our latest travel packages.",
    flag: "is_new",
  },
  {
    key: "most_visited",
    label: "Most Visited",
    description: "Discover destinations our travellers love.",
    flag: "is_most_visited",
  },
  {
    key: "featured",
    label: "Featured",
    description: "Handpicked experiences from On a Trip Holidays.",
    flag: "is_featured",
  },
  {
    key: "recommended",
    label: "Recommended",
    description: "Thoughtfully selected trips for your next getaway.",
    flag: "is_recommended",
  },
  {
    key: "trending",
    label: "Trending",
    description: "See what travellers are exploring right now.",
    flag: "is_trending",
  },
  {
    key: "popular",
    label: "Popular",
    description: "Popular packages across our destinations.",
    flag: "is_popular",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const isTruthy = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image?.url || image?.src || "";
  }

  return "";
};

const getPackageImage = (packageItem) => {
  if (!packageItem) {
    return "";
  }

  if (Array.isArray(packageItem.images)) {
    for (const image of packageItem.images) {
      const imageUrl = getImageUrl(image);

      if (imageUrl) {
        return imageUrl;
      }
    }
  }

  return (
    getImageUrl(packageItem.image) ||
    getImageUrl(packageItem.cover_image) ||
    "/images/placeholder-travel.webp"
  );
};

const getDuration = (packageItem) => {
  if (!packageItem) {
    return "";
  }

  if (packageItem.duration) {
    return packageItem.duration;
  }

  const days = Number(packageItem.duration_days);
  const nights = Number(packageItem.duration_nights);

  if (days > 0 && nights >= 0) {
    return `${days} ${
      days === 1 ? "Day" : "Days"
    } / ${nights} ${
      nights === 1 ? "Night" : "Nights"
    }`;
  }

  if (days > 0) {
    return `${days} ${days === 1 ? "Day" : "Days"}`;
  }

  if (nights > 0) {
    return `${nights} ${
      nights === 1 ? "Night" : "Nights"
    }`;
  }

  return "";
};

const formatPrice = (price) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

/* =========================================================
   GET PACKAGES FOR COLLECTION

   IMPORTANT:
   display_order is respected so packages appear in the
   exact order configured from the admin side.
========================================================= */

const getCollectionPackages = (collection, packages) => {
  if (!collection || !Array.isArray(packages)) {
    return [];
  }

  return packages
    .filter((packageItem) =>
      isTruthy(packageItem?.[collection.flag])
    )
    .sort((a, b) => {
      const orderA = Number(a?.display_order ?? 0);
      const orderB = Number(b?.display_order ?? 0);

      return orderA - orderB;
    });
};

/* =========================================================
   PACKAGE CARD SKELETON

   Same responsive sizing as actual package cards.
========================================================= */

function PackageCardSkeleton() {
  return (
    <div
      className="
        min-w-0
        shrink-0
        basis-full
        snap-start
        sm:basis-[calc(50%-12px)]
        lg:basis-[calc(25%-18px)]
      "
    >
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(6,27,69,0.08)]">
        {/* IMAGE */}
        <div className="h-48 animate-pulse bg-slate-200 sm:h-52 lg:h-56" />

        {/* CONTENT */}
        <div className="p-5">
          <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />

          <div className="mt-4 space-y-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-6 w-28 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </article>
    </div>
  );
}

/* =========================================================
   PACKAGE CARD

   Same general card structure as UpcomingBatchesSection.
========================================================= */

function PackageCard({ packageItem }) {
  const image = getPackageImage(packageItem);

  const title =
    packageItem?.title ||
    packageItem?.name ||
    "Travel Package";

  const destination =
    packageItem?.destination ||
    packageItem?.location ||
    "";

  const duration = getDuration(packageItem);

  const price = formatPrice(
    packageItem?.price_per_person ??
      packageItem?.price ??
      packageItem?.starting_price
  );

  const slug = packageItem?.slug;

  const handleImageError = (event) => {
    event.currentTarget.src =
      "/images/placeholder-travel.webp";
  };

  const content = (
    <>
      {/* =================================================
          IMAGE
      ================================================= */}

      <div className="relative h-48 overflow-hidden sm:h-52 lg:h-56">
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-700
            ease-out
            group-hover:scale-105
          "
        />

        {/* IMAGE OVERLAY */}

        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* DESTINATION */}

        {destination && (
          <div
            className="
              absolute
              bottom-3
              left-3
              right-3
              flex
              items-center
              gap-1.5
              text-sm
              font-medium
              text-white
            "
          >
            <MapPin
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">
              {destination}
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="flex min-h-[205px] flex-col p-5">
        {/* TITLE */}

        <h3
          className="
            line-clamp-2
            min-h-[3.5rem]
            font-display
            text-lg
            font-semibold
            leading-7
            text-[#061b45]
            transition-colors
            duration-500
            ease-out
            group-hover:text-[#e92f00]
          "
        >
          {title}
        </h3>

        {/* DETAILS */}

        {(duration || price) && (
          <div className="mt-3">
            {duration && (
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-slate-600
                "
              >
                <Clock3
                  className="h-4 w-4 shrink-0 text-[#e92f00]"
                  aria-hidden="true"
                />

                <span className="truncate">
                  {duration}
                </span>
              </div>
            )}

            {price && (
              <div
                className="
                  mt-3
                  border-t
                  border-slate-100
                  pt-3
                "
              >
                <p className="text-xs font-medium text-slate-500">
                  Starting from
                </p>

                <p className="mt-1 text-xl font-bold text-[#061b45]">
                  {price}
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW PACKAGE */}

        <div className="mt-auto pt-4">
          <span
            className="
              inline-flex
              items-center
              gap-1.5
              text-sm
              font-semibold
              text-[#e92f00]
              transition-all
              duration-500
              ease-out
              group-hover:gap-2.5
            "
          >
            View package

            <ArrowRight
              className="
                h-4
                w-4
                transition-transform
                duration-500
                ease-out
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </>
  );

  /* =======================================================
     WITHOUT SLUG
  ======================================================= */

  if (!slug) {
    return (
      <article
        className="
          group
          block
          h-full
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-[0_8px_30px_rgba(6,27,69,0.08)]
          transition-all
          duration-500
          ease-out
          hover:-translate-y-1
          hover:shadow-[0_16px_40px_rgba(6,27,69,0.14)]
        "
      >
        {content}
      </article>
    );
  }

  /* =======================================================
     WITH SLUG
  ======================================================= */

  return (
    <Link
      to={`/packages/${slug}`}
      className="
        group
        block
        h-full
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-[0_8px_30px_rgba(6,27,69,0.08)]
        transition-all
        duration-500
        ease-out
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(6,27,69,0.14)]
        focus:outline-none
        focus:ring-2
        focus:ring-[#ff5a2a]
        focus:ring-offset-2
      "
    >
      {content}
    </Link>
  );
}

/* =========================================================
   COLLECTION SECTION

   Every package collection gets its own carousel.
========================================================= */
function CollectionRow({
  collection,
  packages,
}) {
  const carouselRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const collectionPackages = getCollectionPackages(
    collection,
    packages
  );

  /* =========================================================
     UPDATE CHEVRON STATE

     - Hide left arrow at the beginning
     - Hide right arrow at the end
     - Hide both when all cards fit
  ========================================================= */

  const updateScrollState = () => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const maxScroll =
      container.scrollWidth - container.clientWidth;

    const currentScroll = container.scrollLeft;

    const threshold = 4;

    setCanScrollLeft(currentScroll > threshold);

    setCanScrollRight(
      currentScroll < maxScroll - threshold
    );
  };

  /* =========================================================
     INITIAL + RESIZE STATE

     Important for:
     - Mobile
     - Tablet
     - Desktop
     - Browser resize
     - Orientation changes
  ========================================================= */

  useEffect(() => {
    if (collectionPackages.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      updateScrollState();
    });

    window.addEventListener(
      "resize",
      updateScrollState
    );

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        updateScrollState
      );
    };
  }, [collectionPackages.length]);

  /* =========================================================
     SCROLL CAROUSEL

     Move by one complete visible page:
     Mobile  = 1 card
     Tablet  = 2 cards
     Desktop = 4 cards
  ========================================================= */

  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const card = container.querySelector(
      "[data-package-card]"
    );

    if (!card) {
      return;
    }

    const cardWidth =
      card.getBoundingClientRect().width;

    const computedStyle =
      window.getComputedStyle(container);

    const gap =
      parseFloat(
        computedStyle.columnGap ||
          computedStyle.gap ||
          "0"
      );

    const containerWidth = container.clientWidth;

    const cardsPerView = Math.max(
      1,
      Math.round(
        (containerWidth + gap) /
          (cardWidth + gap)
      )
    );

    const scrollAmount =
      (cardWidth + gap) * cardsPerView;

    container.scrollBy({
      left:
        direction === "right"
          ? scrollAmount
          : -scrollAmount,
      behavior: "smooth",
    });
  };

  if (collectionPackages.length === 0) {
    return null;
  }

  const showCarousel =
    canScrollLeft || canScrollRight;

  return (
    <div className="mt-10 first:mt-0 sm:mt-12">
      {/* =================================================
          COLLECTION HEADER
      ================================================= */}

      <div
        className="
          mb-5
          flex
          items-end
          justify-between
          gap-4
          border-b
          border-navy/10
          pb-4
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.14em]
              text-[#e92f00]
            "
          >
            {collection.label}
          </p>

          <h3
            className="
              mt-1
              font-display
              text-2xl
              font-semibold
              leading-tight
              text-[#061b45]
              sm:text-3xl
            "
          >
            {collection.label} Packages
          </h3>

          <p
            className="
              mt-1.5
              max-w-2xl
              text-sm
              leading-6
              text-slate-600
            "
          >
            {collection.description}
          </p>
        </div>

        <Link
          to={`/packages?collection=${collection.key}`}
          className="
            hidden
            shrink-0
            items-center
            gap-1.5
            text-sm
            font-semibold
            text-[#e92f00]
            transition-all
            duration-500
            hover:gap-2.5
            sm:inline-flex
          "
        >
          View all

          <ArrowRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* =================================================
          CAROUSEL
      ================================================= */}

      <div className="relative w-full">

        {/* =================================================
            LEFT CHEVRON

            Completely hidden when there is no previous
            card to scroll to.
        ================================================= */}

        {showCarousel && canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollCarousel("left")}
            aria-label={`Previous ${collection.label} packages`}
            className="
              absolute
              left-0
              top-1/2
              z-30
              flex
              h-10
              w-10
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-[#061b45]
              shadow-lg
              transition-all
              duration-300
              hover:scale-105
              hover:bg-[#061b45]
              hover:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-[#ff5a2a]
              focus:ring-offset-2
              sm:h-11
              sm:w-11
            "
          >
            <ChevronLeft
              className="h-5 w-5 sm:h-6 sm:w-6"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </button>
        )}

        {/* =================================================
            PACKAGE ROW
        ================================================= */}

        <div
          ref={carouselRef}
          onScroll={updateScrollState}
          className="
            flex
            w-full
            gap-4
            overflow-x-auto
            scroll-smooth
            snap-x
            snap-mandatory
            px-1
            pb-3
            sm:gap-5
            sm:px-2
            lg:gap-6
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
        >
          {collectionPackages.map((packageItem) => (
            <div
              key={
                packageItem?.id ||
                packageItem?.slug
              }
              data-package-card
              className="
                min-w-0
                shrink-0
                basis-full
                snap-start
                sm:basis-[calc(50%-10px)]
                lg:basis-[calc(25%-18px)]
              "
            >
              <PackageCard
                packageItem={packageItem}
              />
            </div>
          ))}
        </div>

        {/* =================================================
            RIGHT CHEVRON

            Completely hidden when there is no next
            card to scroll to.
        ================================================= */}

        {showCarousel && canScrollRight && (
          <button
            type="button"
            onClick={() => scrollCarousel("right")}
            aria-label={`Next ${collection.label} packages`}
            className="
              absolute
              right-0
              top-1/2
              z-30
              flex
              h-10
              w-10
              translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-[#061b45]
              shadow-lg
              transition-all
              duration-300
              hover:scale-105
              hover:bg-[#061b45]
              hover:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-[#ff5a2a]
              focus:ring-offset-2
              sm:h-11
              sm:w-11
            "
          >
            <ChevronRight
              className="h-5 w-5 sm:h-6 sm:w-6"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* =================================================
          MOBILE VIEW ALL
      ================================================= */}

      <div className="mt-3 flex justify-end sm:hidden">
        <Link
          to={`/packages?collection=${collection.key}`}
          className="
            inline-flex
            items-center
            gap-1.5
            text-sm
            font-semibold
            text-[#e92f00]
          "
        >
          View all

          <ArrowRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PackagesSection() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPackages();

      const publishedPackages = Array.isArray(data)
        ? data.filter(
            (packageItem) =>
              packageItem?.status === undefined ||
              packageItem?.status === "published"
          )
        : [];

      /*
        IMPORTANT:
        Do not randomly rearrange packages here.

        The individual collection rows use display_order
        so admin-defined ordering is preserved.
      */

      setPackages(publishedPackages);
    } catch (err) {
      console.error(
        "Failed to load packages:",
        err
      );

      setPackages([]);
      setError(
        "Unable to load packages. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      id="packages"
      className="
        bg-[#faf8f3]
        py-12
        sm:py-16
        lg:py-20
      "
      aria-labelledby="packages-section-title"
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
        {/* =================================================
            MAIN HEADER
        ================================================= */}

        <div className="mx-auto max-w-3xl text-center">
          <div
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-semibold
              uppercase
              tracking-[0.14em]
              text-[#e92f00]
              sm:text-sm
            "
          >
            <Sparkles
              className="h-4 w-4"
              aria-hidden="true"
            />

            Explore our packages
          </div>

          <h2
            id="packages-section-title"
            className="
              mt-2
              font-display
              text-3xl
              font-semibold
              tracking-tight
              text-[#061b45]
              sm:text-4xl
              lg:text-5xl
            "
          >
            Find a trip that feels right for you
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-slate-600
              sm:text-base
              sm:leading-7
            "
          >
            Browse our handpicked travel collections
            and discover your next experience.
          </p>
        </div>

        {/* =================================================
            LOADING SKELETONS

            Show all collection headings with skeleton
            package cards so the page structure is stable.
        ================================================= */}

        {loading && (
          <div className="mt-8 sm:mt-10">
            {COLLECTIONS.map((collection) => (
              <div
                key={collection.key}
                className="mt-8 first:mt-0 sm:mt-10"
              >
                {/* Skeleton heading */}

                <div className="mb-5 border-b border-navy/10 pb-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />

                  <div className="mt-2 h-7 w-48 animate-pulse rounded bg-slate-200 sm:h-8" />

                  <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-200" />
                </div>

                {/* Skeleton cards */}

                <div
                  className="
                    flex
                    gap-4
                    overflow-hidden
                    sm:gap-5
                    lg:gap-6
                  "
                >
                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <PackageCardSkeleton
                      key={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div
            className="
              mt-8
              rounded-2xl
              border
              border-red-100
              bg-red-50
              px-6
              py-10
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-red-100
              "
            >
              <PackageOpen
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-3 text-lg font-semibold text-red-900">
              Unable to load packages
            </h3>

            <p className="mx-auto mt-1.5 max-w-md text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadPackages}
              className="
                mt-5
                inline-flex
                items-center
                rounded-xl
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-red-700
                shadow-sm
                transition-all
                duration-300
                hover:bg-red-100
              "
            >
              Try again
            </button>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          packages.length === 0 && (
            <div
              className="
                mt-8
                rounded-2xl
                border
                border-dashed
                border-navy/15
                bg-white
                px-5
                py-10
                text-center
                sm:px-8
                sm:py-12
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
                  bg-navy/5
                "
              >
                <PackageOpen
                  className="h-6 w-6 text-navy/40"
                  aria-hidden="true"
                />
              </div>

              <h3
                className="
                  mt-4
                  font-display
                  text-xl
                  font-semibold
                  text-navy
                "
              >
                Packages coming soon
              </h3>

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
                We are currently preparing our
                travel packages. Please check back
                soon.
              </p>
            </div>
          )}

        {/* =================================================
            ALL SIX PACKAGE COLLECTION ROWS

            There is intentionally NO collection-card
            carousel here.

            Each collection gets its own package row.
        ================================================= */}

        {!loading &&
          !error &&
          packages.length > 0 && (
            <div className="mt-8 sm:mt-10">
              {COLLECTIONS.map((collection) => (
                <CollectionRow
                  key={collection.key}
                  collection={collection}
                  packages={packages}
                />
              ))}
            </div>
          )}
      </div>
    </section>
  );
}
