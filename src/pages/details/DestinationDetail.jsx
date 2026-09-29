
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  IndianRupee,
  MapPin,
  MessageSquareHeart,
  Send,
  Clock3,
  PackageCheck,
} from "lucide-react";

import { getMostVisitedBySlug } from "../../api/content";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import EnquiryForm from "../EnquiryForm";
import FAQSection from "../../components/FAQSection";
import ReviewFormModal from "../../components/ReviewFormModal";

/* --------------------------------------------------
   HELPERS
   (outside the component so they are stable and can be
   used inside useMemo without dependency warnings)
-------------------------------------------------- */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image.url || image.secure_url || "";
  }

  return "";
};

const getPackageImage = (pkg) => {
  const images = Array.isArray(pkg?.images) ? pkg.images : [];
  const firstImage = images[0];

  if (typeof firstImage === "string" && firstImage.trim()) {
    return firstImage;
  }

  if (firstImage && typeof firstImage === "object") {
    return firstImage.url || firstImage.secure_url || "";
  }

  if (pkg?.image) {
    return getImageUrl(pkg.image);
  }

  return "";
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Contact us";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return `₹${numericPrice.toLocaleString("en-IN")}`;
};

export default function DestinationDetail() {
  const { slug } = useParams();

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enquiry, setEnquiry] = useState(false);
  const [showReview, setShowReview] = useState(false);

  /* --------------------------------------------------
     FETCH DESTINATION
  -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const loadDestination = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setPlace(null);

        const data = await getMostVisitedBySlug(slug);

        if (!mounted) return;

        if (!data) {
          setNotFound(true);
          return;
        }

        setPlace(data);
      } catch (error) {
        console.error("Failed to load destination:", error);

        if (mounted) {
          setNotFound(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      loadDestination();
    } else {
      setLoading(false);
      setNotFound(true);
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  const destinationImage = useMemo(() => {
    return getImageUrl(place?.image);
  }, [place]);

  /* --------------------------------------------------
     PACKAGES
  -------------------------------------------------- */
  const destinationPackages = useMemo(() => {
    if (!Array.isArray(place?.packages)) {
      return [];
    }

    return place.packages
      .filter((pkg) => {
        return (
          pkg?.status === undefined ||
          pkg?.status === "published" ||
          pkg?.is_published === true
        );
      })
      .filter((pkg) => Boolean(pkg?.slug))
      .sort((a, b) => {
        // Most Visited packages first
        const mostVisitedDiff =
          Number(Boolean(b?.is_most_visited)) -
          Number(Boolean(a?.is_most_visited));

        if (mostVisitedDiff !== 0) {
          return mostVisitedDiff;
        }

        // Then display order
        const orderDiff =
          Number(a?.display_order ?? 0) -
          Number(b?.display_order ?? 0);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        // Finally ID
        return Number(a?.id ?? 0) - Number(b?.id ?? 0);
      });
  }, [place]);

  /* --------------------------------------------------
     PRICE
  -------------------------------------------------- */
  const hasStartingPrice =
    place?.starting_from !== null && place?.starting_from !== undefined;

  const formattedPrice = useMemo(() => {
    if (!hasStartingPrice) {
      return "Contact us";
    }

    return formatPrice(place.starting_from);
  }, [place, hasStartingPrice]);

  /* --------------------------------------------------
     SEO
  -------------------------------------------------- */
  const seoDescription =
    place?.description ||
    `Explore ${
      place?.place_name || "this destination"
    } with On a Trip Holidays. Discover travel experiences, attractions, best time to visit and holiday packages.`;

  const destinationPath = `/destinations/${place?.slug || slug}`;

  const canonicalUrl = `${SITE_URL}${destinationPath}`;

  /* --------------------------------------------------
     JSON-LD
  -------------------------------------------------- */
  const jsonLd = useMemo(() => {
    if (!place) return null;

    const packageItems = destinationPackages.map((pkg) => {
      const image = getPackageImage(pkg);

      return {
        "@type": "Product",
        name: pkg?.title,
        url: `${SITE_URL}/packages/${pkg.slug}`,
        description: pkg?.description || undefined,
        image: image ? [image] : undefined,
        offers: {
          "@type": "Offer",
          price: pkg?.price,
          priceCurrency: "INR",
          url: `${SITE_URL}/packages/${pkg.slug}`,
          availability: "https://schema.org/InStock",
        },
      };
    });

    return [
      {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        name: place.place_name,
        description: seoDescription,
        image: destinationImage ? [destinationImage] : [],
        url: canonicalUrl,
      },

      ...(packageItems.length > 0
        ? [
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Holiday Packages in ${place.place_name}`,
              itemListElement: packageItems.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item,
              })),
            },
          ]
        : []),

      {
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
            name: "Destinations",
            item: `${SITE_URL}/destinations`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: place.place_name,
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [
    place,
    destinationPackages,
    seoDescription,
    destinationImage,
    canonicalUrl,
  ]);

  /* --------------------------------------------------
     LOADING
  -------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F22727] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm sm:text-base text-gray-600">
            Loading destination...
          </p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------
     NOT FOUND
  -------------------------------------------------- */
  if (notFound || !place) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="text-5xl sm:text-6xl font-bold text-[#102040] mb-4">
            404
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#0D0D0D] mb-3">
            Destination not found
          </h1>

          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-6">
            The destination you are looking for may have been
            removed or is no longer available.
          </p>

          <Link
            to="/destinations"
            className="inline-flex items-center justify-center gap-2 bg-[#F22727] text-white px-5 sm:px-6 py-3 rounded-xl font-semibold hover:bg-[#D94141] transition"
          >
            <ArrowLeft size={18} />
            Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------
     MAIN

     NOTE (sticky sidebar): the page wrapper uses
     overflow-x-clip, NOT overflow-x-hidden.
     overflow-x-hidden turns the wrapper into a scroll
     container, which silently breaks position: sticky on
     the sidebar. overflow-x-clip stops horizontal overflow
     without doing that.
  -------------------------------------------------- */
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* ==================================================
          SEO
      ================================================== */}
      <Seo
        title={`${place.place_name} — Travel Guide & Packages | OnaTrip Holidays`}
        description={seoDescription}
        canonical={canonicalUrl}
        path={destinationPath}
        image={destinationImage}
        type="website"
        jsonLd={jsonLd}
      />

      {/* ==================================================
          BREADCRUMB
      ================================================== */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 overflow-hidden"
          >
            <Link
              to="/"
              className="flex-shrink-0 hover:text-[#F22727] transition"
            >
              Home
            </Link>

            <ChevronRight
              size={14}
              className="flex-shrink-0"
              aria-hidden="true"
            />

            <Link
              to="/destinations"
              className="flex-shrink-0 hover:text-[#F22727] transition"
            >
              Destinations
            </Link>

            <ChevronRight
              size={14}
              className="flex-shrink-0"
              aria-hidden="true"
            />

            <span className="text-gray-800 font-medium truncate">
              {place.place_name}
            </span>
          </nav>
        </div>
      </section>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-6">
        {/* BACK */}
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 text-sm text-[#102040] hover:text-[#F22727] font-semibold mb-3 transition"
        >
          <ArrowLeft size={17} />
          Back to Destinations
        </Link>

        {/* ==================================================
            DESTINATION HEADER
        ================================================== */}
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-center gap-2 text-[#F22727] font-semibold text-sm sm:text-base mb-2 sm:mb-3">
            <MapPin
              size={18}
              className="flex-shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">{place.place_name}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#102040] leading-tight break-words">
            Explore {place.place_name}
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl leading-7">
            Discover the beauty, experiences and unforgettable
            moments waiting for you in {place.place_name}.
          </p>
        </section>

        {/* ==================================================
            HERO IMAGE
        ================================================== */}
        {destinationImage && (
          <section className="mb-8 sm:mb-10 lg:mb-14">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100 shadow-sm">
              <img
                src={destinationImage}
                alt={`${place.place_name} — popular travel destination`}
                className="w-full h-full object-cover"
                fetchPriority="high"
                width="1400"
                height="600"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-10">
                <div className="flex items-center gap-2 text-white/90 text-sm sm:text-base font-medium">
                  <MapPin size={18} />
                  <span>{place.place_name}</span>
                </div>

                <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">
                  Your next adventure starts here
                </h2>
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            CONTENT + SIDEBAR

            - items-start stops the grid stretching the
              sidebar to the full column height (a stretched
              sidebar can never stick)
            - the sidebar uses self-start
            - sticky only starts at lg; mobile/tablet stay in
              normal vertical flow
            - this grid holds ONLY the content column and the
              sidebar. The review band is outside <main>.
        ================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 xl:gap-14 items-start">
          {/* ==================================================
              LEFT CONTENT
          ================================================== */}
          <div className="min-w-0 space-y-8 sm:space-y-10 lg:space-y-12">
            {/* ABOUT */}
            {place.description && (
              <section>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#102040] mb-4 sm:mb-5">
                  About {place.place_name}
                </h2>

                <div className="text-sm sm:text-base lg:text-lg text-gray-700 leading-7 sm:leading-8 whitespace-pre-line break-words">
                  {place.description}
                </div>
              </section>
            )}

            {/* TRAVEL INFORMATION */}
            {(place.best_time_to_visit || hasStartingPrice) && (
              <section>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#102040] mb-5 sm:mb-6">
                  Travel Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* BEST TIME */}
                  {place.best_time_to_visit && (
                    <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                          <CalendarDays
                            size={20}
                            className="text-[#F22727]"
                          />
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Best Time
                          </p>

                          <h3 className="text-base sm:text-lg font-bold text-[#102040]">
                            Best Time to Visit
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-gray-700 leading-6">
                        {place.best_time_to_visit}
                      </p>
                    </div>
                  )}

                  {/* PRICE */}
                  {hasStartingPrice && (
                    <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                          <IndianRupee
                            size={20}
                            className="text-[#F22727]"
                          />
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Starting From
                          </p>

                          <h3 className="text-base sm:text-lg font-bold text-[#102040]">
                            Holiday Packages
                          </h3>
                        </div>
                      </div>

                      <p className="text-2xl sm:text-3xl font-bold text-[#102040]">
                        {formattedPrice}
                      </p>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Package price starts from
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* HOLIDAY PACKAGES */}
            <section id="holiday-packages">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[#F22727] mb-2">
                    <PackageCheck size={20} />

                    <span className="text-sm font-semibold">
                      Holiday Packages
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#102040]">
                    Holiday Packages in {place.place_name}
                  </h2>

                  <p className="mt-2 text-sm sm:text-base text-gray-600 leading-6">
                    Explore holiday packages available for{" "}
                    {place.place_name} and choose the experience
                    that suits your travel plans.
                  </p>
                </div>

                {destinationPackages.length > 0 && (
                  <Link
                    to="/packages"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F22727] hover:text-[#D94141] transition whitespace-nowrap"
                  >
                    View All Packages
                    <ChevronRight size={17} />
                  </Link>
                )}
              </div>

              {destinationPackages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  {destinationPackages.map((pkg) => {
                    const packageImage = getPackageImage(pkg);

                    const hasNights =
                      pkg.duration_nights !== null &&
                      pkg.duration_nights !== undefined;

                    return (
                      <article
                        key={pkg.id ?? pkg.slug}
                        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <Link
                          to={`/packages/${pkg.slug}`}
                          className="block"
                        >
                          {/* PACKAGE IMAGE */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                            {packageImage ? (
                              <img
                                src={packageImage}
                                alt={pkg.title}
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                loading="lazy"
                                width="800"
                                height="500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <PackageCheck
                                  size={34}
                                  className="text-gray-300"
                                />
                              </div>
                            )}

                            {pkg.is_most_visited && (
                              <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#102040] shadow-sm">
                                Most Visited
                              </span>
                            )}
                          </div>

                          {/* PACKAGE CONTENT */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-lg sm:text-xl font-bold text-[#102040] leading-tight line-clamp-2">
                                {pkg.title}
                              </h3>

                              <ChevronRight
                                size={20}
                                className="mt-0.5 flex-shrink-0 text-[#F22727] transition-transform group-hover:translate-x-1"
                              />
                            </div>

                            {pkg.description && (
                              <p className="mt-2 text-sm text-gray-600 leading-6 line-clamp-2">
                                {pkg.description}
                              </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                              {pkg.duration_days && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3
                                    size={15}
                                    className="text-[#F22727]"
                                  />

                                  {pkg.duration_days}{" "}
                                  {Number(pkg.duration_days) === 1
                                    ? "Day"
                                    : "Days"}

                                  {hasNights &&
                                    ` / ${pkg.duration_nights} ${
                                      Number(pkg.duration_nights) === 1
                                        ? "Night"
                                        : "Nights"
                                    }`}
                                </span>
                              )}

                              {pkg.package_type && (
                                <span className="capitalize">
                                  {String(pkg.package_type).replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="mt-5 flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
                              <div>
                                <p className="text-xs text-gray-500">
                                  Starting from
                                </p>

                                <p className="mt-0.5 text-xl font-bold text-[#102040]">
                                  {formatPrice(pkg.price)}
                                </p>
                              </div>

                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F22727] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#D94141]">
                                View Package
                                <ChevronRight size={16} />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8 text-center">
                  <PackageCheck
                    size={32}
                    className="mx-auto text-gray-300"
                  />

                  <h3 className="mt-3 text-lg font-bold text-[#102040]">
                    Packages coming soon
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 leading-6 max-w-md mx-auto">
                    We are currently preparing holiday packages for{" "}
                    {place.place_name}. You can still contact our
                    travel team to plan your trip.
                  </p>

                  <button
                    type="button"
                    onClick={() => setEnquiry(true)}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#F22727] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D94141] transition"
                  >
                    Plan My Trip
                    <Send size={16} />
                  </button>
                </div>
              )}
            </section>

            {/* WHY VISIT */}
            <section>
              <div className="rounded-2xl sm:rounded-3xl bg-gray-50 p-5 sm:p-7 lg:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={20} className="text-[#F22727]" />

                  <span className="text-sm font-semibold text-[#F22727]">
                    Travel Highlights
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#102040] mb-4">
                  Why Visit {place.place_name}?
                </h2>

                <p className="text-sm sm:text-base text-gray-700 leading-7">
                  Experience the unique landscapes, local culture,
                  memorable attractions and incredible experiences
                  that make {place.place_name} a wonderful holiday
                  destination.
                </p>
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
              Sticky ONLY on desktop (lg+). Mobile/tablet =
              normal vertical flow.
          ================================================== */}
          <aside className="w-full self-start lg:sticky lg:top-24">
            <div className="border border-gray-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 shadow-lg bg-white">
              {/* DISCOVER CARD */}
              <div className="relative overflow-hidden rounded-2xl bg-[#102040] p-5 sm:p-6 mb-5">
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#F22727]/20" />

                <div className="absolute -right-5 -bottom-10 w-28 h-28 rounded-full bg-white/5" />

                <div className="relative">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 mb-4">
                    <MapPin size={20} className="text-[#F22727]" />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
                    Discover
                  </p>

                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Explore {place.place_name}
                  </h2>

                  <p className="text-sm text-white/75 leading-6">
                    Visit breathtaking places, experience local
                    culture and create unforgettable memories.
                  </p>
                </div>
              </div>

              {/* SUPPORT TEXT */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50">
                <p className="text-xs sm:text-sm text-gray-600 leading-5 sm:leading-6">
                  Need help planning your trip to{" "}
                  <strong>{place.place_name}</strong>? Our travel
                  team can help create a personalized holiday for
                  you.
                </p>

                <button
                  type="button"
                  onClick={() => setEnquiry(true)}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#F22727] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D94141] transition"
                >
                  Enquiry Now
                  <Send size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ==================================================
          REVIEW CTA
          Separate full-width band BELOW <main> and above the
          FAQ, same as PackageDetail. It is not part of the
          content/sidebar grid.
      ================================================== */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm uppercase tracking-wide font-bold text-[#F22727]">
                Traveller experiences
              </p>

              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#102040]">
                Your Valuable Review
              </h2>

              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                Share your experience with OnaTrip Holidays and help
                future travellers plan their journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F22727] hover:bg-[#D94141] text-white font-bold px-5 py-3.5 transition shrink-0"
            >
              <MessageSquareHeart className="w-4 h-4" />
              Your Valuable Review
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          FAQ
      ================================================== */}
      <section className="w-full">
        <FAQSection category="most_visited" />
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}
      <Footer />

      {/* ==================================================
          ENQUIRY MODAL
      ================================================== */}
      {enquiry && (
        <EnquiryForm
          destination={place}
          showPackageType={false}
          onClose={() => setEnquiry(false)}
        />
      )}

      {/* ==================================================
          REVIEW MODAL
      ================================================== */}
      {showReview && (
        <ReviewFormModal
          open={showReview}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setShowReview(false)}
        />
      )}
    </div>
  );
}













