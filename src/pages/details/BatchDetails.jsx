





import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  MapPin,
  MessageSquareHeart,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getBatchBySlug } from "../../api/content";
import EnquiryForm from "../EnquiryForm";
import generateBatchPDF from "../../components/BatchItinerarypdf";
import ReviewFormModal from "../../components/ReviewFormModal";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import FAQSection from "../../components/FAQSection";

/* ============================================================
   HELPERS
   ============================================================ */
const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
  }

  if (typeof image === "object") {
    return (
      image?.url ||
      image?.secure_url ||
      image?.src ||
      image?.image_url ||
      ""
    );
  }

  return "";
};

const cleanText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (item === null || item === undefined) return "";

      if (typeof item === "string") {
        return item.trim();
      }

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

/*
  Terms / cancellation can arrive as an array (batch data) or as a
  single text block (package data, as used on PackageDetail).
  Both shapes are converted into a list of text items.
*/
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
        description:
          cleanText(item?.description) ||
          cleanText(item?.details) ||
          "",
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

  const base = [
    title,
    dateText,
    destination,
    "travel batch by On a Trip Holiday.",
  ]
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

/* ============================================================
   COMPONENT
   ============================================================ */
export default function BatchDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showFloatingDownload, setShowFloatingDownload] = useState(false);

  const mainContentRef = useRef(null);
  const faqRef = useRef(null);
  const footerRef = useRef(null);

  const canonicalPath = `/batches/${slug || ""}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  /* ==========================================================
     LOAD BATCH
     ========================================================== */
  useEffect(() => {
    let mounted = true;

    const loadBatch = async () => {
      if (!slug) {
        if (mounted) {
          setBatch(null);
          setError("Batch not found.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getBatchBySlug(slug);

        if (!mounted) return;

        const data = response?.data ?? response;

        setBatch(data || null);

        if (!data) {
          setError("The requested travel batch could not be found.");
        }
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to load batch:", err);
        setBatch(null);

        const status = err?.response?.status;

        if (status === 404) {
          setError("This travel batch could not be found.");
        } else {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to load this batch right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBatch();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* ==========================================================
     CLOSE POLICY WITH ESC
     ========================================================== */
  useEffect(() => {
    if (!activePolicy) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActivePolicy(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activePolicy]);

  /* ==========================================================
     FLOATING DOWNLOAD VISIBILITY
     - Mobile/tablet: floating button while main batch content
       is being viewed.
     - Desktop: sticky booking card contains the download action.
     - Hidden while enquiry/review/policy modal is open.
     - Hidden once review band / FAQ / footer enters the viewport.
     ========================================================== */
  useEffect(() => {
    if (loading || !batch) {
      setShowFloatingDownload(false);
      return undefined;
    }

    const updateFloatingVisibility = () => {
      if (
        showEnquiry ||
        showReview ||
        activePolicy ||
        !mainContentRef.current
      ) {
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

      const faqVisible =
        faqRect && faqRect.top < viewportHeight * 0.85;

      const footerVisible =
        footerRect && footerRect.top < viewportHeight * 0.85;

      setShowFloatingDownload(
        mainVisible && !faqVisible && !footerVisible
      );
    };

    updateFloatingVisibility();

    window.addEventListener("scroll", updateFloatingVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateFloatingVisibility);

    return () => {
      window.removeEventListener("scroll", updateFloatingVisibility);
      window.removeEventListener("resize", updateFloatingVisibility);
    };
  }, [loading, batch, showEnquiry, showReview, activePolicy]);

  /* ==========================================================
     PACKAGE DATA
     ========================================================== */
  const packageData = batch?.package || batch?.pkg || null;

  /* ==========================================================
     IDENTITY
     ========================================================== */
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
    "Plan your journey with On a Trip Holiday.";
  
  /* ==========================================================
     ENQUIRY PACKAGE
     Memoized so EnquiryForm's prefill effect doesn't reset the
     user's selection on every parent re-render.
     ========================================================== */
  const enquiryPkg = useMemo(
    () => ({ ...packageData, title, destination, description }),
    [packageData, title, destination, description]
  );


  /* ==========================================================
     IMAGES
     Batch images take priority when available. Otherwise use
     the parent package images.
     ========================================================== */
  const images = useMemo(
    () =>
      normalizeImages(
        Array.isArray(batch?.images) && batch.images.length > 0
          ? batch.images
          : packageData?.images
      ),
    [batch?.images, packageData?.images]
  );

  const heroImage = images[0] || "/images/travel-placeholder.webp";

  /* ==========================================================
     FACILITIES
     ========================================================== */
  const facilities = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.facilities) && batch.facilities.length > 0
          ? batch.facilities
          : packageData?.facilities || packageData?.facilities_included
      ),
    [
      batch?.facilities,
      packageData?.facilities,
      packageData?.facilities_included,
    ]
  );

  /* ==========================================================
     INCLUSIONS
     ========================================================== */
  const inclusions = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.inclusions) && batch.inclusions.length > 0
          ? batch.inclusions
          : packageData?.inclusions || packageData?.inclusion
      ),
    [
      batch?.inclusions,
      packageData?.inclusions,
      packageData?.inclusion,
    ]
  );

  /* ==========================================================
     EXCLUSIONS
     ========================================================== */
  const exclusions = useMemo(
    () =>
      normalizeList(
        Array.isArray(batch?.exclusions) && batch.exclusions.length > 0
          ? batch.exclusions
          : packageData?.exclusions || packageData?.exclusion
      ),
    [
      batch?.exclusions,
      packageData?.exclusions,
      packageData?.exclusion,
    ]
  );

  /* ==========================================================
     ITINERARY
     Batch itinerary is authoritative for a batch. The PDF
     generator also follows this same batch-first rule.
     ========================================================== */
  const itinerary = useMemo(
    () => normalizeItinerary(batch?.itinerary),
    [batch?.itinerary]
  );

  /* ==========================================================
     PRICE
     ========================================================== */
  const batchPrice =
    batch?.price_per_person ?? batch?.price ?? packageData?.price ?? null;

  const hasPrice =
    batchPrice !== null && batchPrice !== undefined && batchPrice !== "";

  /* ==========================================================
     DURATION
     ========================================================== */
  const durationDays =
    batch?.duration_days ??
    batch?.days ??
    packageData?.duration_days ??
    null;

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

  /* ==========================================================
     DATES
     ========================================================== */
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

  /* ==========================================================
     BATCH META
     ========================================================== */
  const batchStatus = cleanText(batch?.status);
  const availability = cleanText(batch?.availability);

  const batchType =
    cleanText(batch?.type) ||
    cleanText(batch?.batch_type) ||
    cleanText(batch?.category);

  /* ==========================================================
     TERMS / CANCELLATION
     Prefer resolved batch data, then package fallback.
     Accepts either a list or a single text block.
     ========================================================== */
  const termsAndConditions = normalizePolicy(
    batch?.terms_and_conditions ||
      batch?.terms ||
      packageData?.terms_and_conditions
  );

  const cancellationPolicy = normalizePolicy(
    batch?.cancellation_policy ||
      batch?.cancellation ||
      packageData?.cancellation_policy
  );

  /* ==========================================================
     SEO
     ========================================================== */
  const seoTitle = useMemo(() => {
    if (!batch) {
      return "Travel Batch Details | On a Trip Holiday";
    }

    const datePart = startDate ? ` – ${formatDate(startDate)}` : "";

    return `${title}${datePart} | On a Trip Holiday`;
  }, [batch, title, startDate]);

  const seoDescription = useMemo(
    () =>
      createSeoDescription({
        title,
        destination,
        startDate,
        endDate,
        description,
      }),
    [title, destination, startDate, endDate, description]
  );

  /* ==========================================================
     JSON-LD
     ========================================================== */
  const jsonLd = useMemo(() => {
    if (!batch) {
      return [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Travel Batch Details | On a Trip Holiday",
          url: canonicalUrl,
        },
      ];
    }

    const tripSchema = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: title,
      description: seoDescription,
      url: canonicalUrl,
      touristType: "Leisure Travelers",
      provider: {
        "@type": "TravelAgency",
        name: "On a Trip Holiday",
        url: SITE_URL,
      },
      ...(destination && {
        touristDestination: {
          "@type": "Place",
          name: destination,
        },
      }),
      ...(images.length > 0 && {
        image: images,
      }),
      ...(startDate && {
        departureTime: startDate,
      }),
      ...(endDate && {
        arrivalTime: endDate,
      }),
      ...(durationDays && {
        duration: `P${Number(durationDays)}D`,
      }),
      ...(batchPrice !== null &&
        batchPrice !== undefined &&
        batchPrice !== "" && {
          offers: {
            "@type": "Offer",
            price: Number(batchPrice) || batchPrice,
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
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
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
        {
          "@type": "ListItem",
          position: 4,
          name: title,
          item: canonicalUrl,
        },
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
    availability,
  ]);

  /* ==========================================================
     PDF DOWNLOAD
     Direct download from an already available action.
     ========================================================== */
  const handleDownloadBatchPDF = async () => {
    if (!batch || downloadingPDF) {
      return;
    }

    try {
      setDownloadingPDF(true);

      await generateBatchPDF({
        batch,
        packageData,
      });
    } catch (pdfError) {
      console.error("Batch PDF generation failed:", pdfError);

      window.alert(
        "Unable to generate the batch itinerary PDF. Please try again."
      );
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* ==========================================================
     ENQUIRY SUCCESS -> PDF DOWNLOAD
     IMPORTANT:
     EnquiryForm must call onSuccess only after the enquiry
     API request succeeds.
     This means:
       click Download
       -> enquiry form
       -> submit enquiry
       -> successful API response
       -> onSuccess()
       -> batch itinerary PDF download
     ========================================================== */
  const handleEnquirySuccess = async () => {
    await handleDownloadBatchPDF();
  };

  /* ==========================================================
     ACTIONS
     ========================================================== */
  const openDownloadForm = () => {
    setShowEnquiry(true);
    setShowFloatingDownload(false);
  };

  const openReview = () => {
    setShowReview(true);
    setShowFloatingDownload(false);
  };

  /* ==========================================================
     LOADING
     ========================================================== */
  if (loading) {
    return (
      <div className="min-h-screen overflow-x-clip bg-white">
        <Seo
          title="Travel Batch Details | On a Trip Holiday"
          description="Explore travel batch dates, itinerary, pricing and booking information with On a Trip Holiday."
          path={canonicalPath}
        />

        <main className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="animate-pulse space-y-6">
              <div className="h-4 w-28 rounded bg-navy/10" />
              <div className="h-[280px] rounded-3xl bg-navy/10 sm:h-[400px] lg:h-[500px]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 rounded-2xl bg-navy/10"
                  />
                ))}
              </div>
              <div className="h-56 rounded-2xl bg-navy/10" />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     ERROR
     ========================================================== */
  if (!batch) {
    return (
      <div className="min-h-screen overflow-x-clip bg-white">
        <Seo
          title="Travel Batch Not Found | On a Trip Holiday"
          description="The requested On a Trip Holiday travel batch could not be found."
          path={canonicalPath}
          noindex
        />

        <main className="min-h-[65vh] bg-white">
          <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
              <X className="h-7 w-7 text-accent" aria-hidden="true" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Travel Batch
            </p>

            <h1 className="mt-2 font-display text-3xl font-semibold text-navy sm:text-4xl">
              Batch Not Found
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-navy/60 sm:text-base">
              {error ||
                "The travel batch you are looking for may have been removed or is no longer available."}
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-navy/15 px-6 py-3 font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-navy/5"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Go Back
              </button>

              <Link
                to="/batches"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Explore More Batches
              </Link>
            </div>
          </div>
        </main>

        <FAQSection category="batches" />
        <Footer />
      </div>
    );
  }

  /* ==========================================================
     MAIN PAGE

     NOTE (sticky aside): the page wrapper uses overflow-x-clip,
     NOT overflow-x-hidden. overflow-x-hidden turns the wrapper
     into a scroll container, which silently breaks
     position: sticky on the aside. overflow-x-clip prevents
     horizontal overflow without doing that.
     ========================================================== */
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        image={heroImage || undefined}
        type="product"
        jsonLd={jsonLd}
      />

      <main className="bg-white">
        {/* ====================================================
            BREADCRUMB
            ==================================================== */}
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy/50 sm:text-sm"
          >
            <Link to="/" className="transition-colors hover:text-accent">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to="/batches"
              className="transition-colors hover:text-accent"
            >
              Batches
            </Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-[180px] truncate text-navy/75 sm:max-w-[300px]">
              {title}
            </span>
          </nav>
        </div>

        {/* ====================================================
            HERO
            ==================================================== */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-7 pt-4 sm:px-6 sm:pb-9 sm:pt-5 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-navy">
            <div className="relative h-[300px] sm:h-[400px] md:h-[460px] lg:h-[520px]">
              <img
                src={heroImage}
                alt={`${title} travel package in ${destination} - On a Trip Holiday`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(event) => {
                  event.currentTarget.src =
                    "/images/travel-placeholder.webp";
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
                <div className="flex flex-wrap gap-2">
                  {batchStatus && (
                    <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-navy">
                      {batchStatus === "published"
                        ? "Open for Booking"
                        : batchStatus}
                    </span>
                  )}

                  {availability && (
                    <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold capitalize text-white">
                      {availability.replaceAll("_", " ")}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 max-w-4xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-white/90 sm:mt-4">
                  {destination && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{destination}</span>
                    </span>
                  )}

                  {startDate && (
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {formatDate(startDate)}
                        {endDate ? ` – ${formatDate(endDate)}` : ""}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SUMMARY
            ==================================================== */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
                <CalendarDays
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-navy/50">Travel Dates</p>
              <p className="mt-1 font-semibold text-navy">
                {formatDate(startDate)}
              </p>
              {endDate && (
                <p className="text-sm text-navy/60">
                  to {formatDate(endDate)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
                <Clock3
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-navy/50">Duration</p>
              <p className="mt-1 font-semibold text-navy">
                {durationLabel || "Duration on request"}
              </p>
            </div>

            <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
                <MapPin
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-navy/50">Destination</p>
              <p className="mt-1 break-words font-semibold text-navy">
                {destination}
              </p>
            </div>

            <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 inline-flex rounded-xl bg-surface-orange p-2.5">
                <Phone
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-navy/50">Batch Price</p>
              <p className="mt-1 text-xl font-bold text-navy sm:text-2xl">
                {formatPrice(batchPrice)}
              </p>
              {hasPrice && (
                <p className="mt-1 text-xs text-navy/50">Per person</p>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            MAIN CONTENT
            items-start on the grid + self-start on the aside keeps
            the aside at its natural height so sticky can work for
            the full length of the left column (lg and above).
            ==================================================== */}
        <section
          ref={mainContentRef}
          className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
            {/* ==================================================
                LEFT CONTENT
                ================================================== */}
            <div className="min-w-0 space-y-9 sm:space-y-10">
              {/* ABOUT */}
              {description && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    About This Trip
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy/65 sm:mt-4 sm:text-base sm:leading-8">
                    {description}
                  </p>
                </section>
              )}

              {/* BATCH INFORMATION */}
              <section>
                <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                  Batch Information
                </h2>

                <div className="mt-4 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
                  <div className="grid grid-cols-1 divide-y divide-navy/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                        Departure
                      </p>
                      <p className="mt-1 font-semibold text-navy">
                        {formatDate(startDate)}
                      </p>
                    </div>

                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                        Return
                      </p>
                      <p className="mt-1 font-semibold text-navy">
                        {formatDate(endDate)}
                      </p>
                    </div>

                    <div className="border-t border-navy/10 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                        Duration
                      </p>
                      <p className="mt-1 font-semibold text-navy">
                        {durationLabel || "On request"}
                      </p>
                    </div>

                    <div className="border-t border-navy/10 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                        Batch Price
                      </p>
                      <p className="mt-1 font-semibold text-accent">
                        {formatPrice(batchPrice)}
                      </p>
                    </div>

                    {batchType && (
                      <div className="border-t border-navy/10 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                          Batch Type
                        </p>
                        <p className="mt-1 font-semibold capitalize text-navy">
                          {batchType.replaceAll("_", " ")}
                        </p>
                      </div>
                    )}

                    {batchStatus && (
                      <div className="border-t border-navy/10 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                          Status
                        </p>
                        <p className="mt-1 font-semibold capitalize text-navy">
                          {batchStatus.replaceAll("_", " ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* FACILITIES */}
              {facilities.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    Facilities
                  </h2>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
                    {facilities.map((facility, index) => (
                      <div
                        key={`${facility}-${index}`}
                        className="flex min-w-0 items-start gap-3 rounded-xl border border-navy/10 bg-surface p-3.5 sm:p-4"
                      >
                        <span className="mt-0.5 shrink-0 rounded-full bg-green-100 p-1">
                          <Check
                            className="h-3.5 w-3.5 text-green-700"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 text-sm leading-6 text-navy/70">
                          {facility}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ITINERARY */}
              {itinerary.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    Trip Itinerary
                  </h2>

                  <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
                    {itinerary.map((day, index) => (
                      <article
                        key={`${day.day}-${index}`}
                        className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm"
                      >
                        <div
                          className={
                            day.image
                              ? "grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]"
                              : "grid grid-cols-1"
                          }
                        >
                          {day.image && (
                            <div className="h-52 md:h-full">
                              <img
                                src={day.image}
                                alt={`${title} - Day ${day.day}: ${day.title}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            </div>
                          )}

                          <div className="min-w-0 p-4 sm:p-6">
                            <div className="flex flex-wrap items-start gap-3">
                              <span className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white">
                                Day {day.day}
                              </span>
                              <h3 className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug text-navy sm:text-xl">
                                {day.title}
                              </h3>
                            </div>

                            {day.description && (
                              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy/65 sm:mt-4 sm:text-base">
                                {day.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* INCLUSIONS / EXCLUSIONS */}
              {(inclusions.length > 0 || exclusions.length > 0) && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    Inclusions & Exclusions
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {inclusions.length > 0 && (
                      <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5 sm:p-6">
                        <h3 className="font-semibold text-green-800">
                          What's Included
                        </h3>
                        <ul className="mt-4 space-y-3">
                          {inclusions.map((item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="flex gap-3 text-sm leading-6 text-navy/70"
                            >
                              <Check
                                className="mt-1 h-4 w-4 shrink-0 text-green-600"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {exclusions.length > 0 && (
                      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 sm:p-6">
                        <h3 className="font-semibold text-red-800">
                          What's Not Included
                        </h3>
                        <ul className="mt-4 space-y-3">
                          {exclusions.map((item, index) => (
                            <li
                              key={`${item}-${index}`}
                              className="flex gap-3 text-sm leading-6 text-navy/70"
                            >
                              <X
                                className="mt-1 h-4 w-4 shrink-0 text-red-500"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ================================================
                  IMPORTANT INFORMATION
                  Terms & Conditions + Cancellation Policy cards,
                  same pattern as PackageDetail. Each card opens
                  the policy modal.
                  ================================================ */}
              {(termsAndConditions.length > 0 ||
                cancellationPolicy.length > 0) && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    Important Information
                  </h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  </div>
                </section>
              )}
            </div>

            {/* ==================================================
                BOOKING CARD (ASIDE)
                Sticky from lg and above. Height is capped to the
                viewport so that, if the content is ever taller than
                the screen, the card scrolls internally instead of
                getting cut off at the bottom.
                ================================================== */}
            <aside className="w-full lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-lg lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                <div className="bg-navy p-5 text-white sm:p-6">
                  <p className="text-sm text-white/65">Batch Price</p>
                  <p className="mt-1 text-2xl font-bold sm:text-3xl">
                    {formatPrice(batchPrice)}
                  </p>
                  {hasPrice && (
                    <p className="mt-1 text-sm text-white/65">
                      Per person
                    </p>
                  )}
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                      Package
                    </p>
                    <p className="mt-1 break-words font-semibold leading-6 text-navy">
                      {title}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                      Destination
                    </p>
                    <p className="mt-1 break-words font-semibold leading-6 text-navy">
                      {destination}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                      Travel Date
                    </p>
                    <p className="mt-1 break-words font-semibold leading-6 text-navy">
                      {formatDate(startDate)}
                      {endDate ? ` – ${formatDate(endDate)}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                      Duration
                    </p>
                    <p className="mt-1 font-semibold leading-6 text-navy">
                      {durationLabel || "On request"}
                    </p>
                  </div>

                  {availability && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                        Availability
                      </p>
                      <p className="mt-1 font-semibold capitalize leading-6 text-navy">
                        {availability.replaceAll("_", " ")}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-navy/10 pt-5">
                    <div className="space-y-3">
                      {/* DOWNLOAD (opens enquiry form first) */}
                      <button
                        type="button"
                        onClick={openDownloadForm}
                        disabled={downloadingPDF}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0B2559] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {downloadingPDF
                          ? "Preparing..."
                          : "Download Itinerary"}
                      </button>

                      {/* MORE BATCHES */}
                      <Link
                        to="/batches"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#061B45] px-5 py-3.5 text-sm font-bold text-[#061B45] transition-colors hover:bg-accent hover:text-white sm:text-base"
                      >
                        View More Batches
                        <ChevronRight
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      </Link>

                      {/* ENQUIRY NOTE */}
                      <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3 sm:p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                          <Download
                            className="h-5 w-5 text-green-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5 text-[#061B45]">
                            Submit your enquiry & get your itinerary
                          </p>
                          <p className="mt-1 text-xs leading-5 text-navy/55">
                            Our travel team will contact you with the
                            next steps.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ====================================================
            REVIEW CTA
            Separate full-width band below the content and above
            the FAQ, same as PackageDetail.
            ==================================================== */}
        <section className="border-y border-gray-100 bg-gray-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-accent sm:text-sm">
                  Traveller experiences
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
                  Your Valuable Review
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-navy/60 sm:text-base">
                  Share your experience with On a Trip Holiday and help
                  future travellers plan their journey with confidence.
                </p>
              </div>

              <button
                type="button"
                onClick={openReview}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover sm:text-base"
              >
                <MessageSquareHeart
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Your Valuable Review
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================
          FAQ
          ======================================================== */}
      <div ref={faqRef}>
        <FAQSection category="batches" />
      </div>

      {/* ========================================================
          FOOTER
          ======================================================== */}
      <div ref={footerRef}>
        <Footer />
      </div>

      {/* ========================================================
          MOBILE / TABLET FLOATING DOWNLOAD
          Desktop uses the sticky booking card.
          ======================================================== */}
      {showFloatingDownload &&
        !showEnquiry &&
        !showReview &&
        !activePolicy && (
          <button
            type="button"
            onClick={openDownloadForm}
            disabled={downloadingPDF}
            className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#061B45] px-4 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-[#0B2559] disabled:cursor-not-allowed disabled:opacity-70 sm:left-5 sm:px-5 sm:py-3.5 lg:hidden"
            aria-label="Download itinerary"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {downloadingPDF ? "Preparing..." : "Download Itinerary"}
            </span>
          </button>
        )}

      {/* ========================================================
          ENQUIRY FORM
          Opened first. PDF generation happens ONLY from
          onSuccess, after the enquiry API call succeeds.
          ======================================================== */}
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

      {/* ========================================================
          REVIEW MODAL
          ======================================================== */}
      <ReviewFormModal
        open={showReview}
        pkg={{
          ...packageData,
          title,
          destination,
        }}
        onClose={() => setShowReview(false)}
        onSubmitted={() => setShowReview(false)}
      />

      {/* ========================================================
          TERMS / CANCELLATION MODAL
          Same interaction pattern as PackageDetail. The content
          area scrolls independently.
          ======================================================== */}
      {activePolicy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setActivePolicy(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-policy-modal-title"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    activePolicy === "terms" ? "bg-blue-50" : "bg-red-50"
                  }`}
                >
                  {activePolicy === "terms" ? (
                    <FileText className="h-5 w-5 text-[#061B45]" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-accent" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    id="batch-policy-modal-title"
                    className="text-lg font-bold text-[#061B45] sm:text-xl"
                  >
                    {activePolicy === "terms"
                      ? "Terms & Conditions"
                      : "Cancellation Policy"}
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {activePolicy === "terms"
                      ? "Important booking information"
                      : "Cancellation and refund information"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200"
                aria-label="Close policy"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <div className="space-y-4 text-sm leading-7 text-gray-600 sm:text-base">
                {(activePolicy === "terms"
                  ? termsAndConditions
                  : cancellationPolicy
                ).map((item, index) => (
                  <div key={`${activePolicy}-${index}`} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <p className="min-w-0 whitespace-pre-line break-words">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="flex w-full items-center justify-center rounded-xl bg-[#061B45] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0B2559] sm:ml-auto sm:w-auto"
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

/* ============================================================
   POLICY CARD
   Clickable card that opens the Terms / Cancellation modal.
   ============================================================ */
function PolicyCard({ type, onClick }) {
  const isTerms = type === "terms";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:shadow-md sm:p-6 ${
        isTerms ? "hover:border-[#061B45]" : "hover:border-accent"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isTerms
              ? "bg-blue-50 group-hover:bg-[#061B45]"
              : "bg-red-50 group-hover:bg-accent"
          }`}
        >
          {isTerms ? (
            <FileText className="h-6 w-6 text-[#061B45] transition-colors group-hover:text-white" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-accent transition-colors group-hover:text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#061B45] sm:text-lg">
            {isTerms ? "Terms & Conditions" : "Cancellation Policy"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isTerms
              ? "View booking terms and important information"
              : "View cancellation and refund information"}
          </p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-accent" />
      </div>
    </button>
  );
}

