import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Filter,
  ImageOff,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getPackages } from "../api/content";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import FAQSection from "../components/FAQSection";

/* ==========================================================
   PACKAGE TYPE LABELS
   ========================================================== */

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

/* ==========================================================
   PACKAGE COLLECTIONS
   ========================================================== */

const PACKAGE_COLLECTIONS = [
  {
    value: "all",
    label: "All Packages",
    description:
      "Explore all available holiday packages from On a Trip Holidays.",
  },
  {
    value: "new",
    label: "New",
    description:
      "Discover our newest holiday packages and recently added travel experiences.",
  },
  {
    value: "most-visited",
    label: "Most Visited",
    description:
      "Explore holiday packages for destinations loved and visited by travellers.",
  },
  {
    value: "featured",
    label: "Featured",
    description:
      "Explore handpicked featured holiday packages from On a Trip Holidays.",
  },
  {
    value: "recommended",
    label: "Recommended",
    description:
      "Discover holiday packages recommended for memorable travel experiences.",
  },
  {
    value: "trending",
    label: "Trending",
    description:
      "Explore trending holiday packages and popular travel experiences.",
  },
  {
    value: "popular",
    label: "Popular",
    description:
      "Discover popular holiday packages selected by On a Trip Holidays.",
  },
];

/* ==========================================================
   COLLECTION → DATABASE FLAG
   ========================================================== */

const COLLECTION_FLAG_MAP = {
  new: "is_new",
  "most-visited": "is_most_visited",
  featured: "is_featured",
  recommended: "is_recommended",
  trending: "is_trending",
  popular: "is_popular",
};

/* ==========================================================
   PACKAGE TYPE NORMALIZATION
   ========================================================== */

const normalizePackageType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s-]+/g, "_");

  const aliases = {
    pilgrimage: "pilgrimage",

    family: "family",

    beach: "beach",

    romantic: "romantic",

    international: "international",

    mountains_and_adventure: "mountains_adventure",
    mountain_adventure: "mountains_adventure",
    mountains_adventure: "mountains_adventure",
    mountains: "mountains_adventure",
    adventure: "mountains_adventure",

    wildlife_and_nature: "wildlife_nature",
    wildlife_nature: "wildlife_nature",
    wildlife: "wildlife_nature",
    nature: "wildlife_nature",
  };

  return aliases[normalized] || normalized;
};

/* ==========================================================
   DESTINATION NORMALIZATION
   ========================================================== */

const normalizeDestination = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

/* ==========================================================
   COLLECTION NORMALIZATION
   ========================================================== */

const normalizeCollection = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  const aliases = {
    all: "all",
    new: "new",
    newest: "new",
    featured: "featured",
    recommended: "recommended",
    recommendation: "recommended",
    trending: "trending",
    popular: "popular",
    "most-visited": "most-visited",
    "mostvisited": "most-visited",
    "most-visited-packages": "most-visited",
    "most_visited": "most-visited",
  };

  return aliases[normalized] || "all";
};

/* ==========================================================
   PUBLISHED CHECK
   ========================================================== */

const isPublished = (pkg) =>
  pkg?.status === undefined ||
  pkg?.status === "published" ||
  pkg?.is_published === true;

/* ==========================================================
   IMAGE HELPERS
   ========================================================== */

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

const getPackageImage = (pkg) => {
  if (!pkg) return "";

  if (Array.isArray(pkg?.images) && pkg.images.length > 0) {
    const image = pkg.images
      .map(getImageUrl)
      .find((url) => Boolean(url));

    if (image) return image;
  }

  // Compatibility with older API structures.
  if (pkg?.image) {
    return getImageUrl(pkg.image);
  }

  if (pkg?.image_url) {
    return pkg.image_url;
  }

  return "";
};

/* ==========================================================
   PACKAGE TYPE LABEL
   ========================================================== */

const getPackageTypeLabel = (type) => {
  const normalized = normalizePackageType(type);

  return (
    PACKAGE_TYPE_LABELS[normalized] ||
    String(type || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Holiday"
  );
};

/* ==========================================================
   PRICE FORMAT
   ========================================================== */

const formatPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price on request";
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

/* ==========================================================
   PACKAGE CARD
   ========================================================== */

function PackageCard({ pkg }) {
  const imageUrl = getPackageImage(pkg);

  const packageHref = pkg?.slug
    ? `/packages/${pkg.slug}`
    : `/packages/${pkg?.id}`;

  const typeLabel = getPackageTypeLabel(
    pkg?.package_type || pkg?.type
  );

  return (
    <article
      className="
        group
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
      "
    >
      <Link to={packageHref} className="block">
        {/* IMAGE */}
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={pkg?.title || "Holiday package"}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                group-hover:scale-105
              "
              loading="lazy"
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
              <ImageOff className="h-8 w-8 text-navy/25" />
            </div>
          )}

          {/* TYPE BADGE */}
          <div
            className="
              absolute
              left-3
              top-3
              rounded-full
              bg-white/95
              px-3
              py-1.5
              text-xs
              font-semibold
              text-navy
              shadow-sm
              backdrop-blur
            "
          >
            {typeLabel}
          </div>

          {/* DISCOVERY BADGES */}
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
            {pkg?.is_new && (
              <span
                className="
                  rounded-full
                  bg-accent
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-white
                  shadow-sm
                "
              >
                New
              </span>
            )}

            {pkg?.is_featured && (
              <span
                className="
                  rounded-full
                  bg-navy
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-white
                  shadow-sm
                "
              >
                Featured
              </span>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-5">
          {/* DESTINATION */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-navy/50">
            <MapPin className="h-3.5 w-3.5" />
            <span>{pkg?.destination || "India"}</span>
          </div>

          {/* TITLE */}
          <h2
            className="
              mt-2
              line-clamp-2
              font-display
              text-xl
              font-semibold
              leading-snug
              text-navy
              transition-colors
              group-hover:text-accent
            "
          >
            {pkg?.title || "Holiday Package"}
          </h2>

          {/* DESCRIPTION */}
          {pkg?.description && (
            <p
              className="
                mt-2
                line-clamp-2
                text-sm
                leading-6
                text-navy/60
              "
            >
              {pkg.description}
            </p>
          )}

          {/* PRICE / DURATION */}
          <div
            className="
              mt-5
              flex
              items-end
              justify-between
              gap-4
              border-t
              border-navy/10
              pt-4
            "
          >
            <div>
              <p className="text-xs text-navy/45">
                Starting from
              </p>

              <p className="mt-0.5 text-lg font-bold text-navy">
                {formatPrice(pkg?.price)}
              </p>
            </div>

            <div
              className="
                inline-flex
                items-center
                gap-1.5
                text-xs
                font-medium
                text-navy/60
              "
            >
              <Clock className="h-4 w-4" />

              <span>
                {pkg?.duration_days &&
                pkg?.duration_nights !== undefined
                  ? `${pkg.duration_days} ${
                      Number(pkg.duration_days) === 1
                        ? "day"
                        : "days"
                    } / ${pkg.duration_nights} ${
                      Number(pkg.duration_nights) === 1
                        ? "night"
                        : "nights"
                    }`
                  : "Flexible"}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            className="
              mt-4
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-accent
            "
          >
            View Package

            <ArrowRight
              className="
                h-4
                w-4
                transition-transform
                duration-200
                group-hover:translate-x-1
              "
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ==========================================================
   FILTER SELECT
   ========================================================== */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      {label && (
        <label
          className="
            mb-2
            block
            text-xs
            font-semibold
            text-navy/60
          "
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="
            w-full
            appearance-none
            rounded-xl
            border
            border-navy/15
            bg-white
            px-4
            py-3
            pr-10
            text-sm
            text-navy
            outline-none
            transition-colors
            focus:border-accent
            focus:ring-2
            focus:ring-accent/10
          "
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-navy/45
          "
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* ==========================================================
   PACKAGE SKELETON
   ========================================================== */

function PackageSkeleton() {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-navy/10
        bg-white
      "
    >
      <div className="aspect-[16/10] animate-pulse bg-navy/5" />

      <div className="space-y-4 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-navy/10" />

        <div className="h-6 w-4/5 animate-pulse rounded bg-navy/10" />

        <div className="h-4 w-full animate-pulse rounded bg-navy/10" />

        <div className="h-4 w-2/3 animate-pulse rounded bg-navy/10" />

        <div className="flex justify-between border-t border-navy/10 pt-4">
          <div className="h-6 w-28 animate-pulse rounded bg-navy/10" />
          <div className="h-5 w-20 animate-pulse rounded bg-navy/10" />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   PAGE
   ========================================================== */

export default function PackagesPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  /* ========================================================
     URL STATE
     ======================================================== */

  const urlCollection = normalizeCollection(
    searchParams.get("collection") || "all"
  );

  const urlPackageType = normalizePackageType(
    searchParams.get("type") || ""
  );

  const urlDestination = String(
    searchParams.get("destination") || ""
  ).trim();

  /* ========================================================
     DATA STATE
     ======================================================== */

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ========================================================
     FILTER STATE
     ======================================================== */

  const [search, setSearch] = useState("");

  const [destination, setDestination] = useState(
    urlDestination || "all"
  );

  const [packageType, setPackageType] = useState(
    urlPackageType || ""
  );

  const [collection, setCollection] = useState(
    urlCollection || "all"
  );

  const [priceRange, setPriceRange] = useState("all");

  const [durationRange, setDurationRange] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("recommended");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /* ==========================================================
     SYNC URL → LOCAL STATE
     ========================================================== */

  useEffect(() => {
    setCollection(urlCollection || "all");

    setPackageType(urlPackageType || "");

    setDestination(urlDestination || "all");
  }, [
    urlCollection,
    urlPackageType,
    urlDestination,
  ]);

  /* ==========================================================
     FETCH PACKAGES
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadPackages = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getPackages();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.data)
              ? response.data
              : [];

        if (!cancelled) {
          setPackages(data.filter(isPublished));
        }
      } catch (err) {
        console.error(
          "Failed to load packages:",
          err
        );

        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to load packages right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     DESTINATION OPTIONS
     ========================================================== */

  const destinationOptions = useMemo(() => {
    const destinationMap = new Map();

    packages.forEach((pkg) => {
      const original = String(
        pkg?.destination || ""
      ).trim();

      if (!original) return;

      const normalized =
        normalizeDestination(original);

      if (!destinationMap.has(normalized)) {
        destinationMap.set(normalized, original);
      }
    });

    const destinations = Array.from(
      destinationMap.values()
    ).sort((a, b) =>
      a.localeCompare(b)
    );

    return [
      {
        value: "all",
        label: "All destinations",
      },
      ...destinations.map((item) => ({
        value: item,
        label: item,
      })),
    ];
  }, [packages]);

  /* ==========================================================
     SELECTED COLLECTION
     ========================================================== */

  const selectedCollection =
    PACKAGE_COLLECTIONS.find(
      (item) => item.value === collection
    ) || PACKAGE_COLLECTIONS[0];

  const selectedCollectionLabel =
    selectedCollection?.label || "All Packages";

  /* ==========================================================
     SELECTED PACKAGE TYPE
     ========================================================== */

  const selectedPackageTypeLabel =
    PACKAGE_TYPE_LABELS[packageType] || "";

  /* ==========================================================
     COLLECTION MATCH
     ========================================================== */

  const matchesCollection = (pkg) => {
    if (collection === "all") {
      return true;
    }

    const flag =
      COLLECTION_FLAG_MAP[collection];

    if (!flag) {
      return true;
    }

    return pkg?.[flag] === true;
  };

  /* ==========================================================
     FILTER + SORT
     ========================================================== */

  const filteredPackages = useMemo(() => {
    const searchTerm = search
      .trim()
      .toLowerCase();

    const selectedDestination =
      normalizeDestination(destination);

    const selectedType =
      normalizePackageType(packageType);

    const filtered = packages.filter((pkg) => {
      /* -----------------------------------------------------
         SEARCH
         ----------------------------------------------------- */

      if (searchTerm) {
        const title = String(
          pkg?.title || ""
        ).toLowerCase();

        const destinationName = String(
          pkg?.destination || ""
        ).toLowerCase();

        const slug = String(
          pkg?.slug || ""
        ).toLowerCase();

        const description = String(
          pkg?.description || ""
        ).toLowerCase();

        const packageTypeValue =
          normalizePackageType(
            pkg?.package_type ||
              pkg?.type ||
              ""
          );

        const packageTypeLabel =
          String(
            PACKAGE_TYPE_LABELS[
              packageTypeValue
            ] || ""
          ).toLowerCase();

        const matchesSearch =
          title.includes(searchTerm) ||
          destinationName.includes(searchTerm) ||
          slug.includes(searchTerm) ||
          description.includes(searchTerm) ||
          packageTypeLabel.includes(searchTerm);

        if (!matchesSearch) {
          return false;
        }
      }

      /* -----------------------------------------------------
         PACKAGE TYPE
         ----------------------------------------------------- */

      if (selectedType) {
        const packageTypeValue =
          normalizePackageType(
            pkg?.package_type ||
              pkg?.type ||
              ""
          );

        if (
          packageTypeValue !== selectedType
        ) {
          return false;
        }
      }

      /* -----------------------------------------------------
         DESTINATION
         ----------------------------------------------------- */

      if (
        destination !== "all" &&
        selectedDestination
      ) {
        const packageDestination =
          normalizeDestination(
            pkg?.destination
          );

        if (
          packageDestination !==
          selectedDestination
        ) {
          return false;
        }
      }

      /* -----------------------------------------------------
         COLLECTION
         ----------------------------------------------------- */

      if (!matchesCollection(pkg)) {
        return false;
      }

      /* -----------------------------------------------------
         PRICE
         ----------------------------------------------------- */

      const price = Number(pkg?.price);

      if (priceRange === "under-25000") {
        if (
          !Number.isFinite(price) ||
          price >= 25000
        ) {
          return false;
        }
      }

      if (priceRange === "25000-50000") {
        if (
          !Number.isFinite(price) ||
          price < 25000 ||
          price > 50000
        ) {
          return false;
        }
      }

      if (priceRange === "50000-100000") {
        if (
          !Number.isFinite(price) ||
          price < 50000 ||
          price > 100000
        ) {
          return false;
        }
      }

      if (priceRange === "100000-plus") {
        if (
          !Number.isFinite(price) ||
          price <= 100000
        ) {
          return false;
        }
      }

      /* -----------------------------------------------------
         DURATION
         ----------------------------------------------------- */

      const duration = Number(
        pkg?.duration_days
      );

      if (durationRange === "1-3") {
        if (
          !Number.isFinite(duration) ||
          duration < 1 ||
          duration > 3
        ) {
          return false;
        }
      }

      if (durationRange === "4-7") {
        if (
          !Number.isFinite(duration) ||
          duration < 4 ||
          duration > 7
        ) {
          return false;
        }
      }

      if (durationRange === "8-14") {
        if (
          !Number.isFinite(duration) ||
          duration < 8 ||
          duration > 14
        ) {
          return false;
        }
      }

      if (durationRange === "15-plus") {
        if (
          !Number.isFinite(duration) ||
          duration < 15
        ) {
          return false;
        }
      }

      return true;
    });

    /* ======================================================
       SORT
       ====================================================== */

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") {
        return (
          Number(a?.price || 0) -
          Number(b?.price || 0)
        );
      }

      if (sortBy === "price-high") {
        return (
          Number(b?.price || 0) -
          Number(a?.price || 0)
        );
      }

      if (sortBy === "duration-short") {
        return (
          Number(a?.duration_days || 0) -
          Number(b?.duration_days || 0)
        );
      }

      if (sortBy === "duration-long") {
        return (
          Number(b?.duration_days || 0) -
          Number(a?.duration_days || 0)
        );
      }

      if (sortBy === "newest") {
        const dateA = new Date(
          a?.created_at || 0
        ).getTime();

        const dateB = new Date(
          b?.created_at || 0
        ).getTime();

        return dateB - dateA;
      }

      /* -----------------------------------------------------
         RECOMMENDED
         display_order
         → recommended
         → featured
         → id
         ----------------------------------------------------- */

      const displayOrderA =
        Number.isFinite(
          Number(a?.display_order)
        )
          ? Number(a?.display_order)
          : Number.MAX_SAFE_INTEGER;

      const displayOrderB =
        Number.isFinite(
          Number(b?.display_order)
        )
          ? Number(b?.display_order)
          : Number.MAX_SAFE_INTEGER;

      if (
        displayOrderA !== displayOrderB
      ) {
        return (
          displayOrderA -
          displayOrderB
        );
      }

      if (
        a?.is_recommended !==
        b?.is_recommended
      ) {
        return a?.is_recommended
          ? -1
          : 1;
      }

      if (
        a?.is_featured !==
        b?.is_featured
      ) {
        return a?.is_featured
          ? -1
          : 1;
      }

      return (
        Number(a?.id || 0) -
        Number(b?.id || 0)
      );
    });
  }, [
    packages,
    search,
    destination,
    packageType,
    collection,
    priceRange,
    durationRange,
    sortBy,
  ]);

  /* ==========================================================
     DESTINATION CHANGE
     Keep destination in URL.
     ========================================================== */

  const handleDestinationChange = (
    nextDestination
  ) => {
    setDestination(nextDestination);

    const params = new URLSearchParams(
      searchParams
    );

    if (
      !nextDestination ||
      nextDestination === "all"
    ) {
      params.delete("destination");
    } else {
      params.set(
        "destination",
        nextDestination
      );
    }

    setSearchParams(params, {
      replace: true,
    });
  };

  /* ==========================================================
     COLLECTION CHANGE
     Preserve destination/type while changing collection.
     ========================================================== */

  const handleCollectionChange = (
    nextCollection
  ) => {
    const normalized =
      normalizeCollection(
        nextCollection
      );

    const params = new URLSearchParams(
      searchParams
    );

    if (
      normalized &&
      normalized !== "all"
    ) {
      params.set(
        "collection",
        normalized
      );
    } else {
      params.delete("collection");
    }

    setSearchParams(params, {
      replace: true,
    });
  };

  /* ==========================================================
     RESET REFINEMENT FILTERS
     Clear search/filter URL state as well.
     ========================================================== */

  const resetFilters = () => {
    setSearch("");

    setDestination("all");

    setPackageType("");

    setPriceRange("all");

    setDurationRange("all");

    setSortBy("recommended");

    setSearchParams(
      {},
      {
        replace: true,
      }
    );
  };

  /* ==========================================================
     ACTIVE FILTERS
     ========================================================== */

  const hasActiveFilters =
    search.trim() !== "" ||
    destination !== "all" ||
    packageType !== "" ||
    priceRange !== "all" ||
    durationRange !== "all";

  /* ==========================================================
     PAGE CONTEXT
     ========================================================== */

  const pageContextLabel =
    destination !== "all"
      ? `${destination} Packages`
      : packageType
        ? `${selectedPackageTypeLabel} Packages`
        : collection !== "all"
          ? `${selectedCollectionLabel} Holiday Packages`
          : "Find the right holiday package for your journey";

  const pageContextDescription =
    destination !== "all"
      ? `Explore all available holiday packages for ${destination} from On a Trip Holidays. Compare destinations, durations and prices.`
      : packageType
        ? `Explore ${selectedPackageTypeLabel.toLowerCase()} holiday packages from On a Trip Holidays. Discover curated destinations, experiences, durations and prices.`
        : collection !== "all"
          ? selectedCollection?.description
          : "Explore holiday packages by destination, package type, price and duration.";

  /* ==========================================================
     SEO
     ========================================================== */

  let seoTitle =
    "Holiday Packages | On a Trip Holidays";

  let seoDescription =
    "Explore holiday packages from On a Trip Holidays. Discover curated travel experiences, destinations, durations and prices.";

  if (destination !== "all") {
    seoTitle = `${destination} Holiday Packages | On a Trip Holidays`;

    seoDescription = `Explore ${destination} holiday packages from On a Trip Holidays. Discover available travel experiences, durations and prices.`;
  } else if (packageType) {
    seoTitle = `${selectedPackageTypeLabel} Holiday Packages | On a Trip Holidays`;

    seoDescription = `Explore ${selectedPackageTypeLabel.toLowerCase()} holiday packages from On a Trip Holidays. Discover curated destinations, travel experiences, durations and prices.`;
  } else if (collection !== "all") {
    seoTitle = `${selectedCollectionLabel} Holiday Packages | On a Trip Holidays`;

    seoDescription = `Explore ${selectedCollectionLabel.toLowerCase()} holiday packages from On a Trip Holidays. Discover curated destinations, travel experiences, durations and prices.`;
  }

  /* ==========================================================
     CANONICAL
     Query parameters are filtering states and should
     not create separate canonical URLs.
     ========================================================== */

  const siteUrl =
    import.meta.env.VITE_SITE_URL ||
    "https://onatripholidays.com";

  const canonicalUrl = `${siteUrl}/packages`;

  /* ==========================================================
     FILTER CONTENT
     Shared by desktop sidebar and mobile drawer.
     ========================================================== */

  const filters = (
    <div className="space-y-5">
      {/* SEARCH */}
      <div>
        <label
          htmlFor="package-search"
          className="
            mb-2
            block
            text-xs
            font-semibold
            text-navy/60
          "
        >
          Search
        </label>

        <div className="relative">
          <Search
            className="
              absolute
              left-3.5
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-navy/40
            "
            aria-hidden="true"
          />

          <input
            id="package-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search packages..."
            className="
              w-full
              rounded-xl
              border
              border-navy/15
              bg-white
              px-10
              py-3
              text-sm
              text-navy
              outline-none
              focus:border-accent
              focus:ring-2
              focus:ring-accent/10
            "
          />
        </div>
      </div>

      {/* DESTINATION */}
      <FilterSelect
        label="Destination"
        value={destination}
        onChange={handleDestinationChange}
        options={destinationOptions}
      />

      {/* PRICE */}
      <FilterSelect
        label="Price"
        value={priceRange}
        onChange={setPriceRange}
        options={[
          {
            value: "all",
            label: "Any price",
          },
          {
            value: "under-25000",
            label: "Under ₹25,000",
          },
          {
            value: "25000-50000",
            label: "₹25,000 – ₹50,000",
          },
          {
            value: "50000-100000",
            label: "₹50,000 – ₹1,00,000",
          },
          {
            value: "100000-plus",
            label: "Above ₹1,00,000",
          },
        ]}
      />

      {/* DURATION */}
      <FilterSelect
        label="Duration"
        value={durationRange}
        onChange={setDurationRange}
        options={[
          {
            value: "all",
            label: "Any duration",
          },
          {
            value: "1-3",
            label: "1 – 3 days",
          },
          {
            value: "4-7",
            label: "4 – 7 days",
          },
          {
            value: "8-14",
            label: "8 – 14 days",
          },
          {
            value: "15-plus",
            label: "15+ days",
          },
        ]}
      />

      {/* RESET */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-navy/15
            px-4
            py-3
            text-sm
            font-semibold
            text-navy
            transition-colors
            hover:bg-surface
          "
        >
          <X className="h-4 w-4" />
          Clear Filters
        </button>
      )}
    </div>
  );

  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <>
      {/* SEO */}
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
      />

      <main className="min-h-screen bg-white">
        {/* ====================================================
            HERO
            ==================================================== */}

        <section className="border-b border-navy/10 bg-surface">
          <div
            className="
              mx-auto
              max-w-7xl
              px-4
              py-6
              sm:px-6
              sm:py-8
              lg:px-8
              lg:py-10
            "
          >
            <div className="max-w-4xl">
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-accent
                "
              >
                Explore with On a Trip
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
                {pageContextLabel}
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-navy/60
                "
              >
                {pageContextDescription}
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            MAIN CONTENT
            ==================================================== */}

        <section
          className="
            mx-auto
            max-w-7xl
            px-4
            py-6
            sm:px-6
            sm:py-8
            lg:px-8
            lg:py-10
          "
        >
          {/* ==================================================
              PACKAGE COLLECTION NAVIGATION
              ================================================== */}

          <div className="mb-8 sm:mb-10">
            <div className="mb-4">
              <h2
                className="
                  font-display
                  text-xs
                  font-semibold
                  text-accent
                  sm:text-sm
                "
              >
                Explore our packages
              </h2>
            </div>

            {/* COLLECTION TABS */}
            <div
              className="
                flex
                gap-2
                overflow-x-auto
                pb-2
                scrollbar-hide
              "
            >
              {PACKAGE_COLLECTIONS.map(
                (item) => {
                  const active =
                    collection ===
                    item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        handleCollectionChange(
                          item.value
                        )
                      }
                      aria-pressed={active}
                      className={`
                        inline-flex
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        transition-all
                        duration-200
                        ${
                          active
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-navy/15 bg-white text-navy hover:border-accent hover:text-accent"
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* ==================================================
              ACTIVE URL CONTEXT
              ================================================== */}

          {(destination !== "all" ||
            packageType) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {destination !== "all" && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-navy/10
                    bg-surface
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-navy
                  "
                >
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {destination}
                </span>
              )}

              {packageType && (
                <span
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    border
                    border-navy/10
                    bg-surface
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-navy
                  "
                >
                  {selectedPackageTypeLabel}
                </span>
              )}
            </div>
          )}

          {/* ==================================================
              MOBILE FILTER BUTTON
              ================================================== */}

          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-navy/15
                bg-white
                px-5
                py-3.5
                font-semibold
                text-navy
                shadow-sm
              "
            >
              <SlidersHorizontal className="h-4 w-4" />

              Filters

              {hasActiveFilters && (
                <span
                  className="
                    inline-flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-accent
                    px-1.5
                    text-xs
                    text-white
                  "
                >
                  !
                </span>
              )}
            </button>
          </div>

          {/* ==================================================
              DESKTOP GRID
              ================================================== */}

          <div
            className="
              grid
              grid-cols-1
              items-start
              gap-8
              lg:grid-cols-[260px_minmax(0,1fr)]
              lg:gap-10
            "
          >
            {/* =================================================
                DESKTOP SIDEBAR
                ================================================= */}

            <aside
              className="
                sticky
                top-24
                hidden
                lg:block
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-navy/10
                  bg-surface
                  p-5
                "
              >
                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Filter className="h-4 w-4 text-accent" />

                  <h2
                    className="
                      font-semibold
                      text-navy
                    "
                  >
                    Filter Packages
                  </h2>
                </div>

                {filters}
              </div>
            </aside>

            {/* =================================================
                PACKAGE RESULTS
                ================================================= */}

            <div className="min-w-0">
              {/* RESULTS TOOLBAR */}
              <div
                className="
                  mb-6
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  {!loading && !error && (
                    <>
                      <p className="text-sm text-navy/60">
                        Showing{" "}
                        <span className="font-semibold text-navy">
                          {
                            filteredPackages.length
                          }
                        </span>{" "}
                        {filteredPackages.length ===
                        1
                          ? "package"
                          : "packages"}
                      </p>

                      {collection !==
                        "all" && (
                        <p className="mt-1 text-xs text-navy/45">
                          Collection:{" "}
                          <span className="font-semibold text-navy/70">
                            {
                              selectedCollectionLabel
                            }
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* SORT */}
                <div className="w-full sm:w-56">
                  <FilterSelect
                    label=""
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      {
                        value: "recommended",
                        label: "Recommended",
                      },
                      {
                        value: "price-low",
                        label: "Price: Low to High",
                      },
                      {
                        value: "price-high",
                        label: "Price: High to Low",
                      },
                      {
                        value: "duration-short",
                        label: "Duration: Shortest",
                      },
                      {
                        value: "duration-long",
                        label: "Duration: Longest",
                      },
                      {
                        value: "newest",
                        label: "Newest",
                      },
                    ]}
                  />
                </div>
              </div>

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
                    sm:gap-6
                  "
                >
                  {[1, 2, 3, 4, 5, 6].map(
                    (item) => (
                      <PackageSkeleton
                        key={item}
                      />
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
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    p-6
                    text-center
                    sm:p-8
                  "
                >
                  <p
                    className="
                      font-semibold
                      text-navy
                    "
                  >
                    Couldn't load packages
                  </p>

                  <p
                    className="
                      mt-2
                      text-sm
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
                      font-semibold
                      text-white
                      transition-colors
                      hover:bg-accent-hover
                    "
                  >
                    Try Again

                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* =================================================
                  EMPTY
                  ================================================= */}

              {!loading &&
                !error &&
                filteredPackages.length ===
                  0 && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-navy/10
                      bg-surface
                      p-8
                      text-center
                      sm:p-12
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
                        border
                        border-navy/10
                        bg-white
                      "
                    >
                      <Search
                        className="
                          h-6
                          w-6
                          text-navy/40
                        "
                      />
                    </div>

                    <h2
                      className="
                        mt-4
                        font-display
                        text-xl
                        font-semibold
                        text-navy
                        sm:text-2xl
                      "
                    >
                      No packages found
                    </h2>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-md
                        text-sm
                        text-navy/60
                      "
                    >
                      {destination !==
                        "all"
                        ? `There are currently no packages available for ${destination} matching your selected filters.`
                        : packageType
                          ? `There are currently no ${selectedPackageTypeLabel.toLowerCase()} packages matching your selected filters.`
                          : collection !==
                              "all"
                            ? `There are currently no ${selectedCollectionLabel.toLowerCase()} packages matching your selected filters.`
                            : "Try changing your search or filters to find available packages."}
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={
                          resetFilters
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
                          font-semibold
                          text-white
                          transition-colors
                          hover:bg-accent-hover
                        "
                      >
                        Clear Filters

                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

              {/* =================================================
                  PACKAGES
                  ================================================= */}

              {!loading &&
                !error &&
                filteredPackages.length >
                  0 && (
                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-5
                      sm:grid-cols-2
                      sm:gap-6
                    "
                  >
                    {filteredPackages.map(
                      (pkg) => (
                        <PackageCard
                          key={pkg?.id}
                          pkg={pkg}
                        />
                      )
                    )}
                  </div>
                )}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================
          MOBILE FILTER DRAWER
          ======================================================== */}

      {mobileFiltersOpen && (
        <div
          className="
            fixed
            inset-0
            z-[90]
            lg:hidden
          "
        >
          {/* BACKDROP */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
            className="
              absolute
              inset-0
              bg-black/40
            "
          />

          {/* DRAWER */}
          <div
            className="
              absolute
              right-0
              top-0
              flex
              h-full
              w-[min(90vw,380px)]
              flex-col
              bg-white
              shadow-2xl
            "
          >
            {/* HEADER */}
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                border-b
                border-navy/10
                px-5
                py-4
              "
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-accent" />

                <h2
                  className="
                    font-semibold
                    text-navy
                  "
                >
                  Filter Packages
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-surface
                "
                aria-label="Close filters"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            {/* FILTER BODY */}
            <div className="flex-1 overflow-y-auto p-5">
              {filters}
            </div>

            {/* FOOTER */}
            <div
              className="
                border-t
                border-navy/10
                p-5
              "
            >
              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false
                  )
                }
                className="
                  w-full
                  rounded-xl
                  bg-accent
                  px-5
                  py-3.5
                  font-semibold
                  text-white
                  transition-colors
                  hover:bg-accent-hover
                "
              >
                Show{" "}
                {filteredPackages.length}{" "}
                {filteredPackages.length === 1
                  ? "Package"
                  : "Packages"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FAQ
          ======================================================== */}

      <FAQSection category="packages"/>

      {/* ========================================================
          FOOTER
          ======================================================== */}

      <Footer />
    </>
  );
}




