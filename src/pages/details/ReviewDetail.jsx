
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  MapPin,
  Send,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import {
  getTestimonialBySlug,
  getTestimonials,
  createTestimonial,
  getMostVisited,
} from "../../api/content";

import FAQSection from "../../components/FAQSection";
import Footer from "../../components/Footer";

const SITE_URL = "https://onatripholidays.com";

const INITIAL_FORM = {
  customer_name: "",
  customer_city: "",
  destination: "",
  rating: 5,
  review: "",
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
  }

  if (typeof image === "object" && typeof image.url === "string") {
    return image.url.trim();
  }

  return "";
}

function getInitials(name) {
  return (
    cleanText(name)
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "TR"
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function truncateText(text, maxLength = 155) {
  const value = cleanText(text);

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function StarRating({ rating = 0, size = "normal" }) {
  const numericRating = Number(rating) || 0;

  const starClass =
    size === "large"
      ? "w-5 h-5 sm:w-6 sm:h-6"
      : "w-4 h-4";

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${numericRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starClass} ${
            star <= numericRating
              ? "fill-current text-orange"
              : "text-white/30"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function FormStarRating({ value, onChange }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange/30"
        >
          <Star
            className={`w-7 h-7 ${
              star <= value
                ? "fill-orange text-orange"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RelatedReviewCard({ item }) {
  const imageUrl = getImageUrl(item?.image);
  const name = cleanText(item?.customer_name) || "Traveller";
  const destination =
    cleanText(item?.destination) || "Travel experience";

  return (
    <Link
      to={
        item?.slug
          ? `/reviews/${encodeURIComponent(item.slug)}`
          : "/reviews"
      }
      className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${name} travel review`}
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-surface"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
            {getInitials(name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-navy">
            {name}
          </h3>

          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={item?.rating} />
            <span className="text-xs font-semibold text-gray-500">
              {Number(item?.rating) || 0}/5
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-orange">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span className="truncate">{destination}</span>
      </div>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
        {cleanText(item?.review)}
      </p>

      <div className="mt-auto pt-5">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-navy transition group-hover:text-orange">
          Read Full Review
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export default function ReviewDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [otherReviews, setOtherReviews] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  const [error, setError] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD CURRENT REVIEW
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      if (!slug) {
        setError("Review not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getTestimonialBySlug(slug);

        if (!cancelled) {
          setReview(data);
        }
      } catch (err) {
        console.error("Failed to load review:", err);

        if (!cancelled) {
          setReview(null);
          setError(
            err?.response?.status === 404
              ? "Review not found."
              : "Unable to load this review right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /*
   * ---------------------------------------------------------
   * LOAD OTHER REVIEWS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadOtherReviews() {
      try {
        setLoadingRelated(true);

        const data = await getTestimonials();

        if (!cancelled) {
          const items = Array.isArray(data) ? data : [];

          setOtherReviews(items);
        }
      } catch (err) {
        console.error("Failed to load other reviews:", err);

        if (!cancelled) {
          setOtherReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRelated(false);
        }
      }
    }

    loadOtherReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD DESTINATIONS FOR REVIEW FORM
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadDestinations() {
      try {
        setLoadingDestinations(true);

        const data = await getMostVisited();

        if (!cancelled) {
          const items = Array.isArray(data) ? data : [];

          const uniquePlaces = [];
          const seen = new Set();

          items
            .sort(
              (a, b) =>
                Number(a?.display_order ?? 0) -
                Number(b?.display_order ?? 0)
            )
            .forEach((item) => {
              const place =
                cleanText(item?.place_name) ||
                cleanText(item?.destination) ||
                cleanText(item?.name) ||
                cleanText(item?.title);

              if (!place) return;

              const key = place.toLowerCase();

              if (seen.has(key)) return;

              seen.add(key);
              uniquePlaces.push(place);
            });

          setDestinations(uniquePlaces);
        }
      } catch (err) {
        console.error("Failed to load destinations:", err);

        if (!cancelled) {
          setDestinations([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDestinations(false);
        }
      }
    }

    loadDestinations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * IMAGE PREVIEW
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /*
   * ---------------------------------------------------------
   * DERIVED DATA
   * ---------------------------------------------------------
   */

  const customerName =
    cleanText(review?.customer_name) || "Traveller";

  const customerCity = cleanText(review?.customer_city);

  const destination =
    cleanText(review?.destination) || "On a Trip Holiday";

  const reviewText = cleanText(review?.review);

  const rating = Number(review?.rating) || 0;

  const reviewImage = getImageUrl(review?.image);

  const createdDate = formatDate(review?.created_at);

  const canonicalSlug =
    cleanText(review?.slug) || cleanText(slug);

  const canonicalPath = canonicalSlug
    ? `/reviews/${encodeURIComponent(canonicalSlug)}`
    : "/reviews";

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const seoTitle = `${customerName}'s ${destination} Travel Review | On a Trip Holiday`;

  const seoDescription =
    truncateText(reviewText, 155) ||
    `Read ${customerName}'s travel experience from ${destination} with On a Trip Holiday.`;

  const relatedReviews = useMemo(() => {
    if (!review) return [];

    const currentId = review?.id;
    const currentSlug = cleanText(review?.slug);

    return otherReviews
      .filter((item) => {
        if (currentId && item?.id === currentId) {
          return false;
        }

        if (
          currentSlug &&
          cleanText(item?.slug) === currentSlug
        ) {
          return false;
        }

        return Boolean(item?.slug);
      })
      .slice(0, 6);
  }, [otherReviews, review]);

  /*
   * ---------------------------------------------------------
   * FORM HANDLERS
   * ---------------------------------------------------------
   */

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError("");
    setSuccessMessage("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must be 5MB or less.");
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError("");
  }

  function removeImage() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");
  }



function scrollToReviewForm() {
  const section = document.getElementById("share-review");

  if (!section) return;

  const header =
    document.querySelector("header") ||
    document.querySelector('[role="banner"]');

  const headerHeight = header
    ? header.getBoundingClientRect().height
    : window.innerWidth < 640
      ? 72
      : 88;

  const extraSpacing = 20;

  const sectionTop =
    section.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: Math.max(0, sectionTop - headerHeight - extraSpacing),
    behavior: "smooth",
  });
}

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    const customerNameValue = cleanText(form.customer_name);
    const customerCityValue = cleanText(form.customer_city);
    const destinationValue = cleanText(form.destination);
    const reviewValue = cleanText(form.review);

    if (customerNameValue.length < 2) {
      setFormError("Please enter your name.");
      setSubmitting(false);
      return;
    }

    if (customerCityValue.length < 2) {
      setFormError("Please enter your city.");
      setSubmitting(false);
      return;
    }

    if (!destinationValue) {
      setFormError("Please select the place you visited.");
      setSubmitting(false);
      return;
    }

    if (reviewValue.length < 10) {
      setFormError("Please write at least 10 characters for your review.");
      setSubmitting(false);
      return;
    }

    try {
      /*
       * Keep the same backend payload structure.
       *
       * The public endpoint creates the review as DRAFT.
       * Admin must publish it before it becomes public.
       *
       * If your existing upload flow already converts the selected
       * image into { url, public_id }, keep using that existing
       * upload implementation here.
       */

      const payload = {
        customer_name: customerNameValue,
        customer_city: customerCityValue,
        destination: destinationValue,
        rating: Number(form.rating),
        review: reviewValue,
        image: image
          ? {
              url: imagePreview,
              public_id: null,
            }
          : null,
      };

      await createTestimonial(payload);

      setForm(INITIAL_FORM);
      removeImage();

      setSuccessMessage(
        "Thank you for your valuable response! Your review has been submitted for approval."
      );
    } catch (err) {
      console.error("Failed to submit review:", err);

      const detail =
        err?.response?.data?.detail;

      setFormError(
        typeof detail === "string"
          ? detail
          : "Unable to submit your review right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * JSON-LD
   * ---------------------------------------------------------
   */

  const structuredData = useMemo(() => {
    if (!review) {
      return null;
    }

    const reviewSchema = {
      "@type": "Review",
      "@id": `${canonicalUrl}#review`,
      url: canonicalUrl,
      name: `${customerName}'s ${destination} travel review`,
      author: {
        "@type": "Person",
        name: customerName,
      },
      reviewBody: reviewText,
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: {
        "@type": "Place",
        name: destination,
      },
    };

    if (createdDate) {
      reviewSchema.datePublished = review.created_at;
    }

    if (reviewImage) {
      reviewSchema.image = reviewImage;
    }

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: seoTitle,
          description: seoDescription,
          mainEntity: {
            "@id": `${canonicalUrl}#review`,
          },
          breadcrumb: {
            "@id": `${canonicalUrl}#breadcrumb`,
          },
        },
        reviewSchema,
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
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
              name: "Reviews",
              item: `${SITE_URL}/reviews`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `${customerName} – ${destination}`,
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }, [
    review,
    canonicalUrl,
    customerName,
    destination,
    reviewText,
    rating,
    createdDate,
    reviewImage,
    seoTitle,
    seoDescription,
  ]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-navy/10 border-t-orange" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading review...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * NOT FOUND
   * ---------------------------------------------------------
   */

  if (!review) {
    return (
      <>
        <Helmet>
          <title>Review Not Found | On a Trip Holiday</title>
          <meta
            name="robots"
            content="noindex,follow"
          />
        </Helmet>

        <main className="min-h-screen bg-surface">
          <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/5">
                <MapPin className="h-7 w-7 text-navy" />
              </div>

              <h1 className="mt-6 text-3xl font-bold text-navy">
                {error || "Review not found"}
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                This review may no longer be available or the
                link may be incorrect.
              </p>

              <Link
                to="/reviews"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 font-semibold text-white transition hover:bg-navy/90"
              >
                <ArrowLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Back to Reviews
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta
          name="description"
          content={seoDescription}
        />

        <meta
          name="robots"
          content="index,follow"
        />

        <link
          rel="canonical"
          href={canonicalUrl}
        />

        <meta
          property="og:type"
          content="article"
        />

        <meta
          property="og:title"
          content={seoTitle}
        />

        <meta
          property="og:description"
          content={seoDescription}
        />

        <meta
          property="og:url"
          content={canonicalUrl}
        />

        {reviewImage && (
          <meta
            property="og:image"
            content={reviewImage}
          />
        )}

        <meta
          name="twitter:card"
          content={reviewImage ? "summary_large_image" : "summary"}
        />

        <meta
          name="twitter:title"
          content={seoTitle}
        />

        <meta
          name="twitter:description"
          content={seoDescription}
        />

        {reviewImage && (
          <meta
            name="twitter:image"
            content={reviewImage}
          />
        )}

        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
      </Helmet>

      <main className="min-h-screen bg-surface">
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden bg-navy">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-[#03112D]" />

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              All Reviews
            </Link>

            <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_420px]">
              {/* Hero text */}

              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                  Traveller Review
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange">
                  <MapPin
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  <span>{destination}</span>
                </div>

                <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {customerName}'s experience in{" "}
                  {destination}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={rating}
                      size="large"
                    />

                    <span className="font-bold text-white">
                      {rating}/5
                    </span>
                  </div>

                  {customerCity && (
                    <>
                      <span className="hidden h-5 w-px bg-white/20 sm:block" />

                      <span className="text-sm text-white/70">
                        Traveller from {customerCity}
                      </span>
                    </>
                  )}

                  {createdDate && (
                    <>
                      <span className="hidden h-5 w-px bg-white/20 sm:block" />

                      <span className="text-sm text-white/60">
                        {createdDate}
                      </span>
                    </>
                  )}
                </div>

                <blockquote className="mt-7 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                  “{truncateText(reviewText, 260)}”
                </blockquote>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={scrollToReviewForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 font-bold text-white shadow-lg shadow-orange/20 transition hover:bg-orange/90 hover:shadow-xl"
                  >
                    Share Your Experience
                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Hero customer card */}

              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="overflow-hidden rounded-2xl bg-white">
                  {reviewImage ? (
                    <img
                      src={reviewImage}
                      alt={`${customerName}'s review of ${destination}`}
                      className="h-64 w-full object-cover sm:h-72"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-gradient-to-br from-navy to-[#0B2559] sm:h-72">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold text-navy shadow-xl">
                        {getInitials(customerName)}
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                        {getInitials(customerName)}
                      </div>

                      <div>
                        <p className="font-bold text-navy">
                          {customerName}
                        </p>

                        {customerCity && (
                          <p className="text-sm text-gray-500">
                            {customerCity}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500">
                        Rated their experience
                      </span>

                      <div className="flex items-center gap-1">
                        <StarRating rating={rating} />

                        <span className="ml-1 text-sm font-bold text-navy">
                          {rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FULL REVIEW
        ====================================================== */}

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-orange">
                  Full Review
                </p>

                <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
                  {customerName}'s travel experience
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={rating} />

                <span className="text-sm font-bold text-navy">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="mt-7 border-t border-navy/10 pt-7">
              <p className="whitespace-pre-line text-base leading-8 text-gray-700 sm:text-lg">
                {reviewText}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                {getInitials(customerName)}
              </div>

              <div>
                <p className="font-bold text-navy">
                  {customerName}
                </p>

                <p className="text-sm text-gray-500">
                  {customerCity
                    ? `${customerCity} · ${destination}`
                    : destination}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SHARE REVIEW FORM
        ====================================================== */}

        <section
            id="share-review"
            className="scroll-mt-0 bg-white py-14 sm:py-16 lg:py-20"
          >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              {/* Form intro */}

              <div className="lg:sticky lg:top-8">
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-orange">
                  Your Valuable Review
                </p>

                <h2 className="mt-2 text-3xl font-bold leading-tight text-navy sm:text-4xl">
                  Share your travel experience
                </h2>

                <p className="mt-4 leading-7 text-gray-600">
                  Your experience can help other travellers
                  discover their next destination with
                  confidence.
                </p>

                <div className="mt-7 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy">
                      <MapPin
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-navy">
                        Tell us where you travelled
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Select the place you visited and tell
                        us about your experience.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy">
                      <Star
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-navy">
                        Rate your experience
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Give a rating from 1 to 5 stars.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy">
                      <CheckCircle2
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-navy">
                        Help future travellers
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Reviews are checked before being
                        published.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}

              <div className="rounded-3xl border border-navy/10 bg-surface p-5 shadow-sm sm:p-7">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {successMessage && (
                    <div
                      role="status"
                      className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium leading-6 text-green-800"
                    >
                      {successMessage}
                    </div>
                  )}

                  {formError && (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="review-customer-name"
                        className="mb-2 block text-sm font-semibold text-navy"
                      >
                        Your Name
                      </label>

                      <div className="relative">
                        <UserRound
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />

                        <input
                          id="review-customer-name"
                          type="text"
                          value={form.customer_name}
                          onChange={(event) =>
                            updateForm(
                              "customer_name",
                              event.target.value
                            )
                          }
                          placeholder="Enter your name"
                          maxLength={100}
                          required
                          className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-4 text-sm text-navy outline-none transition placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="review-customer-city"
                        className="mb-2 block text-sm font-semibold text-navy"
                      >
                        Your City
                      </label>

                      <div className="relative">
                        <MapPin
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />

                        <input
                          id="review-customer-city"
                          type="text"
                          value={form.customer_city}
                          onChange={(event) =>
                            updateForm(
                              "customer_city",
                              event.target.value
                            )
                          }
                          placeholder="Enter your city"
                          maxLength={100}
                          required
                          className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-4 text-sm text-navy outline-none transition placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-destination"
                      className="mb-2 block text-sm font-semibold text-navy"
                    >
                      Place Visited
                    </label>

                    <div className="relative">
                      <MapPin
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />

                      <select
                        id="review-destination"
                        value={form.destination}
                        onChange={(event) =>
                          updateForm(
                            "destination",
                            event.target.value
                          )
                        }
                        required
                        disabled={loadingDestinations}
                        className="w-full appearance-none rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-10 text-sm text-navy outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {loadingDestinations
                            ? "Loading destinations..."
                            : "Select the place you visited"}
                        </option>

                        {destinations.map((place) => (
                          <option
                            key={place}
                            value={place}
                          >
                            {place}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-navy">
                      Your Rating
                    </span>

                    <div className="rounded-xl border border-navy/10 bg-white px-4 py-3">
                      <FormStarRating
                        value={Number(form.rating)}
                        onChange={(value) =>
                          updateForm("rating", value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-message"
                      className="mb-2 block text-sm font-semibold text-navy"
                    >
                      Your Review
                    </label>

                    <textarea
                      id="review-message"
                      value={form.review}
                      onChange={(event) =>
                        updateForm(
                          "review",
                          event.target.value
                        )
                      }
                      placeholder="Tell us about your travel experience..."
                      rows={7}
                      minLength={10}
                      maxLength={3000}
                      required
                      className="w-full resize-y rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm leading-6 text-navy outline-none transition placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/10"
                    />

                    <div className="mt-1 flex justify-end text-xs text-gray-400">
                      {form.review.length}/3000
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-navy">
                      Add a Photo{" "}
                      <span className="font-normal text-gray-400">
                        (optional)
                      </span>
                    </span>

                    {!imagePreview ? (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy/10 bg-white px-5 py-8 text-center transition hover:border-orange/40 hover:bg-orange/5">
                        <ImageIcon
                          className="h-7 w-7 text-gray-400"
                          aria-hidden="true"
                        />

                        <span className="mt-2 text-sm font-semibold text-navy">
                          Choose a travel photo
                        </span>

                        <span className="mt-1 text-xs text-gray-400">
                          JPG, PNG, WEBP · Maximum 5MB
                        </span>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl border border-navy/10 bg-white p-3">
                        <img
                          src={imagePreview}
                          alt="Selected review"
                          className="h-48 w-full rounded-lg object-cover"
                        />

                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                          aria-label="Remove selected image"
                        >
                          <X
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-bold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Your Review
                        <Send
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-gray-500">
                    Your review will be checked by our team
                    before it appears publicly.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MORE REVIEWS
        ====================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-orange">
                Traveller Stories
              </p>

              <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
                More Traveller Reviews
              </h2>

              <p className="mt-2 max-w-2xl text-gray-600">
                Discover experiences shared by other travellers
                who explored destinations with On a Trip Holiday.
              </p>
            </div>

            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 text-sm font-bold text-navy transition hover:text-orange"
            >
              View All Reviews
              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>

          {loadingRelated ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : relatedReviews.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedReviews.map((item) => (
                <RelatedReviewCard
                  key={item.id || item.slug}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-8 text-center">
              <p className="text-gray-600">
                More traveller reviews will appear here as they
                are published.
              </p>
            </div>
          )}
        </section>

        {/* =====================================================
            FAQ
        ====================================================== */}

        <FAQSection />

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <Footer />
      </main>
    </>
  );
}



































