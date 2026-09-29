
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  Quote,
  Sparkles,
  X,
  Images,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getHappyMomentBySlug,
  getHappyMoments,
} from "../../api/content";

import Footer from "../../components/Footer";
import FAQSection from "../../components/FAQSection";
import { SITE_URL } from "../../components/Seo";

export default function HappyMomentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [moment, setMoment] = useState(null);
  const [otherMoments, setOtherMoments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  /* =========================================================
     LOAD HAPPY MOMENT
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadMoment = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const [currentResponse, allResponse] = await Promise.all([
          getHappyMomentBySlug(slug),
          getHappyMoments(),
        ]);

        if (!mounted) return;

        const current =
          currentResponse?.data ?? currentResponse ?? null;

        const all =
          allResponse?.data ??
          allResponse ??
          [];

        if (!current) {
          setNotFound(true);
          setMoment(null);
          return;
        }

        setMoment(current);

        const currentId = current?.id;

        const related = Array.isArray(all)
          ? all.filter((item) => item?.id !== currentId)
          : [];

        setOtherMoments(related);
      } catch (error) {
        console.error(
          "Failed to load happy moment:",
          error
        );

        if (mounted) {
          setNotFound(true);
          setMoment(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      loadMoment();
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* =========================================================
     IMAGE HELPER
  ========================================================= */

  const getImageUrl = (image) => {
    if (!image) return "";

    if (typeof image === "string") {
      return image;
    }

    if (typeof image === "object") {
      return (
        image.url ||
        image.secure_url ||
        image.src ||
        ""
      );
    }

    return "";
  };

  /* =========================================================
     MOMENT DATA
  ========================================================= */

  const title =
    moment?.title?.trim() ||
    "Happy Travel Moment";

  const placeName =
    moment?.place_name?.trim() || "";

  const shortCaption =
    moment?.short_caption?.trim() || "";

  const placeDescription =
    moment?.place_description?.trim() || "";

  const experience =
    moment?.experience?.trim() || "";

  const highlights = Array.isArray(moment?.highlights)
    ? moment.highlights.filter(Boolean)
    : [];

  const coverImage = getImageUrl(moment?.image);

  const galleryImages = Array.isArray(
    moment?.gallery_images
  )
    ? moment.gallery_images
        .map(getImageUrl)
        .filter(Boolean)
    : [];

  /*
   * Cover image + gallery images
   */
  const allImages = useMemo(() => {
    const images = [];

    if (coverImage) {
      images.push({
        url: coverImage,
        public_id:
          moment?.image?.public_id ||
          "cover",
      });
    }

    galleryImages.forEach((url, index) => {
      images.push({
        url,
        public_id:
          moment?.gallery_images?.[index]
            ?.public_id ||
          `gallery-${index}`,
      });
    });

    return images;
  }, [
    coverImage,
    galleryImages,
    moment,
  ]);

  /* =========================================================
     DATE
  ========================================================= */

  const formattedDate = useMemo(() => {
    if (!moment?.travel_date) {
      return null;
    }

    try {
      return new Date(
        `${moment.travel_date}T00:00:00`
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return moment.travel_date;
    }
  }, [moment?.travel_date]);

  /* =========================================================
     SEO
  ========================================================= */

  const canonicalPath =
    `/happy-moments/${slug}`;

  const canonicalUrl =
    `${SITE_URL}${canonicalPath}`;

  const seoDescription =
    placeDescription ||
    shortCaption ||
    `Read this memorable travel experience from ${title}${
      placeName ? ` in ${placeName}` : ""
    }.`;

  const jsonLd = useMemo(() => {
    if (!moment) {
      return null;
    }

    return [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: seoDescription,
        url: canonicalUrl,
        image: allImages.map(
          (image) => image.url
        ),
        datePublished:
          moment.created_at || undefined,
        dateModified:
          moment.created_at || undefined,
        author: {
          "@type": "Organization",
          name: "On a Trip Holiday",
        },
        publisher: {
          "@type": "Organization",
          name: "On a Trip Holiday",
        },
      },

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
            name: "Happy Moments",
            item: `${SITE_URL}/#happy-moments`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [
    moment,
    title,
    seoDescription,
    canonicalUrl,
    allImages,
  ]);

  /* =========================================================
     LIGHTBOX
  ========================================================= */

  const selectedIndex = useMemo(() => {
    if (!selectedImage) {
      return -1;
    }

    return allImages.findIndex(
      (image) =>
        image.url === selectedImage.url
    );
  }, [
    selectedImage,
    allImages,
  ]);

  const showPreviousImage = () => {
    if (
      selectedIndex < 0 ||
      allImages.length <= 1
    ) {
      return;
    }

    const previousIndex =
      selectedIndex === 0
        ? allImages.length - 1
        : selectedIndex - 1;

    setSelectedImage(
      allImages[previousIndex]
    );
  };

  const showNextImage = () => {
    if (
      selectedIndex < 0 ||
      allImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      selectedIndex === allImages.length - 1
        ? 0
        : selectedIndex + 1;

    setSelectedImage(
      allImages[nextIndex]
    );
  };

  /* =========================================================
     KEYBOARD CONTROLS
  ========================================================= */

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [
    selectedImage,
    selectedIndex,
    allImages,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-[#F22727] mx-auto mb-4" />

          <p className="text-sm sm:text-base text-gray-600">
            Loading travel memory...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (notFound || !moment) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-8 h-8 text-[#F22727]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#102040]">
              Happy moment not found
            </h1>

            <p className="mt-3 text-sm sm:text-base text-gray-600">
              We couldn't find the travel memory
              you're looking for.
            </p>

            <Link
              to="/happy-moments"
              className="
                inline-flex
                items-center
                gap-2
                mt-7
                px-5
                py-3
                rounded-full
                bg-[#102040]
                text-white
                text-sm
                font-semibold
                hover:bg-[#182c52]
                transition
              "
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Happy Moments
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* =====================================================
          SEO
      ===================================================== */}

      <Helmet>
        <title>
          {title} | On a Trip Holiday
        </title>

        <meta
          name="description"
          content={seoDescription}
        />

        <link
          rel="canonical"
          href={canonicalUrl}
        />

        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        <nav
          aria-label="Breadcrumb"
          className="
            flex
            flex-wrap
            items-center
            gap-2
            text-xs
            sm:text-sm
            text-gray-500
          "
        >
          <Link
            to="/"
            className="hover:text-[#F22727] transition-colors"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            to="/happy-moments"
            className="hover:text-[#F22727] transition-colors"
          >
            Happy Moments
          </Link>

          <span>/</span>

          <span className="text-gray-700 truncate max-w-[220px] sm:max-w-md">
            {title}
          </span>
        </nav>
      </div>

      {/* =====================================================
          FULL WIDTH COVER IMAGE
      ===================================================== */}

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 lg:pt-9">
          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-2xl
              sm:rounded-3xl
              bg-gray-100
              shadow-sm
              aspect-[16/8]
            "
          >
            {coverImage ? (
              <button
                type="button"
                onClick={() =>
                  setSelectedImage(
                    allImages[0]
                  )
                }
                className="block w-full h-full group"
                aria-label="View cover image"
              >
                <img
                  src={coverImage}
                  alt={
                    placeName
                      ? `${title} in ${placeName}`
                      : title
                  }
                  className="
                    w-full
                    h-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-[1.02]
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-black/35
                    via-transparent
                    to-transparent
                    pointer-events-none
                  "
                />
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-16 h-16 text-[#102040]/10" />
              </div>
            )}

            {/* PHOTO COUNT */}

            {allImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImage(
                    allImages[0]
                  )
                }
                className="
                  absolute
                  bottom-4
                  right-4
                  sm:bottom-5
                  sm:right-5
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-full
                  bg-[#102040]/85
                  text-white
                  text-xs
                  sm:text-sm
                  font-semibold
                  backdrop-blur-sm
                  hover:bg-[#102040]
                  transition
                "
              >
                <Images className="w-4 h-4" />
                {allImages.length} Photos
              </button>
            )}
          </div>
        </section>

        {/* ===================================================
            TITLE / HEADER
        =================================================== */}

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12">
          {/* PLACE */}

          {placeName && (
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-red-50
                text-[#F22727]
                text-xs
                sm:text-sm
                font-semibold
              "
            >
              <MapPin className="w-4 h-4" />
              {placeName}
            </div>
          )}

          {/* TITLE */}

          <h1
            className="
              mt-4
              font-display
              text-3xl
              sm:text-4xl
              md:text-5xl
              lg:text-[52px]
              font-bold
              leading-[1.1]
              text-[#102040]
              break-words
            "
          >
            {title}
          </h1>

          {/* DATE */}

          {formattedDate && (
            <div
              className="
                mt-4
                flex
                items-center
                gap-2
                text-sm
                text-gray-500
              "
            >
              <CalendarDays className="w-4 h-4" />

              <span>
                Travelled on {formattedDate}
              </span>
            </div>
          )}

          {/* CAPTION */}

          {shortCaption && (
            <div
              className="
                relative
                mt-6
                rounded-2xl
                bg-gray-50
                border
                border-gray-100
                p-5
                sm:p-6
              "
            >
              <Quote
                className="
                  absolute
                  top-4
                  left-4
                  w-7
                  h-7
                  text-[#F22727]/15
                "
              />

              <p
                className="
                  pl-6
                  text-base
                  sm:text-lg
                  text-[#102040]/75
                  leading-relaxed
                  italic
                "
              >
                "{shortCaption}"
              </p>
            </div>
          )}

          {/* HAPPY TRAVELLER */}

          <div className="mt-6 flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-full
                bg-red-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Heart
                className="w-5 h-5 text-[#F22727]"
                fill="currentColor"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#102040]">
                Happy Traveller
              </p>

              <p className="text-xs text-gray-500">
                Memories with On a Trip Holiday
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
          {/* =================================================
              PLACE DESCRIPTION
          ================================================= */}

          {placeDescription && (
            <article className="mb-10 sm:mb-12">
              <div className="mb-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
                  About the destination
                </p>

                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
                  {placeName
                    ? `About ${placeName}`
                    : "About this destination"}
                </h2>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-gray-100
                  bg-white
                  p-5
                  sm:p-7
                  shadow-sm
                "
              >
                <p
                  className="
                    text-sm
                    sm:text-base
                    leading-7
                    sm:leading-8
                    text-gray-700
                    whitespace-pre-line
                  "
                >
                  {placeDescription}
                </p>
              </div>
            </article>
          )}

          {/* =================================================
              EXPERIENCE
          ================================================= */}

          {experience && (
            <article className="mb-10 sm:mb-12">
              <div className="mb-4">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
                  Traveller experience
                </p>

                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
                  The Experience
                </h2>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-gray-100
                  bg-gray-50
                  p-5
                  sm:p-7
                "
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      hidden
                      sm:flex
                      w-11
                      h-11
                      rounded-xl
                      bg-red-50
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Heart
                      className="w-5 h-5 text-[#F22727]"
                      fill="currentColor"
                    />
                  </div>

                  <p
                    className="
                      text-sm
                      sm:text-base
                      leading-7
                      sm:leading-8
                      text-gray-700
                      whitespace-pre-line
                    "
                  >
                    {experience}
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* =================================================
              HIGHLIGHTS
          ================================================= */}

          {highlights.length > 0 && (
            <article className="mb-10 sm:mb-12">
              <div className="mb-5">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
                  Trip highlights
                </p>

                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
                  What made this trip special
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {highlights.map(
                  (highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-gray-100
                        bg-white
                        p-4
                        sm:p-5
                        shadow-sm
                      "
                    >
                      <div
                        className="
                          w-8
                          h-8
                          rounded-full
                          bg-red-50
                          flex
                          items-center
                          justify-center
                          shrink-0
                        "
                      >
                        <Sparkles className="w-4 h-4 text-[#F22727]" />
                      </div>

                      <p
                        className="
                          text-sm
                          sm:text-base
                          text-gray-700
                          leading-6
                          sm:leading-7
                        "
                      >
                        {highlight}
                      </p>
                    </div>
                  )
                )}
              </div>
            </article>
          )}

          {/* =================================================
              GALLERY
          ================================================= */}

          {allImages.length > 1 && (
            <article className="mb-10 sm:mb-12">
              <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
                    Travel gallery
                  </p>

                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#102040]">
                    More memories
                  </h2>
                </div>

                <p className="hidden sm:block text-sm text-gray-500">
                  {allImages.length} photos
                </p>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  md:grid-cols-3
                  gap-3
                  sm:gap-4
                "
              >
                {allImages
                  .slice(1)
                  .map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                      className="
                        group
                        relative
                        overflow-hidden
                        rounded-xl
                        sm:rounded-2xl
                        bg-gray-100
                        aspect-[4/3]
                      "
                    >
                      <img
                        src={image.url}
                        alt={`${title} travel memory ${index + 1}`}
                        loading="lazy"
                        className="
                          w-full
                          h-full
                          object-cover
                          transition-transform
                          duration-500
                          group-hover:scale-105
                        "
                      />

                      <div
                        className="
                          absolute
                          inset-0
                          bg-black/0
                          group-hover:bg-black/10
                          transition
                        "
                      />
                    </button>
                  ))}
              </div>
            </article>
          )}

          {/* =================================================
              CTA
          ================================================= */}

          <section
            className="
              relative
              overflow-hidden
              rounded-2xl
              sm:rounded-3xl
              bg-[#102040]
              p-6
              sm:p-8
              lg:p-10
              text-white
            "
          >
            <div
              className="
                absolute
                -right-20
                -top-20
                w-56
                h-56
                rounded-full
                bg-[#F22727]/10
              "
            />

            <div
              className="
                absolute
                -left-20
                -bottom-20
                w-48
                h-48
                rounded-full
                bg-white/5
              "
            />

            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <Heart
                    className="w-5 h-5 text-[#F22727]"
                    fill="currentColor"
                  />
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F22727]">
                    Your next memory
                  </p>

                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">
                    Ready to create your own story?
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm sm:text-base leading-6 text-white/70">
                    Let On a Trip Holiday help you
                    plan a memorable journey tailored
                    to your travel preferences.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/packages"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    min-h-[48px]
                    px-5
                    sm:px-6
                    py-3
                    rounded-xl
                    bg-[#F22727]
                    hover:bg-[#D94141]
                    text-white
                    text-sm
                    sm:text-base
                    font-bold
                    transition
                    shadow-md
                  "
                >
                  Explore Packages
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </section>

        {/* ===================================================
            FAQ
        =================================================== */}

        <FAQSection />

        {/* ===================================================
            FOOTER
        =================================================== */}

        <Footer />
      </main>

      {/* =====================================================
          IMAGE LIGHTBOX
      ===================================================== */}

      {selectedImage && (
        <div
          className="
            fixed
            inset-0
            z-[200]
            bg-black/90
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-3
            sm:p-5
          "
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedImage(null);
            }
          }}
        >
          {/* CLOSE */}

          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            className="
              absolute
              top-3
              right-3
              sm:top-5
              sm:right-5
              z-20
              w-10
              h-10
              sm:w-11
              sm:h-11
              rounded-full
              bg-white/10
              hover:bg-white/20
              text-white
              flex
              items-center
              justify-center
              transition
            "
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* PREVIOUS */}

          {allImages.length > 1 && (
            <button
              type="button"
              onClick={showPreviousImage}
              className="
                absolute
                left-2
                sm:left-5
                lg:left-8
                z-20
                w-10
                h-10
                sm:w-12
                sm:h-12
                rounded-full
                bg-white/10
                hover:bg-white/20
                text-white
                flex
                items-center
                justify-center
                transition
              "
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* IMAGE */}

          <div
            className="
              relative
              w-full
              max-w-6xl
              max-h-[90vh]
              flex
              items-center
              justify-center
            "
          >
            <img
              src={selectedImage.url}
              alt={title}
              className="
                max-w-full
                max-h-[85vh]
                object-contain
                rounded-lg
                sm:rounded-xl
                shadow-2xl
              "
            />

            {/* IMAGE COUNTER */}

            {allImages.length > 1 && (
              <div
                className="
                  absolute
                  bottom-3
                  left-1/2
                  -translate-x-1/2
                  px-3
                  py-1.5
                  rounded-full
                  bg-black/60
                  text-white
                  text-xs
                  sm:text-sm
                  backdrop-blur-sm
                "
              >
                {selectedIndex + 1} /{" "}
                {allImages.length}
              </div>
            )}
          </div>

          {/* NEXT */}

          {allImages.length > 1 && (
            <button
              type="button"
              onClick={showNextImage}
              className="
                absolute
                right-2
                sm:right-5
                lg:right-8
                z-20
                w-10
                h-10
                sm:w-12
                sm:h-12
                rounded-full
                bg-white/10
                hover:bg-white/20
                text-white
                flex
                items-center
                justify-center
                transition
              "
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}



