

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  IndianRupee,
  MapPin,
  MessageSquareHeart,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getBatchBySlug } from "../../api/content";
import { useQuery } from "../../hooks/useQuery";
import EnquiryForm from "../EnquiryForm";
import generateBatchPDF from "../../components/BatchItinerarypdf";
import ReviewFormModal from "../../components/ReviewFormModal";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import FAQSection from "../../components/FAQSection";
import { RevealGroup } from "../../components/Reveal";

/* =========================================================
   BRAND
========================================================= */

const BRAND_NAME = "Manyara Prive Vacations";

/* Same button language as PackageDetail / DestinationDetail */
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70";

const PLACEHOLDER_IMAGE = "/images/travel-placeholder.webp";

/* =========================================================
   HELPERS
   (outside the component so they are stable and can be
   used inside useMemo without dependency warnings)
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
  }

  if (typeof image === "object") {
    return image?.url || image?.secure_url || image?.src || image?.image_url || "";
  }

  return "";
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (item === null || item === undefined) return "";

      if (typeof item === "string") return item.trim();

      if (typeof item === "object") {
        return (
          cleanText(item?.name) ||
          cleanText(item?.title) ||
          cleanText(item?.description) ||
          cleanText(item?.value) ||
          cleanText(item?.label) ||
          ""
        );
      }

      return String(item).trim();
    })
    .filter(Boolean);
};

/* Terms / cancellation can arrive as an array (batch data) or as a
   single text block (package data). Both become a list of text items. */
const normalizePolicy = (value) => {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }

  return normalizeList(value);
};

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(getImageUrl).filter(Boolean);
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const hasNumericPrice = (price) =>
  price !== null &&
  price !== undefined &&
  price !== "" &&
  !Number.isNaN(Number(price));

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Price on request";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return `₹${numericPrice.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const normalizeItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) return [];

  return [...itinerary]
    .sort((a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0))
    .map((item, index) => {
      const dayNumber = item?.day ?? index + 1;

      return {
        ...item,
        day: dayNumber,
        title: cleanText(item?.title) || `Day ${dayNumber}`,
        description: cleanText(item?.description) || cleanText(item?.details) || "",
        image: getImageUrl(item?.image) || null,
      };
    });
};

const createSeoDescription = ({
  title,
  destination,
  startDate,
  endDate,
  description,
}) => {
  const dateText =
    startDate && endDate
      ? `from ${formatDate(startDate)} to ${formatDate(endDate)}`
      : startDate
        ? `starting ${formatDate(startDate)}`
        : "";

  const base = [title, dateText, destination, `travel batch by ${BRAND_NAME}.`]
    .filter(Boolean)
    .join(" ");

  const detail = cleanText(description);
  const combined = detail ? `${base} ${detail}` : base;

  return combined.length <= 155
    ? combined
    : `${combined.slice(0, 152).trim()}...`;
};

const getSchemaAvailability = (availability) => {
  const normalized = String(availability || "").toLowerCase();

  if (normalized === "full" || normalized === "closed") {
    return "https://schema.org/OutOfStock";
  }

  if (normalized === "limited" || normalized === "almost_full") {
    return "https://schema.org/LimitedAvailability";
  }

  return "https://schema.org/InStock";
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function InfoCard({ icon, label, value, note }) {
  return (
    <div className="min-w-0 rounded-2xl border border-divider bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
          {icon}
        </div>
        <p className="text-xs text-muted sm:text-sm">{label}</p>
      </div>

      <p className="break-words text-base font-bold text-text-dark sm:text-lg">
        {value}
      </p>

      {note && <p className="mt-1 text-xs text-muted sm:text-sm">{note}</p>}
    </div>
  );
}

function SidebarInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold leading-6 text-text-dark">
        {value}
      </p>
    </div>
  );
}

function PolicyCard({ type, onClick }) {
  const isTerms = type === "terms";
  const Icon = isTerms ? FileText : ShieldCheck;

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-lift group w-full rounded-2xl border border-divider bg-card p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-travel-card focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-text-dark sm:text-lg">
            {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
          </h3>

          <p className="mt-1 text-sm text-muted">
            {isTerms
              ? "View booking terms and important information"
              : "View cancellation and refund information"}
          </p>
        </div>

        <ChevronRight
          className="arrow-shift h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

/* Shown only when nothing is cached yet. */
function DetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading batch details"
    >
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-48 rounded bg-primary/10" />
        <div className="mt-8 h-5 w-40 rounded bg-primary/10" />
        <div className="mt-4 h-12 w-3/4 rounded bg-primary/10" />
        <div className="mt-8 aspect-[4/3] rounded-3xl bg-primary/10 sm:aspect-[16/9] lg:aspect-[21/9]" />

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((key) => (
            <div key={key} className="h-28 rounded-2xl bg-primary/10" />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="h-8 w-56 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 rounded bg-primary/10" />
            <div className="h-4 w-2/3 rounded bg-primary/10" />
          </div>
          <div className="h-80 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

/* Missing batch (404) vs. a real loading problem */
function StateMessage({ title, message, code, onRetry }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        {code && (
          <p className="mb-3 font-display text-6xl font-semibold text-primary/30">
            {code}
          </p>
        )}

        <h1 className="mb-3 font-display text-3xl font-semibold text-text-dark sm:text-4xl">
          {title}
        </h1>

        <p className="mx-auto mb-8 max-w-md text-text">{message}</p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`${PRIMARY_BUTTON} min-h-[44px] px-5 py-3`}
            >
              Try again
            </button>
          )}

          <Link
            to="/batches"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Batches
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BatchDetails() {
  const { slug } = useParams();

  /* Cached data: instant on repeat visits, updates itself when fresh. */
  const { data, loading, error } = useQuery(getBatchBySlug, slug);
  const batch = data?.data ?? data ?? null;

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showFloatingDownload, setShowFloatingDownload] = useState(false);

  const mainContentRef = useRef(null);
  const faqRef = useRef(null);
  const footerRef = useRef(null);

  const canonicalPath = `/batches/${batch?.slug || slug || ""}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  /* --------------------------------------------------
     Close policy with Escape
  -------------------------------------------------- */
  useEffect(() => {
    if (!activePolicy) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setActivePolicy(null);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activePolicy]);

  /* --------------------------------------------------
     Floating download visibility
     - Mobile/tablet: floating button while main content is in view.
     - Desktop: the sticky sidebar card has the download action.
     - Hidden while a modal is open and near the FAQ / footer.
  -------------------------------------------------- */
  useEffect(() => {
    if (loading || !batch) {
      setShowFloatingDownload(false);
      return undefined;
    }

    const updateFloatingVisibility = () => {
      if (showEnquiry || showReview || activePolicy || !mainContentRef.current) {
        setShowFloatingDownload(false);
        return;
      }

      const mainRect = mainContentRef.current.getBoundingClientRect();
      const faqRect = faqRef.current?.getBoundingClientRect();
      const footerRect = footerRef.current?.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const mainVisible =
        mainRect.top < viewportHeight * 0.75 &&
        mainRect.bottom > viewportHeight * 0.25;

      const faqVisible = faqRect && faqRect.top < viewportHeight * 0.85;
      const footerVisible = footerRect && footerRect.top < viewportHeight * 0.85;

      setShowFloatingDownload(mainVisible && !faqVisible && !footerVisible);
    };

    updateFloatingVisibility();

    window.addEventListener("scroll", updateFloatingVisibility, { passive: true });
    window.addEventListener("resize", updateFloatingVisibility);

    return () => {
      window.removeEventListener("scroll", updateFloatingVisibility);
      window.removeEventListener("resize", updateFloatingVisibility);
    };
  }, [loading, batch, showEnquiry, showReview, activePolicy]);

  /* --------------------------------------------------
     PACKAGE DATA
  -------------------------------------------------- */
  const packageData = batch?.package || batch?.pkg || null;

  /* --------------------------------------------------
     IDENTITY
  -------------------------------------------------- */
  const title =
    cleanText(batch?.title) ||
    cleanText(batch?.package_title) ||
    cleanText(packageData?.title) ||
    "Travel Package";

  const destination =
    cleanText(batch?.destination) ||
    cleanText(packageData?.destination) ||
    "India";

  const description =
    cleanText(batch?.description) ||
    cleanText(packageData?.description) ||
    `Plan your journey with ${BRAND_NAME}.`;

  /* Memoized so EnquiryForm's prefill effect doesn't reset the
     user's selection on every parent re-render. */
  const enquiryPkg = useMemo(
    () => ({ ...packageData, title, destination, description }),
    [packageData, title, destination, description]
  );

  /* --------------------------------------------------
     IMAGES (batch images first, then parent package)
  -------------------------------------------------- */
  const images = useMemo(
    () =>
      normalizeImages(
        Array.isArray(batch?.images) && batch.images.length > 0
          ? batch.images
          : packageData?.images
      ),
    [batch?.images, packageData?.images]
  );

  const heroImage = images[0] || PLACEHOLDER_IMAGE;

  /* --------------------------------------------------
     FACILITIES / INCLUSIONS / EXCLUSIONS
  -------------------------------------------------- */
  const facilities = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.facilities) && batch.facilities.length > 0
          ? batch.facilities
          : packageData?.facilities || packageData?.facilities_included
      ),
    [batch?.facilities, packageData?.facilities, packageData?.facilities_included]
  );

  const inclusions = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.inclusions) && batch.inclusions.length > 0
          ? batch.inclusions
          : packageData?.inclusions || packageData?.inclusion
      ),
    [batch?.inclusions, packageData?.inclusions, packageData?.inclusion]
  );

  const exclusions = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.exclusions) && batch.exclusions.length > 0
          ? batch.exclusions
          : packageData?.exclusions || packageData?.exclusion
      ),
    [batch?.exclusions, packageData?.exclusions, packageData?.exclusion]
  );

  /* Batch itinerary is authoritative for a batch. The PDF generator
     follows the same batch-first rule. */
  const itinerary = useMemo(
    () => normalizeItinerary(batch?.itinerary),
    [batch?.itinerary]
  );

  /* --------------------------------------------------
     PRICE
  -------------------------------------------------- */
  const batchPrice =
    batch?.price_per_person ?? batch?.price ?? packageData?.price ?? null;

  const hasPrice = hasNumericPrice(batchPrice);

  /* --------------------------------------------------
     DURATION
  -------------------------------------------------- */
  const durationDays =
    batch?.duration_days ?? batch?.days ?? packageData?.duration_days ?? null;

  const durationNights =
    batch?.duration_nights ??
    batch?.nights ??
    packageData?.duration_nights ??
    (durationDays ? Math.max(Number(durationDays) - 1, 0) : null);

  const durationLabel = durationDays
    ? `${durationDays} Days${
        durationNights !== null ? ` / ${durationNights} Nights` : ""
      }`
    : "";

  /* --------------------------------------------------
     DATES
  -------------------------------------------------- */
  const startDate =
    batch?.departure_date ||
    batch?.start_date ||
    batch?.startDate ||
    batch?.departureDate ||
    null;

  const endDate =
    batch?.return_date ||
    batch?.end_date ||
    batch?.endDate ||
    batch?.returnDate ||
    null;

  const dateRangeLabel = `${formatDate(startDate)}${
    endDate ? ` – ${formatDate(endDate)}` : ""
  }`;

  /* --------------------------------------------------
     BATCH META
  -------------------------------------------------- */
  const batchStatus = cleanText(batch?.status);
  const availability = cleanText(batch?.availability);

  const batchType =
    cleanText(batch?.type) ||
    cleanText(batch?.batch_type) ||
    cleanText(batch?.category);

  /* --------------------------------------------------
     TERMS / CANCELLATION
     Batch data first, then package fallback.
  -------------------------------------------------- */
  const termsAndConditions = normalizePolicy(
    batch?.terms_and_conditions || batch?.terms || packageData?.terms_and_conditions
  );

  const cancellationPolicy = normalizePolicy(
    batch?.cancellation_policy ||
      batch?.cancellation ||
      packageData?.cancellation_policy
  );

  /* --------------------------------------------------
     SEO
  -------------------------------------------------- */
  const seoTitle = useMemo(() => {
    if (!batch) return `Travel Batch Details | ${BRAND_NAME}`;

    const datePart = startDate ? ` – ${formatDate(startDate)}` : "";

    return `${title}${datePart} | ${BRAND_NAME}`;
  }, [batch, title, startDate]);

  const seoDescription = useMemo(
    () =>
      createSeoDescription({ title, destination, startDate, endDate, description }),
    [title, destination, startDate, endDate, description]
  );

  /* --------------------------------------------------
     JSON-LD
  -------------------------------------------------- */
  const jsonLd = useMemo(() => {
    if (!batch) return null;

    const tripSchema = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: title,
      description: seoDescription,
      url: canonicalUrl,
      touristType: "Leisure Travelers",
      provider: {
        "@type": "TravelAgency",
        name: BRAND_NAME,
        url: SITE_URL,
      },
      ...(destination && {
        touristDestination: { "@type": "Place", name: destination },
      }),
      ...(images.length > 0 && { image: images }),
      ...(startDate && { departureTime: startDate }),
      ...(endDate && { arrivalTime: endDate }),
      ...(durationDays && { duration: `P${Number(durationDays)}D` }),
      ...(hasPrice && {
        offers: {
          "@type": "Offer",
          price: Number(batchPrice),
          priceCurrency: "INR",
          availability: getSchemaAvailability(availability),
          url: canonicalUrl,
        },
      }),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Packages",
          item: `${SITE_URL}/packages`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Travel Batches",
          item: `${SITE_URL}/batches`,
        },
        { "@type": "ListItem", position: 4, name: title, item: canonicalUrl },
      ],
    };

    return [tripSchema, breadcrumbSchema];
  }, [
    batch,
    title,
    seoDescription,
    canonicalUrl,
    destination,
    images,
    startDate,
    endDate,
    durationDays,
    batchPrice,
    hasPrice,
    availability,
  ]);

  /* --------------------------------------------------
     PDF DOWNLOAD
  -------------------------------------------------- */
  const handleDownloadBatchPDF = async () => {
    if (!batch || downloadingPDF) return;

    try {
      setDownloadingPDF(true);
      await generateBatchPDF({ batch, packageData });
    } catch (pdfError) {
      console.error("Batch PDF generation failed:", pdfError);
      window.alert("Unable to generate the batch itinerary PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* Download Itinerary -> enquiry form -> enquiry saved -> onSuccess -> PDF.
     EnquiryForm must call onSuccess only after the enquiry API succeeds,
     and gets downloadItinerary={false} so the PDF is not made twice. */
  const handleEnquirySuccess = async () => {
    await handleDownloadBatchPDF();
  };

  const openDownloadForm = () => {
    setShowEnquiry(true);
    setShowFloatingDownload(false);
  };

  const openReview = () => {
    setShowReview(true);
    setShowFloatingDownload(false);
  };

  /* --------------------------------------------------
     STATES
  -------------------------------------------------- */
  if (loading) {
    return <DetailSkeleton />;
  }

  if (!batch) {
    const status = error?.response?.status;
    const isRealError = Boolean(error) && status !== 404;

    if (isRealError) {
      console.error("Failed to load batch:", slug, error);

      return (
        <StateMessage
          title="We couldn't load this batch"
          message="Something went wrong while loading this page. Please check your connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <>
        <Seo
          title={`Travel Batch Not Found | ${BRAND_NAME}`}
          description={`The requested ${BRAND_NAME} travel batch could not be found.`}
          path={canonicalPath}
          noindex
        />

        <StateMessage
          code="404"
          title="Batch not found"
          message="The travel batch you are looking for may have been removed or is no longer available."
        />
      </>
    );
  }

  /* --------------------------------------------------
     MAIN

     NOTE (sticky sidebar): the page wrapper uses
     overflow-x-clip, NOT overflow-x-hidden.
     overflow-x-hidden turns the wrapper into a scroll
     container, which silently breaks position: sticky.
  -------------------------------------------------- */
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {/* ==================================================
          SEO
      ================================================== */}
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        path={canonicalPath}
        image={heroImage}
        type="product"
        jsonLd={jsonLd}
      />

      {/* ==================================================
          BREADCRUMB
      ================================================== */}
      <section className="border-b border-divider bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 overflow-hidden py-3 text-xs text-muted sm:gap-2 sm:py-4 sm:text-sm"
          >
            <Link to="/" className="shrink-0 transition hover:text-primary">
              Home
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

            <Link to="/batches" className="shrink-0 transition hover:text-primary">
              Batches
            </Link>

            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

            <span className="truncate font-medium text-text-dark">{title}</span>
          </nav>
        </div>
      </section>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}
      <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {/* BACK */}
        <Link
          to="/batches"
          className="group mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Back to Batches
        </Link>

        {/* ==================================================
            BATCH HEADER
        ================================================== */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mb-3">
            {destination && (
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary sm:text-base">
                <MapPin className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className="truncate">{destination}</span>
              </div>
            )}

            {batchStatus && (
              <span className="inline-flex items-center rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold capitalize text-primary-dark sm:text-sm">
                {batchStatus === "published"
                  ? "Open for Booking"
                  : batchStatus.replaceAll("_", " ")}
              </span>
            )}

            {availability && (
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-xs font-bold capitalize text-white sm:text-sm">
                {availability.replaceAll("_", " ")}
              </span>
            )}
          </div>

          <h1 className="break-words font-display text-4xl font-semibold leading-tight tracking-tight text-text-display sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {startDate && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary sm:mt-4 sm:text-base lg:text-lg">
              <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>{dateRangeLabel}</span>
            </div>
          )}
        </section>

        {/* ==================================================
            HERO IMAGE
        ================================================== */}
        <section className="mb-8 sm:mb-10 lg:mb-12">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-strong shadow-travel-card sm:aspect-[16/9] sm:rounded-3xl lg:aspect-[21/9]">
            <img
              src={heroImage}
              alt={`${title} travel batch in ${destination}`}
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
              width="1400"
              height="600"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
                  event.currentTarget.src = PLACEHOLDER_IMAGE;
                }
              }}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/65 via-ink-900/5 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-10">
              <div className="flex items-center gap-2 text-sm font-medium text-white/90 sm:text-base">
                <MapPin
                  className="h-[18px] w-[18px] text-accent-bright"
                  aria-hidden="true"
                />
                <span>{destination}</span>
              </div>

              <p className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                Your journey starts here
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}
        <section className="mb-10 sm:mb-12 lg:mb-14">
          <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <InfoCard
              icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
              label="Travel Dates"
              value={formatDate(startDate)}
              note={endDate ? `to ${formatDate(endDate)}` : undefined}
            />

            <InfoCard
              icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
              label="Duration"
              value={durationLabel || "Duration on request"}
            />

            <InfoCard
              icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
              label="Destination"
              value={destination}
            />

            <InfoCard
              icon={<IndianRupee className="h-5 w-5" aria-hidden="true" />}
              label="Batch Price"
              value={formatPrice(batchPrice)}
              note={hasPrice ? "Per person" : undefined}
            />
          </RevealGroup>
        </section>

        {/* ==================================================
            CONTENT + SIDEBAR
            items-start + self-start keep the sidebar able to stick.
            Sticky starts at lg; below that it flows normally.
        ================================================== */}
        <div
          ref={mainContentRef}
          className="grid grid-cols-1 items-start gap-8 pb-16 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-14"
        >
          {/* ==================================================
              LEFT CONTENT
          ================================================== */}
          <div className="min-w-0 space-y-10 sm:space-y-12 lg:space-y-14">
            {/* ABOUT */}
            {description && (
              <section>
                <h2 className="mb-4 font-display text-3xl font-semibold text-text-dark sm:mb-5">
                  About This Trip
                </h2>

                <div className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base sm:leading-8 lg:text-lg">
                  {description}
                </div>
              </section>
            )}

            {/* BATCH INFORMATION */}
            <section>
              <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
                Batch Information
              </h2>

              <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <InfoCard
                  icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                  label="Departure"
                  value={formatDate(startDate)}
                />

                <InfoCard
                  icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                  label="Return"
                  value={formatDate(endDate)}
                />

                <InfoCard
                  icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
                  label="Duration"
                  value={durationLabel || "On request"}
                />

                <InfoCard
                  icon={<IndianRupee className="h-5 w-5" aria-hidden="true" />}
                  label="Batch Price"
                  value={formatPrice(batchPrice)}
                />

                {batchType && (
                  <InfoCard
                    icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                    label="Batch Type"
                    value={<span className="capitalize">{batchType.replaceAll("_", " ")}</span>}
                  />
                )}

                {batchStatus && (
                  <InfoCard
                    icon={<Check className="h-5 w-5" aria-hidden="true" />}
                    label="Status"
                    value={<span className="capitalize">{batchStatus.replaceAll("_", " ")}</span>}
                  />
                )}
              </RevealGroup>
            </section>

            {/* FACILITIES */}
            {facilities.length > 0 && (
              <section>
                <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
                  Facilities
                </h2>

                <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {facilities.map((facility, index) => (
                    <div
                      key={`${facility}-${index}`}
                      className="flex min-w-0 items-start gap-3 rounded-xl border border-divider bg-card p-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <span className="min-w-0 break-words text-sm text-text sm:text-base">
                        {facility}
                      </span>
                    </div>
                  ))}
                </RevealGroup>
              </section>
            )}

            {/* ITINERARY */}
            {itinerary.length > 0 && (
              <section id="itinerary">
                <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
                  <h2 className="font-display text-3xl font-semibold text-text-dark">
                    Trip Itinerary
                  </h2>

                  <span className="text-sm text-muted">
                    {itinerary.length} {itinerary.length === 1 ? "Day" : "Days"}
                  </span>
                </div>

                <RevealGroup className="space-y-5 sm:space-y-6">
                  {itinerary.map((day, index) => (
                    <article
                      key={`${day.day}-${index}`}
                      className="overflow-hidden rounded-2xl border border-divider bg-card shadow-travel-card sm:rounded-3xl"
                    >
                      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
                          Day {day.day}
                        </span>
                      </div>

                      {day.title && (
                        <div className="px-5 pt-3 sm:px-6">
                          <h3 className="font-display text-2xl font-semibold text-text-dark">
                            {day.title}
                          </h3>
                        </div>
                      )}

                      {day.image && (
                        <div className="img-zoom mt-5 aspect-[16/9] overflow-hidden bg-surface-strong sm:aspect-[2/1]">
                          <img
                            src={day.image}
                            alt={`${title} - Day ${day.day}: ${day.title}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            width="1200"
                            height="600"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {day.description && (
                        <div className="p-5 sm:p-6">
                          <p className="whitespace-pre-line break-words text-sm leading-7 text-text sm:text-base">
                            {day.description}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </RevealGroup>
              </section>
            )}

            {/* INCLUSIONS / EXCLUSIONS */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <section>
                <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {inclusions.length > 0 && (
                    <div className="rounded-2xl border border-success/30 bg-success-bg/50 p-5 sm:p-6">
                      <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
                        What's Included
                      </h2>

                      <ul className="space-y-3">
                        {inclusions.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-3 text-sm text-text sm:text-base"
                          >
                            <Check
                              className="mt-0.5 h-5 w-5 shrink-0 text-success"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusions.length > 0 && (
                    <div className="rounded-2xl border border-error/30 bg-error-bg/50 p-5 sm:p-6">
                      <h2 className="mb-5 font-display text-2xl font-semibold text-text-dark">
                        What's Not Included
                      </h2>

                      <ul className="space-y-3">
                        {exclusions.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-3 text-sm text-text sm:text-base"
                          >
                            <X
                              className="mt-0.5 h-5 w-5 shrink-0 text-error"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </RevealGroup>
              </section>
            )}

            {/* IMPORTANT INFORMATION */}
            {(termsAndConditions.length > 0 || cancellationPolicy.length > 0) && (
              <section>
                <h2 className="mb-5 font-display text-3xl font-semibold text-text-dark sm:mb-6">
                  Important Information
                </h2>

                <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {termsAndConditions.length > 0 && (
                    <PolicyCard
                      type="terms"
                      onClick={() => setActivePolicy("terms")}
                    />
                  )}

                  {cancellationPolicy.length > 0 && (
                    <PolicyCard
                      type="cancellation"
                      onClick={() => setActivePolicy("cancellation")}
                    />
                  )}
                </RevealGroup>
              </section>
            )}
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
              Sticky ONLY on desktop (lg+). Offset follows the fixed
              header, same as PackageDetail.
          ================================================== */}
          <aside className="w-full self-start lg:sticky lg:top-[calc(var(--top-info-height,0px)+6rem)]">
            <div className="rounded-2xl border border-divider bg-card p-5 shadow-travel-card sm:rounded-3xl sm:p-6 lg:p-7">
              {/* PRICE (light brand gradient, not a dark block) */}
              <div className="relative mb-5 overflow-hidden rounded-2xl border border-primary/10 bg-brand-gradient p-5 sm:p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Batch Price
                </p>

                <div className="flex flex-wrap items-end gap-2">
                  <span className="font-display text-4xl font-semibold leading-none text-text-dark">
                    {formatPrice(batchPrice)}
                  </span>

                  {hasPrice && (
                    <span className="pb-0.5 text-sm text-text-secondary">
                      / person
                    </span>
                  )}
                </div>
              </div>

              {/* SUMMARY */}
              <div className="space-y-4 pb-5">
                <SidebarInfo label="Package" value={title} />
                <SidebarInfo label="Destination" value={destination} />
                <SidebarInfo label="Travel Date" value={dateRangeLabel} />
                <SidebarInfo label="Duration" value={durationLabel || "On request"} />

                {availability && (
                  <SidebarInfo
                    label="Availability"
                    value={<span className="capitalize">{availability.replaceAll("_", " ")}</span>}
                  />
                )}
              </div>

              {/* ACTIONS */}
              <div className="rounded-xl bg-surface p-4">
                <p className="text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
                  Submit your enquiry for{" "}
                  <strong className="text-text-dark">{title}</strong> and get
                  your itinerary. Our travel team will contact you with the next
                  steps.
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={openDownloadForm}
                    disabled={downloadingPDF}
                    className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {downloadingPDF ? "Preparing..." : "Download Itinerary"}
                  </button>

                  <Link
                    to="/batches"
                    className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-dark transition-colors hover:border-primary hover:bg-surface-soft hover:text-primary"
                  >
                    View More Batches
                    <ChevronRight className="arrow-shift h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ==================================================
          REVIEW CTA
          Full-width band BELOW <main>, above the FAQ
          (same as PackageDetail).
      ================================================== */}
      <section className="border-y border-divider bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-divider bg-card p-6 shadow-travel-card sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
                Traveller experiences
              </p>

              <h2 className="mt-2 font-display text-3xl font-semibold text-text-dark">
                Your Valuable Review
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-text sm:text-base">
                Share your experience with {BRAND_NAME} and help future
                travellers plan their journey with confidence.
              </p>
            </div>

            <button
              type="button"
              onClick={openReview}
              className={`${PRIMARY_BUTTON} min-h-[44px] shrink-0 px-5 py-3.5`}
            >
              <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
              Your Valuable Review
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          FAQ
      ================================================== */}
      <div ref={faqRef} className="w-full">
        <FAQSection category="batches" />
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}
      <div ref={footerRef}>
        <Footer />
      </div>

      {/* ==================================================
          FLOATING DOWNLOAD (mobile + tablet)
          Desktop uses the sticky sidebar card.
      ================================================== */}
      {showFloatingDownload && !showEnquiry && !showReview && !activePolicy && (
        <div className="fixed bottom-5 left-4 z-[80] sm:left-6 lg:hidden">
          <button
            type="button"
            onClick={openDownloadForm}
            disabled={downloadingPDF}
            aria-label="Download itinerary"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 sm:py-3.5 sm:text-base"
          >
            <Download className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
            <span>{downloadingPDF ? "Preparing..." : "Download Itinerary"}</span>
          </button>
        </div>
      )}

      {/* ==================================================
          ENQUIRY FORM
          PDF generation happens ONLY from onSuccess, after the
          enquiry API call succeeds.
      ================================================== */}
      {showEnquiry && (
        <EnquiryForm
          pkg={enquiryPkg}
          batch={batch}
          destination={destination}
          onClose={() => setShowEnquiry(false)}
          onSuccess={handleEnquirySuccess}
          downloadItinerary={false}
        />
      )}

      {/* ==================================================
          REVIEW MODAL
      ================================================== */}
      <ReviewFormModal
        open={showReview}
        pkg={{ ...packageData, title, destination }}
        onClose={() => setShowReview(false)}
        onSubmitted={() => setShowReview(false)}
      />

      {/* ==================================================
          TERMS / CANCELLATION POPUP
      ================================================== */}
      {activePolicy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setActivePolicy(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-policy-modal-title"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-divider px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
                  {activePolicy === "terms" ? (
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    id="batch-policy-modal-title"
                    className="font-display text-2xl font-semibold text-text-dark"
                  >
                    {activePolicy === "terms"
                      ? "Terms & Conditions"
                      : "Cancellation Policy"}
                  </h2>

                  <p className="text-xs text-muted sm:text-sm">
                    {activePolicy === "terms"
                      ? "Important booking information"
                      : "Cancellation and refund information"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface transition hover:bg-surface-soft"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-text-dark" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <div className="space-y-4 text-sm leading-7 text-text sm:text-base">
                {(activePolicy === "terms"
                  ? termsAndConditions
                  : cancellationPolicy
                ).map((item, index) => (
                  <div key={`${activePolicy}-${index}`} className="flex gap-3">
                    <span
                      className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <p className="min-w-0 whitespace-pre-line break-words">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-divider bg-surface px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className={`${PRIMARY_BUTTON} min-h-[44px] w-full px-6 py-3 sm:ml-auto sm:w-auto`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













































// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Check,
//   ChevronRight,
//   Clock3,
//   Download,
//   FileText,
//   MapPin,
//   MessageSquareHeart,
//   Phone,
//   ShieldCheck,
//   X,
// } from "lucide-react";
// import { Link, useNavigate, useParams } from "react-router-dom";

// import { getBatchBySlug } from "../../api/content";
// import EnquiryForm from "../EnquiryForm";
// import generateBatchPDF from "../../components/BatchItinerarypdf";
// import ReviewFormModal from "../../components/ReviewFormModal";
// import Footer from "../../components/Footer";
// import Seo, { SITE_URL } from "../../components/Seo";
// import FAQSection from "../../components/FAQSection";

// /* ============================================================
//    HELPERS
//    ============================================================ */
// const getImageUrl = (image) => {
//   if (!image) return "";

//   if (typeof image === "string") {
//     return image.trim();
//   }

//   if (typeof image === "object") {
//     return (
//       image?.url ||
//       image?.secure_url ||
//       image?.src ||
//       image?.image_url ||
//       ""
//     );
//   }

//   return "";
// };

// const cleanText = (value) => {
//   if (typeof value !== "string") return "";
//   return value.trim();
// };

// const normalizeList = (value) => {
//   if (!Array.isArray(value)) return [];

//   return value
//     .map((item) => {
//       if (item === null || item === undefined) return "";

//       if (typeof item === "string") {
//         return item.trim();
//       }

//       if (typeof item === "object") {
//         return (
//           cleanText(item?.name) ||
//           cleanText(item?.title) ||
//           cleanText(item?.description) ||
//           cleanText(item?.value) ||
//           cleanText(item?.label) ||
//           ""
//         );
//       }

//       return String(item).trim();
//     })
//     .filter(Boolean);
// };

// /*
//   Terms / cancellation can arrive as an array (batch data) or as a
//   single text block (package data, as used on PackageDetail).
//   Both shapes are converted into a list of text items.
// */
// const normalizePolicy = (value) => {
//   if (typeof value === "string") {
//     const text = value.trim();
//     return text ? [text] : [];
//   }

//   return normalizeList(value);
// };

// const normalizeImages = (images) => {
//   if (!Array.isArray(images)) return [];
//   return images.map(getImageUrl).filter(Boolean);
// };

// const formatDate = (date) => {
//   if (!date) return "—";

//   const parsed = new Date(date);

//   if (Number.isNaN(parsed.getTime())) {
//     return String(date);
//   }

//   return parsed.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const formatPrice = (price) => {
//   if (price === null || price === undefined || price === "") {
//     return "Price on request";
//   }

//   const numericPrice = Number(price);

//   if (Number.isNaN(numericPrice)) {
//     return String(price);
//   }

//   return `₹${numericPrice.toLocaleString("en-IN", {
//     maximumFractionDigits: 2,
//   })}`;
// };

// const normalizeItinerary = (itinerary) => {
//   if (!Array.isArray(itinerary)) return [];

//   return [...itinerary]
//     .sort((a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0))
//     .map((item, index) => {
//       const dayNumber = item?.day ?? index + 1;

//       return {
//         ...item,
//         day: dayNumber,
//         title: cleanText(item?.title) || `Day ${dayNumber}`,
//         description:
//           cleanText(item?.description) ||
//           cleanText(item?.details) ||
//           "",
//         image: getImageUrl(item?.image) || null,
//       };
//     });
// };

// const createSeoDescription = ({
//   title,
//   destination,
//   startDate,
//   endDate,
//   description,
// }) => {
//   const dateText =
//     startDate && endDate
//       ? `from ${formatDate(startDate)} to ${formatDate(endDate)}`
//       : startDate
//         ? `starting ${formatDate(startDate)}`
//         : "";

//   const base = [
//     title,
//     dateText,
//     destination,
//     "travel batch by On a Trip Holiday.",
//   ]
//     .filter(Boolean)
//     .join(" ");

//   const detail = cleanText(description);
//   const combined = detail ? `${base} ${detail}` : base;

//   return combined.length <= 155
//     ? combined
//     : `${combined.slice(0, 152).trim()}...`;
// };

// const getSchemaAvailability = (availability) => {
//   const normalized = String(availability || "").toLowerCase();

//   if (normalized === "full" || normalized === "closed") {
//     return "https://schema.org/OutOfStock";
//   }

//   if (normalized === "limited" || normalized === "almost_full") {
//     return "https://schema.org/LimitedAvailability";
//   }

//   return "https://schema.org/InStock";
// };

// /* ============================================================
//    COMPONENT
//    ============================================================ */
// export default function BatchDetails() {
//   const { slug } = useParams();
//   const navigate = useNavigate();

//   const [batch, setBatch] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [showEnquiry, setShowEnquiry] = useState(false);
//   const [showReview, setShowReview] = useState(false);
//   const [activePolicy, setActivePolicy] = useState(null);
//   const [downloadingPDF, setDownloadingPDF] = useState(false);
//   const [showFloatingDownload, setShowFloatingDownload] = useState(false);

//   const mainContentRef = useRef(null);
//   const faqRef = useRef(null);
//   const footerRef = useRef(null);

//   const canonicalPath = `/batches/${slug || ""}`;
//   const canonicalUrl = `${SITE_URL}${canonicalPath}`;

//   /* ==========================================================
//      LOAD BATCH
//      ========================================================== */
//   useEffect(() => {
//     let mounted = true;

//     const loadBatch = async () => {
//       if (!slug) {
//         if (mounted) {
//           setBatch(null);
//           setError("Batch not found.");
//           setLoading(false);
//         }
//         return;
//       }

//       try {
//         setLoading(true);
//         setError("");

//         const response = await getBatchBySlug(slug);

//         if (!mounted) return;

//         const data = response?.data ?? response;

//         setBatch(data || null);

//         if (!data) {
//           setError("The requested travel batch could not be found.");
//         }
//       } catch (err) {
//         if (!mounted) return;

//         console.error("Failed to load batch:", err);
//         setBatch(null);

//         const status = err?.response?.status;

//         if (status === 404) {
//           setError("This travel batch could not be found.");
//         } else {
//           setError(
//             err?.response?.data?.detail ||
//               err?.message ||
//               "Unable to load this batch right now. Please try again."
//           );
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false);
//         }
//       }
//     };

//     loadBatch();

//     return () => {
//       mounted = false;
//     };
//   }, [slug]);

//   /* ==========================================================
//      CLOSE POLICY WITH ESC
//      ========================================================== */
//   useEffect(() => {
//     if (!activePolicy) return undefined;

//     const handleEscape = (event) => {
//       if (event.key === "Escape") {
//         setActivePolicy(null);
//       }
//     };

//     document.addEventListener("keydown", handleEscape);

//     return () => {
//       document.removeEventListener("keydown", handleEscape);
//     };
//   }, [activePolicy]);

//   /* ==========================================================
//      FLOATING DOWNLOAD VISIBILITY
//      - Mobile/tablet: floating button while main batch content
//        is being viewed.
//      - Desktop: sticky booking card contains the download action.
//      - Hidden while enquiry/review/policy modal is open.
//      - Hidden once review band / FAQ / footer enters the viewport.
//      ========================================================== */
//   useEffect(() => {
//     if (loading || !batch) {
//       setShowFloatingDownload(false);
//       return undefined;
//     }

//     const updateFloatingVisibility = () => {
//       if (
//         showEnquiry ||
//         showReview ||
//         activePolicy ||
//         !mainContentRef.current
//       ) {
//         setShowFloatingDownload(false);
//         return;
//       }

//       const mainRect = mainContentRef.current.getBoundingClientRect();
//       const faqRect = faqRef.current?.getBoundingClientRect();
//       const footerRect = footerRef.current?.getBoundingClientRect();
//       const viewportHeight = window.innerHeight;

//       const mainVisible =
//         mainRect.top < viewportHeight * 0.75 &&
//         mainRect.bottom > viewportHeight * 0.25;

//       const faqVisible =
//         faqRect && faqRect.top < viewportHeight * 0.85;

//       const footerVisible =
//         footerRect && footerRect.top < viewportHeight * 0.85;

//       setShowFloatingDownload(
//         mainVisible && !faqVisible && !footerVisible
//       );
//     };

//     updateFloatingVisibility();

//     window.addEventListener("scroll", updateFloatingVisibility, {
//       passive: true,
//     });
//     window.addEventListener("resize", updateFloatingVisibility);

//     return () => {
//       window.removeEventListener("scroll", updateFloatingVisibility);
//       window.removeEventListener("resize", updateFloatingVisibility);
//     };
//   }, [loading, batch, showEnquiry, showReview, activePolicy]);

//   /* ==========================================================
//      PACKAGE DATA
//      ========================================================== */
//   const packageData = batch?.package || batch?.pkg || null;

//   /* ==========================================================
//      IDENTITY
//      ========================================================== */
//   const title =
//     cleanText(batch?.title) ||
//     cleanText(batch?.package_title) ||
//     cleanText(packageData?.title) ||
//     "Travel Package";

//   const destination =
//     cleanText(batch?.destination) ||
//     cleanText(packageData?.destination) ||
//     "India";

//   const description =
//     cleanText(batch?.description) ||
//     cleanText(packageData?.description) ||
//     "Plan your journey with On a Trip Holiday.";
  
//   /* ==========================================================
//      ENQUIRY PACKAGE
//      Memoized so EnquiryForm's prefill effect doesn't reset the
//      user's selection on every parent re-render.
//      ========================================================== */
//   const enquiryPkg = useMemo(
//     () => ({ ...packageData, title, destination, description }),
//     [packageData, title, destination, description]
//   );


//   /* ==========================================================
//      IMAGES
//      Batch images take priority when available. Otherwise use
//      the parent package images.
//      ========================================================== */
//   const images = useMemo(
//     () =>
//       normalizeImages(
//         Array.isArray(batch?.images) && batch.images.length > 0
//           ? batch.images
//           : packageData?.images
//       ),
//     [batch?.images, packageData?.images]
//   );

//   const heroImage = images[0] || "/images/travel-placeholder.webp";

//   /* ==========================================================
//      FACILITIES
//      ========================================================== */
//   const facilities = useMemo(
//     () =>
//       normalizeList(
//         Array.isArray(batch?.facilities) && batch.facilities.length > 0
//           ? batch.facilities
//           : packageData?.facilities || packageData?.facilities_included
//       ),
//     [
//       batch?.facilities,
//       packageData?.facilities,
//       packageData?.facilities_included,
//     ]
//   );

//   /* ==========================================================
//      INCLUSIONS
//      ========================================================== */
//   const inclusions = useMemo(
//     () =>
//       normalizeList(
//         Array.isArray(batch?.inclusions) && batch.inclusions.length > 0
//           ? batch.inclusions
//           : packageData?.inclusions || packageData?.inclusion
//       ),
//     [
//       batch?.inclusions,
//       packageData?.inclusions,
//       packageData?.inclusion,
//     ]
//   );

//   /* ==========================================================
//      EXCLUSIONS
//      ========================================================== */
//   const exclusions = useMemo(
//     () =>
//       normalizeList(
//         Array.isArray(batch?.exclusions) && batch.exclusions.length > 0
//           ? batch.exclusions
//           : packageData?.exclusions || packageData?.exclusion
//       ),
//     [
//       batch?.exclusions,
//       packageData?.exclusions,
//       packageData?.exclusion,
//     ]
//   );

//   /* ==========================================================
//      ITINERARY
//      Batch itinerary is authoritative for a batch. The PDF
//      generator also follows this same batch-first rule.
//      ========================================================== */
//   const itinerary = useMemo(
//     () => normalizeItinerary(batch?.itinerary),
//     [batch?.itinerary]
//   );

//   /* ==========================================================
//      PRICE
//      ========================================================== */
//   const batchPrice =
//     batch?.price_per_person ?? batch?.price ?? packageData?.price ?? null;

//   const hasPrice =
//     batchPrice !== null && batchPrice !== undefined && batchPrice !== "";

//   /* ==========================================================
//      DURATION
//      ========================================================== */
//   const durationDays =
//     batch?.duration_days ??
//     batch?.days ??
//     packageData?.duration_days ??
//     null;

//   const durationNights =
//     batch?.duration_nights ??
//     batch?.nights ??
//     packageData?.duration_nights ??
//     (durationDays ? Math.max(Number(durationDays) - 1, 0) : null);

//   const durationLabel = durationDays
//     ? `${durationDays} Days${
//         durationNights !== null ? ` / ${durationNights} Nights` : ""
//       }`
//     : "";

//   /* ==========================================================
//      DATES
//      ========================================================== */
//   const startDate =
//     batch?.departure_date ||
//     batch?.start_date ||
//     batch?.startDate ||
//     batch?.departureDate ||
//     null;

//   const endDate =
//     batch?.return_date ||
//     batch?.end_date ||
//     batch?.endDate ||
//     batch?.returnDate ||
//     null;

//   /* ==========================================================
//      BATCH META
//      ========================================================== */
//   const batchStatus = cleanText(batch?.status);
//   const availability = cleanText(batch?.availability);

//   const batchType =
//     cleanText(batch?.type) ||
//     cleanText(batch?.batch_type) ||
//     cleanText(batch?.category);

//   /* ==========================================================
//      TERMS / CANCELLATION
//      Prefer resolved batch data, then package fallback.
//      Accepts either a list or a single text block.
//      ========================================================== */
//   const termsAndConditions = normalizePolicy(
//     batch?.terms_and_conditions ||
//       batch?.terms ||
//       packageData?.terms_and_conditions
//   );

//   const cancellationPolicy = normalizePolicy(
//     batch?.cancellation_policy ||
//       batch?.cancellation ||
//       packageData?.cancellation_policy
//   );

//   /* ==========================================================
//      SEO
//      ========================================================== */
//   const seoTitle = useMemo(() => {
//     if (!batch) {
//       return "Travel Batch Details | On a Trip Holiday";
//     }

//     const datePart = startDate ? ` – ${formatDate(startDate)}` : "";

//     return `${title}${datePart} | On a Trip Holiday`;
//   }, [batch, title, startDate]);

//   const seoDescription = useMemo(
//     () =>
//       createSeoDescription({
//         title,
//         destination,
//         startDate,
//         endDate,
//         description,
//       }),
//     [title, destination, startDate, endDate, description]
//   );

//   /* ==========================================================
//      JSON-LD
//      ========================================================== */
//   const jsonLd = useMemo(() => {
//     if (!batch) {
//       return [
//         {
//           "@context": "https://schema.org",
//           "@type": "WebPage",
//           name: "Travel Batch Details | On a Trip Holiday",
//           url: canonicalUrl,
//         },
//       ];
//     }

//     const tripSchema = {
//       "@context": "https://schema.org",
//       "@type": "TouristTrip",
//       name: title,
//       description: seoDescription,
//       url: canonicalUrl,
//       touristType: "Leisure Travelers",
//       provider: {
//         "@type": "TravelAgency",
//         name: "On a Trip Holiday",
//         url: SITE_URL,
//       },
//       ...(destination && {
//         touristDestination: {
//           "@type": "Place",
//           name: destination,
//         },
//       }),
//       ...(images.length > 0 && {
//         image: images,
//       }),
//       ...(startDate && {
//         departureTime: startDate,
//       }),
//       ...(endDate && {
//         arrivalTime: endDate,
//       }),
//       ...(durationDays && {
//         duration: `P${Number(durationDays)}D`,
//       }),
//       ...(batchPrice !== null &&
//         batchPrice !== undefined &&
//         batchPrice !== "" && {
//           offers: {
//             "@type": "Offer",
//             price: Number(batchPrice) || batchPrice,
//             priceCurrency: "INR",
//             availability: getSchemaAvailability(availability),
//             url: canonicalUrl,
//           },
//         }),
//     };

//     const breadcrumbSchema = {
//       "@context": "https://schema.org",
//       "@type": "BreadcrumbList",
//       itemListElement: [
//         {
//           "@type": "ListItem",
//           position: 1,
//           name: "Home",
//           item: SITE_URL,
//         },
//         {
//           "@type": "ListItem",
//           position: 2,
//           name: "Packages",
//           item: `${SITE_URL}/packages`,
//         },
//         {
//           "@type": "ListItem",
//           position: 3,
//           name: "Travel Batches",
//           item: `${SITE_URL}/batches`,
//         },
//         {
//           "@type": "ListItem",
//           position: 4,
//           name: title,
//           item: canonicalUrl,
//         },
//       ],
//     };

//     return [tripSchema, breadcrumbSchema];
//   }, [
//     batch,
//     title,
//     seoDescription,
//     canonicalUrl,
//     destination,
//     images,
//     startDate,
//     endDate,
//     durationDays,
//     batchPrice,
//     availability,
//   ]);

//   /* ==========================================================
//      PDF DOWNLOAD
//      Direct download from an already available action.
//      ========================================================== */
//   const handleDownloadBatchPDF = async () => {
//     if (!batch || downloadingPDF) {
//       return;
//     }

//     try {
//       setDownloadingPDF(true);

//       await generateBatchPDF({
//         batch,
//         packageData,
//       });
//     } catch (pdfError) {
//       console.error("Batch PDF generation failed:", pdfError);

//       window.alert(
//         "Unable to generate the batch itinerary PDF. Please try again."
//       );
//     } finally {
//       setDownloadingPDF(false);
//     }
//   };

//   /* ==========================================================
//      ENQUIRY SUCCESS -> PDF DOWNLOAD
//      IMPORTANT:
//      EnquiryForm must call onSuccess only after the enquiry
//      API request succeeds.
//      This means:
//        click Download
//        -> enquiry form
//        -> submit enquiry
//        -> successful API response
//        -> onSuccess()
//        -> batch itinerary PDF download
//      ========================================================== */
//   const handleEnquirySuccess = async () => {
//     await handleDownloadBatchPDF();
//   };

//   /* ==========================================================
//      ACTIONS
//      ========================================================== */
//   const openDownloadForm = () => {
//     setShowEnquiry(true);
//     setShowFloatingDownload(false);
//   };

//   const openReview = () => {
//     setShowReview(true);
//     setShowFloatingDownload(false);
//   };

//   /* ==========================================================
//      LOADING
//      ========================================================== */
//   if (loading) {
//     return (
//       <div className="min-h-screen overflow-x-clip bg-white">
//         <Seo
//           title="Travel Batch Details | On a Trip Holiday"
//           description="Explore travel batch dates, itinerary, pricing and booking information with On a Trip Holiday."
//           path={canonicalPath}
//         />

//         <main className="bg-white">
//           <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
//             <div className="animate-pulse space-y-6">
//               <div className="h-4 w-28 rounded bg-navy/10" />
//               <div className="h-[280px] rounded-3xl bg-navy/10 sm:h-[400px] lg:h-[500px]" />
//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 {Array.from({ length: 4 }).map((_, index) => (
//                   <div
//                     key={index}
//                     className="h-28 rounded-2xl bg-navy/10"
//                   />
//                 ))}
//               </div>
//               <div className="h-56 rounded-2xl bg-navy/10" />
//             </div>
//           </div>
//         </main>

//         <Footer />
//       </div>
//     );
//   }

//   /* ==========================================================
//      ERROR
//      ========================================================== */
//   if (!batch) {
//     return (
//       <div className="min-h-screen overflow-x-clip bg-white">
//         <Seo
//           title="Travel Batch Not Found | On a Trip Holiday"
//           description="The requested On a Trip Holiday travel batch could not be found."
//           path={canonicalPath}
//           noindex
//         />

//         <main className="min-h-[65vh] bg-white">
//           <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
//             <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
//               <X className="h-7 w-7 text-accent" aria-hidden="true" />
//             </div>

//             <p className="text-sm font-semibold uppercase tracking-wide text-accent">
//               Travel Batch
//             </p>

//             <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
//               Batch Not Found
//             </h1>

//             <p className="mt-3 max-w-xl text-sm leading-7 text-navy/60 sm:text-base">
//               {error ||
//                 "The travel batch you are looking for may have been removed or is no longer available."}
//             </p>

//             <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
//               <button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/15 px-6 py-3 font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-navy/5"
//               >
//                 <ArrowLeft className="h-4 w-4" aria-hidden="true" />
//                 Go Back
//               </button>

//               <Link
//                 to="/batches"
//                 className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
//               >
//                 Explore More Batches
//               </Link>
//             </div>
//           </div>
//         </main>

//         <FAQSection category="batches" />
//         <Footer />
//       </div>
//     );
//   }

//   /* ==========================================================
//      MAIN PAGE

//      NOTE (sticky aside): the page wrapper uses overflow-x-clip,
//      NOT overflow-x-hidden. overflow-x-hidden turns the wrapper
//      into a scroll container, which silently breaks
//      position: sticky on the aside. overflow-x-clip prevents
//      horizontal overflow without doing that.
//      ========================================================== */
//   return (
//     <div className="min-h-screen overflow-x-clip bg-white">
//       <Seo
//         title={seoTitle}
//         description={seoDescription}
//         path={canonicalPath}
//         image={heroImage || undefined}
//         type="product"
//         jsonLd={jsonLd}
//       />

//       <main className="bg-white">
//         {/* ====================================================
//             BREADCRUMB
//             ==================================================== */}
//         <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
//           <nav
//             aria-label="Breadcrumb"
//             className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy/50 sm:text-sm"
//           >
//             <Link to="/" className="transition-colors hover:text-accent">
//               Home
//             </Link>
//             <span aria-hidden="true">/</span>
//             <Link
//               to="/batches"
//               className="transition-colors hover:text-accent"
//             >
//               Batches
//             </Link>
//             <span aria-hidden="true">/</span>
//             <span className="max-w-[180px] truncate text-navy/75 sm:max-w-[300px]">
//               {title}
//             </span>
//           </nav>
//         </div>

//         {/* ====================================================
//             HERO
//             ==================================================== */}
//         <section className="mx-auto w-full max-w-7xl px-4 pb-7 pt-4 sm:px-6 sm:pb-9 sm:pt-5 lg:px-8">
//           <div className="relative overflow-hidden rounded-3xl bg-navy">
//             <div className="relative h-[300px] sm:h-[400px] md:h-[460px] lg:h-[520px]">
//               <img
//                 src={heroImage}
//                 alt={`${title} travel package in ${destination} - On a Trip Holiday`}
//                 className="h-full w-full object-cover"
//                 loading="eager"
//                 decoding="async"
//                 fetchPriority="high"
//                 onError={(event) => {
//                   event.currentTarget.src =
//                     "/images/travel-placeholder.webp";
//                 }}
//               />

//               <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

//               <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
//                 <div className="flex flex-wrap gap-2">
//                   {batchStatus && (
//                     <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-navy">
//                       {batchStatus === "published"
//                         ? "Open for Booking"
//                         : batchStatus}
//                     </span>
//                   )}

//                   {availability && (
//                     <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold capitalize text-white">
//                       {availability.replaceAll("_", " ")}
//                     </span>
//                   )}
//                 </div>

//                 <h1 className="mt-3 max-w-4xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
//                   {title}
//                 </h1>

//                 <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-white/90 sm:mt-4">
//                   {destination && (
//                     <span className="inline-flex items-center gap-2">
//                       <MapPin
//                         className="h-4 w-4 shrink-0"
//                         aria-hidden="true"
//                       />
//                       <span>{destination}</span>
//                     </span>
//                   )}

//                   {startDate && (
//                     <span className="inline-flex items-center gap-2">
//                       <CalendarDays
//                         className="h-4 w-4 shrink-0"
//                         aria-hidden="true"
//                       />
//                       <span>
//                         {formatDate(startDate)}
//                         {endDate ? ` – ${formatDate(endDate)}` : ""}
//                       </span>
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ====================================================
//             SUMMARY
//             ==================================================== */}
//         <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//             <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
//               <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
//                 <CalendarDays
//                   className="h-5 w-5 text-accent"
//                   aria-hidden="true"
//                 />
//               </div>
//               <p className="text-sm text-navy/50">Travel Dates</p>
//               <p className="mt-1 font-semibold text-navy">
//                 {formatDate(startDate)}
//               </p>
//               {endDate && (
//                 <p className="text-sm text-navy/60">
//                   to {formatDate(endDate)}
//                 </p>
//               )}
//             </div>

//             <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
//               <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
//                 <Clock3
//                   className="h-5 w-5 text-accent"
//                   aria-hidden="true"
//                 />
//               </div>
//               <p className="text-sm text-navy/50">Duration</p>
//               <p className="mt-1 font-semibold text-navy">
//                 {durationLabel || "Duration on request"}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
//               <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
//                 <MapPin
//                   className="h-5 w-5 text-accent"
//                   aria-hidden="true"
//                 />
//               </div>
//               <p className="text-sm text-navy/50">Destination</p>
//               <p className="mt-1 break-words font-semibold text-navy">
//                 {destination}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
//               <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
//                 <Phone
//                   className="h-5 w-5 text-accent"
//                   aria-hidden="true"
//                 />
//               </div>
//               <p className="text-sm text-navy/50">Batch Price</p>
//               <p className="mt-1 text-xl font-bold text-navy sm:text-2xl">
//                 {formatPrice(batchPrice)}
//               </p>
//               {hasPrice && (
//                 <p className="mt-1 text-xs text-navy/50">Per person</p>
//               )}
//             </div>
//           </div>
//         </section>

//         {/* ====================================================
//             MAIN CONTENT
//             items-start on the grid + self-start on the aside keeps
//             the aside at its natural height so sticky can work for
//             the full length of the left column (lg and above).
//             ==================================================== */}
//         <section
//           ref={mainContentRef}
//           className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8"
//         >
//           <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
//             {/* ==================================================
//                 LEFT CONTENT
//                 ================================================== */}
//             <div className="min-w-0 space-y-9 sm:space-y-10">
//               {/* ABOUT */}
//               {description && (
//                 <section>
//                   <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                     About This Trip
//                   </h2>
//                   <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy/65 sm:mt-4 sm:text-base sm:leading-8">
//                     {description}
//                   </p>
//                 </section>
//               )}

//               {/* BATCH INFORMATION */}
//               <section>
//                 <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                   Batch Information
//                 </h2>

//                 <div className="mt-4 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
//                   <div className="grid grid-cols-1 divide-y divide-navy/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
//                     <div className="p-4 sm:p-5">
//                       <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                         Departure
//                       </p>
//                       <p className="mt-1 font-semibold text-navy">
//                         {formatDate(startDate)}
//                       </p>
//                     </div>

//                     <div className="p-4 sm:p-5">
//                       <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                         Return
//                       </p>
//                       <p className="mt-1 font-semibold text-navy">
//                         {formatDate(endDate)}
//                       </p>
//                     </div>

//                     <div className="border-t border-navy/10 p-4 sm:p-5">
//                       <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                         Duration
//                       </p>
//                       <p className="mt-1 font-semibold text-navy">
//                         {durationLabel || "On request"}
//                       </p>
//                     </div>

//                     <div className="border-t border-navy/10 p-4 sm:p-5">
//                       <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                         Batch Price
//                       </p>
//                       <p className="mt-1 font-semibold text-accent">
//                         {formatPrice(batchPrice)}
//                       </p>
//                     </div>

//                     {batchType && (
//                       <div className="border-t border-navy/10 p-4 sm:p-5">
//                         <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                           Batch Type
//                         </p>
//                         <p className="mt-1 font-semibold capitalize text-navy">
//                           {batchType.replaceAll("_", " ")}
//                         </p>
//                       </div>
//                     )}

//                     {batchStatus && (
//                       <div className="border-t border-navy/10 p-4 sm:p-5">
//                         <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                           Status
//                         </p>
//                         <p className="mt-1 font-semibold capitalize text-navy">
//                           {batchStatus.replaceAll("_", " ")}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </section>

//               {/* FACILITIES */}
//               {facilities.length > 0 && (
//                 <section>
//                   <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                     Facilities
//                   </h2>

//                   <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
//                     {facilities.map((facility, index) => (
//                       <div
//                         key={`${facility}-${index}`}
//                         className="flex min-w-0 items-start gap-3 rounded-xl border border-navy/10 bg-surface p-3.5 sm:p-4"
//                       >
//                         <span className="mt-0.5 shrink-0 rounded-full bg-green-100 p-1">
//                           <Check
//                             className="h-3.5 w-3.5 text-green-700"
//                             aria-hidden="true"
//                           />
//                         </span>
//                         <span className="min-w-0 text-sm leading-6 text-navy/70">
//                           {facility}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* ITINERARY */}
//               {itinerary.length > 0 && (
//                 <section>
//                   <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                     Trip Itinerary
//                   </h2>

//                   <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
//                     {itinerary.map((day, index) => (
//                       <article
//                         key={`${day.day}-${index}`}
//                         className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm"
//                       >
//                         <div
//                           className={
//                             day.image
//                               ? "grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]"
//                               : "grid grid-cols-1"
//                           }
//                         >
//                           {day.image && (
//                             <div className="h-52 md:h-full">
//                               <img
//                                 src={day.image}
//                                 alt={`${title} - Day ${day.day}: ${day.title}`}
//                                 className="h-full w-full object-cover"
//                                 loading="lazy"
//                                 decoding="async"
//                                 onError={(event) => {
//                                   event.currentTarget.style.display =
//                                     "none";
//                                 }}
//                               />
//                             </div>
//                           )}

//                           <div className="min-w-0 p-4 sm:p-6">
//                             <div className="flex flex-wrap items-start gap-3">
//                               <span className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white">
//                                 Day {day.day}
//                               </span>
//                               <h3 className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug text-navy sm:text-xl">
//                                 {day.title}
//                               </h3>
//                             </div>

//                             {day.description && (
//                               <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy/65 sm:mt-4 sm:text-base">
//                                 {day.description}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </article>
//                     ))}
//                   </div>
//                 </section>
//               )}

//               {/* INCLUSIONS / EXCLUSIONS */}
//               {(inclusions.length > 0 || exclusions.length > 0) && (
//                 <section>
//                   <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                     Inclusions & Exclusions
//                   </h2>

//                   <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
//                     {inclusions.length > 0 && (
//                       <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5 sm:p-6">
//                         <h3 className="font-semibold text-green-800">
//                           What's Included
//                         </h3>
//                         <ul className="mt-4 space-y-3">
//                           {inclusions.map((item, index) => (
//                             <li
//                               key={`${item}-${index}`}
//                               className="flex gap-3 text-sm leading-6 text-navy/70"
//                             >
//                               <Check
//                                 className="mt-1 h-4 w-4 shrink-0 text-green-600"
//                                 aria-hidden="true"
//                               />
//                               <span className="min-w-0">{item}</span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}

//                     {exclusions.length > 0 && (
//                       <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 sm:p-6">
//                         <h3 className="font-semibold text-red-800">
//                           What's Not Included
//                         </h3>
//                         <ul className="mt-4 space-y-3">
//                           {exclusions.map((item, index) => (
//                             <li
//                               key={`${item}-${index}`}
//                               className="flex gap-3 text-sm leading-6 text-navy/70"
//                             >
//                               <X
//                                 className="mt-1 h-4 w-4 shrink-0 text-red-500"
//                                 aria-hidden="true"
//                               />
//                               <span className="min-w-0">{item}</span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 </section>
//               )}

//               {/* ================================================
//                   IMPORTANT INFORMATION
//                   Terms & Conditions + Cancellation Policy cards,
//                   same pattern as PackageDetail. Each card opens
//                   the policy modal.
//                   ================================================ */}
//               {(termsAndConditions.length > 0 ||
//                 cancellationPolicy.length > 0) && (
//                 <section>
//                   <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
//                     Important Information
//                   </h2>

//                   <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
//                     {termsAndConditions.length > 0 && (
//                       <PolicyCard
//                         type="terms"
//                         onClick={() => setActivePolicy("terms")}
//                       />
//                     )}

//                     {cancellationPolicy.length > 0 && (
//                       <PolicyCard
//                         type="cancellation"
//                         onClick={() => setActivePolicy("cancellation")}
//                       />
//                     )}
//                   </div>
//                 </section>
//               )}
//             </div>

//             {/* ==================================================
//                 BOOKING CARD (ASIDE)
//                 Sticky from lg and above. Height is capped to the
//                 viewport so that, if the content is ever taller than
//                 the screen, the card scrolls internally instead of
//                 getting cut off at the bottom.
//                 ================================================== */}
//             <aside className="w-full lg:sticky lg:top-24 lg:self-start">
//               <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-lg lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
//                 <div className="bg-navy p-5 text-white sm:p-6">
//                   <p className="text-sm text-white/65">Batch Price</p>
//                   <p className="mt-1 text-2xl font-bold sm:text-3xl">
//                     {formatPrice(batchPrice)}
//                   </p>
//                   {hasPrice && (
//                     <p className="mt-1 text-sm text-white/65">
//                       Per person
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-5 p-5 sm:p-6">
//                   <div className="min-w-0">
//                     <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                       Package
//                     </p>
//                     <p className="mt-1 break-words font-semibold leading-6 text-navy">
//                       {title}
//                     </p>
//                   </div>

//                   <div className="min-w-0">
//                     <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                       Destination
//                     </p>
//                     <p className="mt-1 break-words font-semibold leading-6 text-navy">
//                       {destination}
//                     </p>
//                   </div>

//                   <div className="min-w-0">
//                     <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                       Travel Date
//                     </p>
//                     <p className="mt-1 break-words font-semibold leading-6 text-navy">
//                       {formatDate(startDate)}
//                       {endDate ? ` – ${formatDate(endDate)}` : ""}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                       Duration
//                     </p>
//                     <p className="mt-1 font-semibold leading-6 text-navy">
//                       {durationLabel || "On request"}
//                     </p>
//                   </div>

//                   {availability && (
//                     <div>
//                       <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
//                         Availability
//                       </p>
//                       <p className="mt-1 font-semibold capitalize leading-6 text-navy">
//                         {availability.replaceAll("_", " ")}
//                       </p>
//                     </div>
//                   )}

//                   <div className="border-t border-navy/10 pt-5">
//                     <div className="space-y-3">
//                       {/* DOWNLOAD (opens enquiry form first) */}
//                       <button
//                         type="button"
//                         onClick={openDownloadForm}
//                         disabled={downloadingPDF}
//                         className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0B2559] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
//                       >
//                         <Download className="h-4 w-4" aria-hidden="true" />
//                         {downloadingPDF
//                           ? "Preparing..."
//                           : "Download Itinerary"}
//                       </button>

//                       {/* MORE BATCHES */}
//                       <Link
//                         to="/batches"
//                         className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#061B45] px-5 py-3.5 text-sm font-bold text-[#061B45] transition-colors hover:bg-accent hover:text-white sm:text-base"
//                       >
//                         View More Batches
//                         <ChevronRight
//                           className="h-4 w-4 shrink-0"
//                           aria-hidden="true"
//                         />
//                       </Link>

//                       {/* ENQUIRY NOTE */}
//                       <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3 sm:p-4">
//                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
//                           <Download
//                             className="h-5 w-5 text-green-600"
//                             aria-hidden="true"
//                           />
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-sm font-semibold leading-5 text-[#061B45]">
//                             Submit your enquiry & get your itinerary
//                           </p>
//                           <p className="mt-1 text-xs leading-5 text-navy/55">
//                             Our travel team will contact you with the
//                             next steps.
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </aside>
//           </div>
//         </section>

//         {/* ====================================================
//             REVIEW CTA
//             Separate full-width band below the content and above
//             the FAQ, same as PackageDetail.
//             ==================================================== */}
//         <section className="border-y border-gray-100 bg-gray-50">
//           <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
//             <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
//               <div className="min-w-0">
//                 <p className="text-xs font-bold uppercase tracking-wide text-accent sm:text-sm">
//                   Traveller experiences
//                 </p>
//                 <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
//                   Your Valuable Review
//                 </h2>
//                 <p className="mt-2 max-w-2xl text-sm text-navy/60 sm:text-base">
//                   Share your experience with On a Trip Holiday and help
//                   future travellers plan their journey with confidence.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={openReview}
//                 className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover sm:text-base"
//               >
//                 <MessageSquareHeart
//                   className="h-4 w-4"
//                   aria-hidden="true"
//                 />
//                 Your Valuable Review
//               </button>
//             </div>
//           </div>
//         </section>
//       </main>

//       {/* ========================================================
//           FAQ
//           ======================================================== */}
//       <div ref={faqRef}>
//         <FAQSection category="batches" />
//       </div>

//       {/* ========================================================
//           FOOTER
//           ======================================================== */}
//       <div ref={footerRef}>
//         <Footer />
//       </div>

//       {/* ========================================================
//           MOBILE / TABLET FLOATING DOWNLOAD
//           Desktop uses the sticky booking card.
//           ======================================================== */}
//       {showFloatingDownload &&
//         !showEnquiry &&
//         !showReview &&
//         !activePolicy && (
//           <button
//             type="button"
//             onClick={openDownloadForm}
//             disabled={downloadingPDF}
//             className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#061B45] px-4 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-[#0B2559] disabled:cursor-not-allowed disabled:opacity-70 sm:left-5 sm:px-5 sm:py-3.5 lg:hidden"
//             aria-label="Download itinerary"
//           >
//             <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
//             <span>
//               {downloadingPDF ? "Preparing..." : "Download Itinerary"}
//             </span>
//           </button>
//         )}

//       {/* ========================================================
//           ENQUIRY FORM
//           Opened first. PDF generation happens ONLY from
//           onSuccess, after the enquiry API call succeeds.
//           ======================================================== */}
//           {showEnquiry && (
//         <EnquiryForm
//           pkg={enquiryPkg}
//           batch={batch}
//           destination={destination}
//           onClose={() => setShowEnquiry(false)}
//           onSuccess={handleEnquirySuccess}
//           downloadItinerary={false}
//         />
//       )}

//       {/* ========================================================
//           REVIEW MODAL
//           ======================================================== */}
//       <ReviewFormModal
//         open={showReview}
//         pkg={{
//           ...packageData,
//           title,
//           destination,
//         }}
//         onClose={() => setShowReview(false)}
//         onSubmitted={() => setShowReview(false)}
//       />

//       {/* ========================================================
//           TERMS / CANCELLATION MODAL
//           Same interaction pattern as PackageDetail. The content
//           area scrolls independently.
//           ======================================================== */}
//       {activePolicy && (
//         <div
//           className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
//           onClick={() => setActivePolicy(null)}
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="batch-policy-modal-title"
//         >
//           <div
//             className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
//             onClick={(event) => event.stopPropagation()}
//           >
//             {/* HEADER */}
//             <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-7">
//               <div className="flex min-w-0 items-center gap-3">
//                 <div
//                   className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
//                     activePolicy === "terms" ? "bg-blue-50" : "bg-red-50"
//                   }`}
//                 >
//                   {activePolicy === "terms" ? (
//                     <FileText className="h-5 w-5 text-[#061B45]" />
//                   ) : (
//                     <ShieldCheck className="h-5 w-5 text-accent" />
//                   )}
//                 </div>

//                 <div className="min-w-0">
//                   <h2
//                     id="batch-policy-modal-title"
//                     className="text-lg font-bold text-[#061B45] sm:text-xl"
//                   >
//                     {activePolicy === "terms"
//                       ? "Terms & Conditions"
//                       : "Cancellation Policy"}
//                   </h2>
//                   <p className="text-xs text-gray-500 sm:text-sm">
//                     {activePolicy === "terms"
//                       ? "Important booking information"
//                       : "Cancellation and refund information"}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setActivePolicy(null)}
//                 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
//                 aria-label="Close policy"
//               >
//                 <X className="h-5 w-5 text-gray-700" />
//               </button>
//             </div>

//             {/* SCROLLABLE CONTENT */}
//             <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
//               <div className="space-y-4 text-sm leading-7 text-gray-600 sm:text-base">
//                 {(activePolicy === "terms"
//                   ? termsAndConditions
//                   : cancellationPolicy
//                 ).map((item, index) => (
//                   <div key={`${activePolicy}-${index}`} className="flex gap-3">
//                     <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
//                     <p className="min-w-0 whitespace-pre-line break-words">
//                       {item}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* FOOTER */}
//             <div className="flex shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-7">
//               <button
//                 type="button"
//                 onClick={() => setActivePolicy(null)}
//                 className="flex w-full items-center justify-center rounded-xl bg-[#061B45] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0B2559] sm:ml-auto sm:w-auto"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ============================================================
//    POLICY CARD
//    Clickable card that opens the Terms / Cancellation modal.
//    ============================================================ */
// function PolicyCard({ type, onClick }) {
//   const isTerms = type === "terms";

//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`group w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:shadow-md sm:p-6 ${
//         isTerms ? "hover:border-[#061B45]" : "hover:border-accent"
//       }`}
//     >
//       <div className="flex items-center gap-4">
//         <div
//           className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
//             isTerms
//               ? "bg-blue-50 group-hover:bg-[#061B45]"
//               : "bg-red-50 group-hover:bg-accent"
//           }`}
//         >
//           {isTerms ? (
//             <FileText className="h-6 w-6 text-[#061B45] transition-colors group-hover:text-white" />
//           ) : (
//             <ShieldCheck className="h-6 w-6 text-accent transition-colors group-hover:text-white" />
//           )}
//         </div>

//         <div className="min-w-0 flex-1">
//           <h3 className="text-base font-bold text-[#061B45] sm:text-lg">
//             {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
//           </h3>
//           <p className="mt-1 text-sm text-gray-500">
//             {isTerms
//               ? "View booking terms and important information"
//               : "View cancellation and refund information"}
//           </p>
//         </div>

//         <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-accent" />
//       </div>
//     </button>
//   );
// }

