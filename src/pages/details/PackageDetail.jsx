import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquareHeart,
  ShieldCheck,
  X,
} from "lucide-react";

import { getPackageBySlug } from "../../api/content";
import Footer from "../../components/Footer";
import Seo from "../../components/Seo";
import FAQSection from "../../components/FAQSection";
import EnquiryForm from "../EnquiryForm";
import ReviewFormModal from "../../components/ReviewFormModal";
import generatePackagePDF from "../../components/PackageItineraryPDF";

const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  "https://onatripholidays.com";

/* =========================================================
   PACKAGE TYPE LABELS
========================================================= */

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

/* =========================================================
   IMAGE HELPER
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.src ||
      image.image_url ||
      ""
    );
  }

  return "";
};

/* =========================================================
   TEXT HELPER
========================================================= */

const getTextValue = (item) => {
  if (!item) return "";

  if (typeof item === "string") {
    return item;
  }

  if (typeof item === "object") {
    return (
      item.name ||
      item.title ||
      item.description ||
      item.text ||
      item.value ||
      ""
    );
  }

  return "";
};

/* =========================================================
   LIST HELPER
========================================================= */

const getListItems = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        const text = getTextValue(item);

        if (typeof text !== "string") {
          return [];
        }

        return text
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

/* =========================================================
   DURATION
========================================================= */

const formatDuration = (days) => {
  const numericDays = Number(days);

  if (!numericDays || Number.isNaN(numericDays)) {
    return "";
  }

  return `${numericDays} ${
    numericDays === 1 ? "Day" : "Days"
  }`;
};

/* =========================================================
   PRICE
========================================================= */

const formatPrice = (price) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
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

/* =========================================================
   COMPONENT
========================================================= */

const PackageDetail = () => {
  const { slug } = useParams();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [activePolicy, setActivePolicy] = useState(null);

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  /* =========================================================
     RESPONSIVE FLOATING DOWNLOAD
  ========================================================= */

  const packageAreaRef = useRef(null);
  const faqSectionRef = useRef(null);

  const [showFloatingDownload, setShowFloatingDownload] =
    useState(false);

  /* =========================================================
     FETCH PACKAGE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchPackage = async () => {
      if (!slug) {
        setPkg(null);
        setError("Package not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getPackageBySlug(slug);

        if (!mounted) return;

        const data = response?.data || response;

        if (!data) {
          setPkg(null);
          setError("Package not found.");
          return;
        }

        setPkg(data);
      } catch (err) {
        console.error(
          "Failed to fetch package:",
          err
        );

        if (!mounted) return;

        setPkg(null);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load this package."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPackage();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* =========================================================
     FLOATING DOWNLOAD VISIBILITY
  ========================================================= */

  useEffect(() => {
    if (loading || !pkg) {
      setShowFloatingDownload(false);
      return undefined;
    }

    const packageElement = packageAreaRef.current;
    const faqElement = faqSectionRef.current;

    if (!packageElement) {
      return undefined;
    }

    let packageVisible = false;
    let faqVisible = false;

    const updateVisibility = () => {
      setShowFloatingDownload(
        packageVisible &&
          !faqVisible &&
          !showEnquiry &&
          !showReview
      );
    };

    const packageObserver = new IntersectionObserver(
      ([entry]) => {
        packageVisible = entry.isIntersecting;
        updateVisibility();
      },
      {
        threshold: 0.08,
        rootMargin: "-10% 0px -15% 0px",
      }
    );

    const faqObserver = faqElement
      ? new IntersectionObserver(
          ([entry]) => {
            faqVisible = entry.isIntersecting;
            updateVisibility();
          },
          {
            threshold: 0.05,
            rootMargin: "0px 0px -10% 0px",
          }
        )
      : null;

    packageObserver.observe(packageElement);

    if (faqObserver && faqElement) {
      faqObserver.observe(faqElement);
    }

    return () => {
      packageObserver.disconnect();

      if (faqObserver) {
        faqObserver.disconnect();
      }
    };
  }, [
    loading,
    pkg,
    showEnquiry,
    showReview,
  ]);

  /* =========================================================
     CLOSE POLICY WITH ESC
  ========================================================= */

  useEffect(() => {
    if (!activePolicy) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActivePolicy(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [activePolicy]);

  /* =========================================================
     PACKAGE IMAGES
  ========================================================= */

  const packageImages = useMemo(() => {
    if (!pkg?.images) {
      return [];
    }

    if (Array.isArray(pkg.images)) {
      return pkg.images
        .map(getImageUrl)
        .filter(Boolean);
    }

    const image = getImageUrl(pkg.images);

    return image ? [image] : [];
  }, [pkg]);

  /* =========================================================
     ITINERARY
  ========================================================= */

  const itinerary = useMemo(() => {
    if (!Array.isArray(pkg?.itinerary)) {
      return [];
    }

    return [...pkg.itinerary]
      .sort(
        (a, b) =>
          Number(a?.day || 0) -
          Number(b?.day || 0)
      )
      .map((item, index) => ({
        ...item,
        day: item?.day || index + 1,
        title: item?.title || "",
        description: item?.description || "",
        image: getImageUrl(item?.image),
      }));
  }, [pkg]);

  /* =========================================================
     CONTENT
  ========================================================= */

  const facilities = useMemo(
    () => getListItems(pkg?.facilities),
    [pkg]
  );

  const inclusions = useMemo(
    () => getListItems(pkg?.inclusions),
    [pkg]
  );

  const exclusions = useMemo(
    () => getListItems(pkg?.exclusions),
    [pkg]
  );

  /* =========================================================
     PRICE / DURATION / TYPE
  ========================================================= */

  const formattedPrice = useMemo(
    () => formatPrice(pkg?.price),
    [pkg]
  );

  const formattedDuration = useMemo(
    () => formatDuration(pkg?.duration_days),
    [pkg]
  );

  const packageTypeLabel = useMemo(() => {
    if (!pkg?.package_type) {
      return "";
    }

    return (
      PACKAGE_TYPE_LABELS[pkg.package_type] ||
      String(pkg.package_type)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  }, [pkg]);

  /* =========================================================
     SEO
  ========================================================= */

  const seoDescription = useMemo(() => {
    if (!pkg) {
      return "Explore holiday packages with On a Trip Holidays.";
    }

    return (
      pkg.description ||
      `Explore ${
        pkg.title || "this holiday package"
      } with On a Trip Holidays.`
    );
  }, [pkg]);

  const canonicalUrl =
    `${SITE_URL}/packages/${slug}`;

  const jsonLd = useMemo(() => {
    if (!pkg) {
      return null;
    }

    const image =
      packageImages.length > 0
        ? packageImages[0]
        : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: pkg.title,
      description: seoDescription,
      url: canonicalUrl,

      ...(image
        ? {
            image: [image],
          }
        : {}),

      touristType: [
        "Leisure travelers",
        "Families",
        "Couples",
        "Adventure travelers",
      ],

      ...(pkg.price !== null &&
      pkg.price !== undefined &&
      pkg.price !== ""
        ? {
            offers: {
              "@type": "Offer",
              price: Number(pkg.price),
              priceCurrency: "INR",
              availability:
                "https://schema.org/InStock",
              url: canonicalUrl,
            },
          }
        : {}),
    };
  }, [
    pkg,
    packageImages,
    seoDescription,
    canonicalUrl,
  ]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const openDownloadForm = () => {
    setShowEnquiry(true);
    setShowFloatingDownload(false);
  };

  const openReview = () => {
    setShowReview(true);
    setShowFloatingDownload(false);
  };

  const closeReview = () => {
    setShowReview(false);
  };

  /* =========================================================
     PDF DOWNLOAD
  ========================================================= */

  const handleDownloadPackagePDF = async () => {
    if (!pkg || downloadingPDF) {
      return;
    }

    try {
      setDownloadingPDF(true);

      await generatePackagePDF(pkg);
    } catch (pdfError) {
      console.error(
        "Package PDF generation failed:",
        pdfError
      );

      window.alert(
        "Unable to generate the itinerary PDF. Please try again."
      );
    } finally {
      setDownloadingPDF(false);
    }
  };

  /* =========================================================
     ENQUIRY SUCCESS -> PDF DOWNLOAD

     EnquiryForm calls onSuccess only after the enquiry API
     request succeeds:

       click Download Itinerary
       -> enquiry form
       -> submit enquiry
       -> successful API response
       -> onSuccess()
       -> package itinerary PDF download
  ========================================================= */

  const handleEnquirySuccess = async () => {
    await handleDownloadPackagePDF();
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#061B45] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600 text-sm sm:text-base">
            Loading package details...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#061B45] mb-3">
            Package Not Found
          </h1>

          <p className="text-gray-600 mb-8">
            {error ||
              "The package you are looking for does not exist."}
          </p>

          <Link
            to="/packages"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#061B45] text-white font-semibold hover:bg-[#0B2559] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>
      <Seo
        title={`${pkg.title} | On a Trip Holidays`}
        description={seoDescription}
        canonical={canonicalUrl}
        image={packageImages[0]}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-white overflow-x-clip">
        {/* =====================================================
            BREADCRUMB
        ====================================================== */}

        <section className="border-b border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Link
                to="/"
                className="hover:text-[#061B45] transition"
              >
                Home
              </Link>

              <ChevronRight className="w-4 h-4 shrink-0" />

              <Link
                to="/packages"
                className="hover:text-[#061B45] transition"
              >
                Packages
              </Link>

              <ChevronRight className="w-4 h-4 shrink-0" />

              <span className="text-gray-800 font-medium truncate max-w-[220px] sm:max-w-none">
                {pkg.title}
              </span>
            </nav>
          </div>
        </section>

        {/* =====================================================
            PACKAGE CONTENT AREA
        ====================================================== */}

        <main
          ref={packageAreaRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* BACK */}

          <div className="pt-6 sm:pt-8">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#061B45] hover:text-[#FF3B0B] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Packages
            </Link>
          </div>

          {/* =================================================
              TITLE
          ================================================== */}

          <section className="pt-5 sm:pt-7 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {pkg.destination && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-[#FF3B0B]" />
                  <span>{pkg.destination}</span>
                </div>
              )}

              {packageTypeLabel && (
                <>
                  <span className="text-gray-300">
                    •
                  </span>

                  <span className="inline-flex items-center rounded-full bg-[#061B45]/5 text-[#061B45] px-3 py-1.5 text-xs sm:text-sm font-semibold">
                    {packageTypeLabel}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#061B45] leading-tight">
              {pkg.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm sm:text-base text-gray-600">
              {formattedDuration && (
                <div className="inline-flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF3B0B]" />

                  <span>
                    {formattedDuration}

                    {pkg?.duration_nights !==
                      undefined &&
                      ` / ${pkg.duration_nights} ${
                        Number(
                          pkg.duration_nights
                        ) === 1
                          ? "night"
                          : "nights"
                      }`}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              COVER IMAGE
          ================================================== */}

          <section className="pb-8 sm:pb-10">
            {packageImages.length > 0 ? (
              <div className="w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.4/1] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100">
                <img
                  src={packageImages[0]}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.4/1] rounded-2xl sm:rounded-3xl bg-gray-100 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </section>

          {/* =================================================
              DESCRIPTION
          ================================================== */}

          {pkg.description && (
            <section className="pb-10 sm:pb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#061B45] mb-4">
                About This Package
              </h2>

              <p className="text-gray-600 leading-7 sm:leading-8 text-sm sm:text-base whitespace-pre-line">
                {pkg.description}
              </p>
            </section>
          )}

          {/* =================================================
              TWO COLUMN CONTENT
          ================================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 xl:gap-14 items-start pb-16 sm:pb-20">
            {/* =================================================
                LEFT
            ================================================== */}

            <div className="min-w-0">
              {/* PACKAGE INFORMATION */}

              <section className="mb-10 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#061B45] mb-5">
                  Package Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formattedDuration && (
                    <InfoCard
                      icon={
                        <CalendarDays className="w-5 h-5 text-[#FF3B0B]" />
                      }
                      label="Duration"
                      value={
                        <>
                          {formattedDuration}

                          {pkg?.duration_nights !==
                            undefined &&
                            ` / ${pkg.duration_nights} ${
                              Number(
                                pkg.duration_nights
                              ) === 1
                                ? "night"
                                : "nights"
                            }`}
                        </>
                      }
                    />
                  )}

                  {pkg.destination && (
                    <InfoCard
                      icon={
                        <MapPin className="w-5 h-5 text-[#FF3B0B]" />
                      }
                      label="Destination"
                      value={pkg.destination}
                    />
                  )}

                  {packageTypeLabel && (
                    <InfoCard
                      icon={
                        <MapPin className="w-5 h-5 text-[#061B45]" />
                      }
                      label="Package Type"
                      value={packageTypeLabel}
                    />
                  )}

                  <InfoCard
                    icon={
                      <Clock className="w-5 h-5 text-[#FF3B0B]" />
                    }
                    label="Starting From"
                    value={formattedPrice}
                  />
                </div>
              </section>

              {/* =================================================
                  ITINERARY
              ================================================== */}

              {itinerary.length > 0 && (
                <section className="mb-10 sm:mb-12">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#061B45]">
                      Itinerary
                    </h2>

                    <span className="text-sm text-gray-500">
                      {itinerary.length}{" "}
                      {itinerary.length === 1
                        ? "Day"
                        : "Days"}
                    </span>
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    {itinerary.map(
                      (item, index) => (
                        <article
                          key={`${item.day}-${index}`}
                          className="border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm"
                        >
                          <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                            <span className="inline-flex items-center rounded-full bg-[#061B45] text-white px-3 py-1.5 text-xs sm:text-sm font-bold">
                              Day {item.day}
                            </span>
                          </div>

                          {item.title && (
                            <div className="px-5 sm:px-6 pt-3">
                              <h3 className="text-xl sm:text-2xl font-bold text-[#061B45]">
                                {item.title}
                              </h3>
                            </div>
                          )}

                          {item.image && (
                            <div className="mt-5 aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-gray-100">
                              <img
                                src={item.image}
                                alt={`${pkg.title} - Day ${item.day}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}

                          {item.description && (
                            <div className="p-5 sm:p-6">
                              <p className="text-gray-600 leading-7 text-sm sm:text-base whitespace-pre-line">
                                {item.description}
                              </p>
                            </div>
                          )}
                        </article>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  FACILITIES
              ================================================== */}

              {facilities.length > 0 && (
                <section className="mb-10 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#061B45] mb-5">
                    Facilities
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {facilities.map(
                      (facility, index) => (
                        <div
                          key={`${facility}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-gray-200 p-4"
                        >
                          <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>

                          <span className="text-gray-700 text-sm sm:text-base">
                            {facility}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  INCLUSIONS / EXCLUSIONS
              ================================================== */}

              {(inclusions.length > 0 ||
                exclusions.length > 0) && (
                <section className="mb-10 sm:mb-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inclusions.length > 0 && (
                      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 sm:p-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#061B45] mb-5">
                          Inclusions
                        </h2>

                        <ul className="space-y-3">
                          {inclusions.map(
                            (item, index) => (
                              <li
                                key={`${item}-${index}`}
                                className="flex items-start gap-3 text-sm sm:text-base text-gray-700"
                              >
                                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />

                                <span>
                                  {item}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {exclusions.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#061B45] mb-5">
                          Exclusions
                        </h2>

                        <ul className="space-y-3">
                          {exclusions.map(
                            (item, index) => (
                              <li
                                key={`${item}-${index}`}
                                className="flex items-start gap-3 text-sm sm:text-base text-gray-700"
                              >
                                <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

                                <span>
                                  {item}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  TERMS & CANCELLATION BOXES
              ================================================== */}

              {(pkg.terms_and_conditions ||
                pkg.cancellation_policy) && (
                <section className="mb-10 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#061B45] mb-5">
                    Important Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pkg.terms_and_conditions && (
                      <PolicyCard
                        type="terms"
                        onClick={() =>
                          setActivePolicy("terms")
                        }
                      />
                    )}

                    {pkg.cancellation_policy && (
                      <PolicyCard
                        type="cancellation"
                        onClick={() =>
                          setActivePolicy(
                            "cancellation"
                          )
                        }
                      />
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* =================================================
                RIGHT SIDEBAR
            ================================================== */}

            <aside className="w-full lg:sticky lg:top-24 self-start">
              <div className="border border-gray-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 shadow-lg bg-white">
                {/* PRICE */}

                <div className="pb-5 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">
                    Starting from
                  </p>

                  <div className="flex items-end gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#061B45]">
                      {formattedPrice}
                    </span>

                    {pkg.price !== null &&
                      pkg.price !== undefined &&
                      pkg.price !== "" && (
                        <span className="text-sm text-gray-500 pb-1">
                          / person
                        </span>
                      )}
                  </div>
                </div>

                {/* SUMMARY */}

                <div className="py-5 space-y-4">
                  {formattedDuration && (
                    <SidebarInfo
                      icon={
                        <Clock className="w-5 h-5 text-[#061B45]" />
                      }
                      label="Duration"
                      value={
                        <>
                          {formattedDuration}

                          {pkg?.duration_nights !==
                            undefined &&
                            ` / ${pkg.duration_nights} ${
                              Number(
                                pkg.duration_nights
                              ) === 1
                                ? "night"
                                : "nights"
                            }`}
                        </>
                      }
                      bg="bg-blue-50"
                    />
                  )}

                  {pkg.destination && (
                    <SidebarInfo
                      icon={
                        <MapPin className="w-5 h-5 text-[#FF3B0B]" />
                      }
                      label="Destination"
                      value={pkg.destination}
                      bg="bg-red-50"
                    />
                  )}

                  {packageTypeLabel && (
                    <SidebarInfo
                      icon={
                        <MapPin className="w-5 h-5 text-[#061B45]" />
                      }
                      label="Package Type"
                      value={packageTypeLabel}
                      bg="bg-gray-100"
                    />
                  )}

                  {itinerary.length > 0 && (
                    <SidebarInfo
                      icon={
                        <CalendarDays className="w-5 h-5 text-[#061B45]" />
                      }
                      label="Itinerary"
                      value={`${itinerary.length} ${
                        itinerary.length === 1
                          ? "Day"
                          : "Days"
                      }`}
                      bg="bg-gray-100"
                    />
                  )}
                </div>

                {/* =================================================
                    ACTIONS
                ================================================== */}

                <div className="space-y-3">
                  {/* DOWNLOAD (opens enquiry form first) */}

                  <button
                    type="button"
                    onClick={openDownloadForm}
                    disabled={downloadingPDF}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-navy text-white font-bold px-5 py-3.5 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPDF
                      ? "Preparing..."
                      : "Download Itinerary"}
                  </button>

                  {/* REVIEW */}

                  {/* <button
                    type="button"
                    onClick={openReview}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#061B45] text-[#061B45] hover:bg-[#061B45] hover:text-white font-bold px-5 py-3.5 transition-colors"
                  >
                    <MessageSquareHeart className="w-4 h-4" />
                    Your Valuable Review
                  </button> */}

                  {/* MORE PACKAGES */}

                  <Link
                    to="/packages"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-accent hover:text-white font-bold px-5 py-3.5 transition-colors"
                  >
                    View More Packages
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* TRUST */}

                <div className="mt-5 pt-5 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5 text-green-600" />
                    </div>

                    <div>
                      <p className="font-semibold text-[#061B45] text-sm">
                        Get your personalized itinerary
                      </p>

                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        Submit your details and receive
                        your personalized trip itinerary.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* =====================================================
            REVIEW CTA
        ====================================================== */}

        <section className="border-y border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm uppercase tracking-wide font-bold text-[#FF3B0B]">
                  Traveller experiences
                </p>

                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#061B45]">
                  Your Valuable Review
                </h2>

                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                  Share your experience with
                  On a Trip Holidays and help future
                  travellers plan their journey.
                </p>
              </div>

              <button
                type="button"
                onClick={openReview}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF3B0B] hover:bg-[#E92F00] text-white font-bold px-5 py-3.5 transition shrink-0"
              >
                <MessageSquareHeart className="w-4 h-4" />
                Your Valuable Review
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            FAQ
        ====================================================== */}

        <section ref={faqSectionRef}>
          <FAQSection category="packages" />
        </section>

        <Footer />

        {/* =====================================================
            MOBILE / TABLET FLOATING DOWNLOAD
        ====================================================== */}

        {showFloatingDownload && (
          <div className="fixed bottom-5 left-4 sm:left-6 z-[80] lg:hidden">
            <button
              type="button"
              onClick={openDownloadForm}
              disabled={downloadingPDF}
              className="inline-flex items-center gap-2 rounded-full bg-[#061B45] hover:bg-[#0B2559] text-white px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base font-bold shadow-xl shadow-black/15 transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />

              <span>
                {downloadingPDF
                  ? "Preparing..."
                  : "Download Itinerary"}
              </span>
            </button>
          </div>
        )}

        {/* =====================================================
            ENQUIRY / DOWNLOAD FORM

            The PDF is generated ONLY from onSuccess, after the
            enquiry is submitted successfully. downloadItinerary
            is false so EnquiryForm does not also generate it
            (that would download the PDF twice).
        ====================================================== */}

        {showEnquiry && (
          <EnquiryForm
            pkg={pkg}
            destination={pkg?.destination || null}
            onClose={() => {
              setShowEnquiry(false);
            }}
            onSuccess={handleEnquirySuccess}
            downloadItinerary={false}
          />
        )}

        {/* =====================================================
            REVIEW MODAL
        ====================================================== */}

        {showReview && (
          <ReviewFormModal
            open={showReview}
            pkg={pkg}
            onClose={closeReview}
            onSubmitted={() => {
              setShowReview(false);
            }}
          />
        )}

        {/* =====================================================
            TERMS / CANCELLATION MODAL
        ====================================================== */}

        {activePolicy && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() =>
              setActivePolicy(null)
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* HEADER */}

              <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      activePolicy === "terms"
                        ? "bg-blue-50"
                        : "bg-red-50"
                    }`}
                  >
                    {activePolicy === "terms" ? (
                      <FileText className="w-5 h-5 text-[#061B45]" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-[#FF3B0B]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="policy-modal-title"
                      className="text-lg sm:text-xl font-bold text-[#061B45]"
                    >
                      {activePolicy === "terms"
                        ? "Terms & Conditions"
                        : "Cancellation Policy"}
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-500">
                      {activePolicy === "terms"
                        ? "Important booking information"
                        : "Cancellation and refund information"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActivePolicy(null)
                  }
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* CONTENT */}

              <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
                <div className="text-gray-600 text-sm sm:text-base leading-7 whitespace-pre-line break-words">
                  {activePolicy === "terms"
                    ? pkg.terms_and_conditions
                    : pkg.cancellation_policy}
                </div>
              </div>

              {/* FOOTER */}

              <div className="shrink-0 px-5 sm:px-7 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() =>
                    setActivePolicy(null)
                  }
                  className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#061B45] hover:bg-[#0B2559] text-white font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
          {icon}
        </div>

        <span className="text-sm text-gray-500">
          {label}
        </span>
      </div>

      <p className="font-bold text-[#061B45] break-words">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SIDEBAR INFO
========================================================= */

function SidebarInfo({
  icon,
  label,
  value,
  bg,
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className="font-semibold text-[#061B45] break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   POLICY CARD
========================================================= */

function PolicyCard({
  type,
  onClick,
}) {
  const isTerms = type === "terms";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 transition-all duration-200 ${
        isTerms
          ? "hover:border-[#061B45] hover:shadow-md"
          : "hover:border-[#FF3B0B] hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isTerms
              ? "bg-blue-50 group-hover:bg-[#061B45]"
              : "bg-red-50 group-hover:bg-[#FF3B0B]"
          }`}
        >
          {isTerms ? (
            <FileText className="w-6 h-6 text-[#061B45] group-hover:text-white transition-colors" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-[#FF3B0B] group-hover:text-white transition-colors" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#061B45] text-base sm:text-lg">
            {isTerms
              ? "Terms & Conditions"
              : "Cancellation Policy"}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {isTerms
              ? "View booking terms and important information"
              : "View cancellation and refund information"}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF3B0B] transition-colors shrink-0" />
      </div>
    </button>
  );
}

export default PackageDetail;
