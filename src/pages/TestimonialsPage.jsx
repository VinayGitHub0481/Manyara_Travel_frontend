




import { useEffect, useState } from "react";
import {
  Star,
  Quote,
  MessageSquareHeart,
  ArrowLeft,
  Send,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getTestimonials,
  createTestimonial,
  getMostVisited,
} from "../api/content";

import ImageUploadField from "../components/admin/ImageUploadField";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";

/* =========================================================
   HELPERS
========================================================= */

function getSafeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
}

function getDestinationName(item) {
  return (
    item?.place_name ||
    item?.destination ||
    item?.name ||
    item?.title ||
    ""
  )
    .toString()
    .trim();
}

/* =========================================================
   STAR DISPLAY
========================================================= */

function Stars({ rating }) {
  const safeRating = Math.min(
    5,
    Math.max(0, Number(rating) || 0)
  );

  return (
    <div
      className="flex gap-1 text-accent"
      aria-label={`${safeRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-4 h-4"
          fill={i <= safeRating ? "currentColor" : "none"}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/* =========================================================
   TESTIMONIAL CARD
========================================================= */

function TestimonialCard({ item }) {
  const initials =
    item?.customer_name
      ?.trim()
      ?.split(/\s+/)
      ?.map((name) => name[0])
      ?.slice(0, 2)
      ?.join("")
      ?.toUpperCase() || "TR";

  const hasSlug =
    typeof item?.slug === "string" &&
    item.slug.trim().length > 0;

  return (
    <article className="relative bg-white rounded-2xl border border-navy/10 p-6 flex flex-col gap-4 h-full transition hover:-translate-y-0.5 hover:shadow-md">
      <Quote
        className="absolute top-5 right-5 w-8 h-8 text-surface"
        aria-hidden="true"
      />

      <Stars rating={item?.rating} />

      <p className="text-navy/75 text-sm leading-relaxed flex-1">
        “{item?.review}”
      </p>

      <div className="flex items-center gap-3 pt-3 border-t border-navy/10">
        {item?.image?.url ? (
          <img
            src={item.image.url}
            alt={`${item?.customer_name || "Traveller"} profile`}
            loading="lazy"
            decoding="async"
            className="w-11 h-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-11 h-11 shrink-0 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-semibold"
            aria-hidden="true"
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy text-sm truncate">
            {item?.customer_name}
          </p>

          <p className="text-xs text-navy/55 mt-0.5 truncate">
            {item?.customer_city}

            {item?.destination && (
              <>
                <span className="mx-1">·</span>
                {item.destination}
              </>
            )}
          </p>
        </div>
      </div>

      {hasSlug ? (
        <Link
          to={`/reviews/${encodeURIComponent(item.slug)}`}
          className="mt-1 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-navy/10 bg-surface px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition"
          aria-label={`Read full review from ${
            item?.customer_name || "traveller"
          }`}
        >
          Read Full Review

          <ArrowRight
            className="w-4 h-4"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span className="mt-1 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-navy/10 bg-surface px-4 py-2.5 text-sm font-semibold text-navy/50">
          Review Details
        </span>
      )}
    </article>
  );
}

/* =========================================================
   REVIEW FORM
========================================================= */

function ReviewForm({ onSubmitted }) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_city: "",
    destination: "",
    rating: 5,
    review: "",
  });

  const [image, setImage] = useState(null);

  const [destinations, setDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] =
    useState(true);
  const [destinationsError, setDestinationsError] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* =======================================================
     LOAD AVAILABLE DESTINATIONS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadDestinations = async () => {
      try {
        setDestinationsLoading(true);
        setDestinationsError("");

        const data = await getMostVisited();

        if (!mounted) {
          return;
        }

        const items = getSafeArray(data);

        const validDestinations = items
          .map((item) => ({
            ...item,
            displayName: getDestinationName(item),
          }))
          .filter((item) => item.displayName);

        const uniqueDestinations = Array.from(
          new Map(
            validDestinations.map((item) => [
              item.displayName.toLowerCase(),
              item,
            ])
          ).values()
        );

        uniqueDestinations.sort(
          (a, b) =>
            Number(a?.display_order ?? 0) -
            Number(b?.display_order ?? 0)
        );

        setDestinations(uniqueDestinations);
      } catch (err) {
        console.error(
          "Failed to load destinations:",
          err
        );

        if (!mounted) {
          return;
        }

        setDestinations([]);
        setDestinationsError(
          "Unable to load available destinations. Please try again."
        );
      } finally {
        if (mounted) {
          setDestinationsLoading(false);
        }
      }
    };

    loadDestinations();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  /* =======================================================
     RATING
  ======================================================= */

  const handleRating = (rating) => {
    setForm((prev) => ({
      ...prev,
      rating,
    }));

    setError("");
  };

  /* =======================================================
     SUBMIT REVIEW
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSuccess(false);

    if (!form.customer_name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.customer_city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!form.destination.trim()) {
      setError("Please select the place you visited.");
      return;
    }

    if (form.review.trim().length < 10) {
      setError(
        "Please write at least 10 characters for your review."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_city: form.customer_city.trim(),
        destination: form.destination.trim(),
        rating: Number(form.rating),
        review: form.review.trim(),
        image: image || null,
      };

      await createTestimonial(payload);

      setSuccess(true);

      setForm({
        customer_name: "",
        customer_city: "",
        destination: "",
        rating: 5,
        review: "",
      });

      setImage(null);

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      console.error(
        "Failed to submit testimonial:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     SUCCESS STATE
  ======================================================= */

  if (success) {
    return (
      <section
        id="share-review"
        className="scroll-mt-28"
      >
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8 lg:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center">
            <CheckCircle2
              className="w-9 h-9 text-green-600"
              aria-hidden="true"
            />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mt-6">
            Thank You!
          </h2>

          <p className="text-navy/75 text-base font-medium mt-3">
            Thank you for your valuable response!
          </p>

          <p className="text-navy/60 text-sm leading-relaxed mt-3 max-w-xl mx-auto">
            Your review has been submitted successfully.
            Our team will review your response before
            publishing it on our website.
          </p>

          <div className="mt-5 max-w-sm mx-auto rounded-xl bg-white border border-navy/10 px-4 py-3">
            <p className="text-xs text-navy/50">
              Review status
            </p>

            <p className="text-sm font-semibold text-navy mt-1">
              Pending approval
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-7 py-3 font-semibold hover:bg-accent-hover transition"
          >
            <MessageSquareHeart
              className="w-4 h-4"
              aria-hidden="true"
            />

            Write Another Review
          </button>
        </div>
      </section>
    );
  }

  /* =======================================================
     REVIEW FORM
  ======================================================= */

  return (
    <section
      id="share-review"
       className="scroll-mt-24 bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]
          gap-8
          lg:gap-10
          items-start
          w-full
        "
      >
        {/* =================================================
            FORM INTRO
        ================================================= */}

        <div className="w-full min-w-0">
          <p className="text-accent font-semibold text-xs uppercase tracking-wide">
            Share your experience
          </p>

          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy mt-2 leading-tight">
            Your Valuable Review
          </h2>

          <p className="text-navy/65 text-sm sm:text-base leading-7 mt-4 max-w-lg">
            Tell future travellers about your
            experience with On a Trip Holidays.
          </p>

          <div className="mt-7 space-y-5">
            {/* EXPERIENCE */}

            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <MessageSquareHeart
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm">
                  Share your experience
                </p>

                <p className="text-xs text-navy/55 leading-5 mt-1">
                  Tell us what made your trip memorable.
                </p>
              </div>
            </div>

            {/* RATING */}

            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <Star
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm">
                  Rate your experience
                </p>

                <p className="text-xs text-navy/55 leading-5 mt-1">
                  Give your honest rating from 1 to 5 stars.
                </p>
              </div>
            </div>

            {/* APPROVAL */}

            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <CheckCircle2
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm">
                  Pending approval
                </p>

                <p className="text-xs text-navy/55 leading-5 mt-1">
                  Reviews are checked before appearing publicly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <div className="w-full min-w-0 rounded-3xl border border-navy/10 bg-white p-5 sm:p-7 lg:p-8 shadow-sm">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* NAME */}

            <div>
              <label
                htmlFor="customer_name"
                className="block text-sm font-medium text-navy mb-1.5"
              >
                Your Name
              </label>

              <input
                id="customer_name"
                name="customer_name"
                type="text"
                value={form.customer_name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                placeholder="Enter your name"
                autoComplete="name"
                disabled={submitting}
                className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
              />
            </div>

            {/* CITY */}

            <div>
              <label
                htmlFor="customer_city"
                className="block text-sm font-medium text-navy mb-1.5"
              >
                Your City
              </label>

              <input
                id="customer_city"
                name="customer_city"
                type="text"
                value={form.customer_city}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Hyderabad"
                autoComplete="address-level2"
                disabled={submitting}
                className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
              />
            </div>

            {/* DESTINATION */}

            <div>
              <label
                htmlFor="destination"
                className="block text-sm font-medium text-navy mb-1.5"
              >
                Place Visited
              </label>

              <select
                id="destination"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                required
                disabled={
                  submitting || destinationsLoading
                }
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
              >
                <option value="">
                  {destinationsLoading
                    ? "Loading destinations..."
                    : "Select the place you visited"}
                </option>

                {!destinationsLoading &&
                  destinations.map((destination) => (
                    <option
                      key={
                        destination?.id ||
                        destination?.slug ||
                        destination?.displayName
                      }
                      value={destination.displayName}
                    >
                      {destination.displayName}
                    </option>
                  ))}
              </select>

              {destinationsError ? (
                <p className="text-xs text-red-600 mt-1.5">
                  {destinationsError}
                </p>
              ) : destinations.length === 0 &&
                !destinationsLoading ? (
                <p className="text-xs text-navy/50 mt-1.5">
                  No destinations are currently available.
                </p>
              ) : (
                <p className="text-xs text-navy/50 mt-1.5">
                  Select the destination you actually visited.
                </p>
              )}
            </div>

            {/* RATING */}

            <div>
              <p className="block text-sm font-medium text-navy mb-2">
                Your Rating
              </p>

              <div
                className="flex gap-2"
                role="radiogroup"
                aria-label="Choose your rating"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRating(rating)}
                    disabled={submitting}
                    className="p-1 rounded-lg hover:bg-surface transition disabled:cursor-not-allowed"
                    aria-label={`Give ${rating} star${
                      rating > 1 ? "s" : ""
                    }`}
                    aria-pressed={
                      form.rating === rating
                    }
                  >
                    <Star
                      className={`w-7 h-7 ${
                        rating <= form.rating
                          ? "text-accent"
                          : "text-navy/20"
                      }`}
                      fill={
                        rating <= form.rating
                          ? "currentColor"
                          : "none"
                      }
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs text-navy/50 mt-1">
                {form.rating} out of 5 stars
              </p>
            </div>

            {/* REVIEW */}

            <div>
              <label
                htmlFor="review"
                className="block text-sm font-medium text-navy mb-1.5"
              >
                Your Review
              </label>

              <textarea
                id="review"
                name="review"
                value={form.review}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={3000}
                rows={7}
                placeholder="Tell us about your travel experience..."
                disabled={submitting}
                className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none resize-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
              />

              <div className="flex justify-end mt-1">
                <span className="text-xs text-navy/40">
                  {form.review.length}/3000
                </span>
              </div>
            </div>

            {/* PHOTO */}

            <div className="rounded-2xl border border-navy/10 bg-surface/30 p-4 sm:p-5">
              <ImageUploadField
                value={image}
                onChange={setImage}
                label="Your Photo (Optional)"
              />

              <p className="text-xs text-navy/50 mt-2">
                You can share a photo from your trip,
                but this is completely optional.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                submitting ||
                destinationsLoading ||
                destinations.length === 0
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send
                className="w-4 h-4"
                aria-hidden="true"
              />

              {submitting
                ? "Submitting..."
                : "Submit Your Review"}
            </button>

            <p className="text-xs text-center text-navy/50">
              Your review will be published after our
              team reviews it.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TESTIMONIALS PAGE
========================================================= */

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTestimonials = async () => {
    try {
      setLoading(true);

      const data = await getTestimonials();

      setTestimonials(
        Array.isArray(data)
          ? data
          : getSafeArray(data)
      );
    } catch (err) {
      console.error(
        "Failed to load testimonials:",
        err
      );

      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  /* =======================================================
     SCROLL TO REVIEW FORM
  ======================================================= */

function scrollToReviewForm() {
  const section = document.getElementById("share-review");

  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}


  return (
    <>
      <main className="bg-surface min-h-screen w-full overflow-visible">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="bg-white border-b border-navy/10">
          <div
            className="
              max-w-6xl
              mx-auto
              px-4
              py-6
              sm:px-6
              sm:py-8
              lg:px-8
              lg:py-10
            "
          >
            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                text-navy/60
                hover:text-navy
                transition
                mb-5
              "
            >
              <ArrowLeft
                className="w-4 h-4"
                aria-hidden="true"
              />

              Back to Home
            </Link>

            <div className="max-w-3xl">
              <p
                className="
                  flex
                  items-center
                  gap-2
                  text-accent
                  font-semibold
                  text-xs
                  uppercase
                  tracking-wide
                "
              >
                <MessageSquareHeart
                  className="w-4 h-4"
                  aria-hidden="true"
                />

                Real trips, real words
              </p>

              <h1
                className="
                  font-display
                  text-2xl
                  sm:text-3xl
                  lg:text-4xl
                  font-semibold
                  leading-tight
                  text-navy
                  mt-1
                "
              >
                What Travellers Say
              </h1>

              <p
                className="
                  text-navy/60
                  mt-2
                  text-sm
                  sm:text-base
                  leading-6
                  max-w-2xl
                "
              >
                Discover genuine experiences shared
                by travellers who explored the world
                with On a Trip Holidays.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            REVIEWS
        ================================================= */}

        <section
          className="
            max-w-6xl
            mx-auto
            px-4
            py-8
            sm:px-6
            lg:px-8
            lg:py-12
          "
        >
          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-end
              sm:justify-between
              gap-4
              mb-6
            "
          >
            <div>
              <p className="text-accent font-semibold text-xs uppercase tracking-wide">
                Traveller experiences
              </p>

              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mt-1">
                Reviews from our travellers
              </h2>
            </div>

            <button
              type="button"
              onClick={scrollToReviewForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition shrink-0"
            >
              <MessageSquareHeart
                className="w-4 h-4"
                aria-hidden="true"
              />

              Your Valuable Review
            </button>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white animate-pulse border border-navy/10"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="bg-white rounded-2xl border border-navy/10 p-8 sm:p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquareHeart
                  className="w-7 h-7 text-accent"
                  aria-hidden="true"
                />
              </div>

              <h3 className="font-display text-xl font-semibold text-navy mt-5">
                Be the first to share your experience
              </h3>

              <p className="text-sm text-navy/60 mt-2 mb-6 max-w-md mx-auto">
                Your experience can help other
                travellers plan their next journey.
              </p>

              <button
                type="button"
                onClick={scrollToReviewForm}
                className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition"
              >
                <MessageSquareHeart
                  className="w-4 h-4"
                  aria-hidden="true"
                />

                Write a Review
              </button>
            </div>
          ) : (
            /* =================================================
               TESTIMONIAL GRID
            ================================================= */

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={
                    testimonial?.id ||
                    testimonial?.slug ||
                    testimonial?.customer_name
                  }
                  item={testimonial}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            YOUR VALUABLE REVIEW
        ================================================= */}

        <section className="bg-white border-y border-navy/10 w-full">
          <div
            className="
              max-w-6xl
              mx-auto
              px-4
              py-12
              sm:px-6
              sm:py-14
              lg:px-8
              lg:py-16
              w-full
            "
          >
            <ReviewForm
              onSubmitted={loadTestimonials}
            />
          </div>
        </section>
      </main>

      {/* ===================================================
          FAQ
      =================================================== */}

      <FAQSection />

      {/* ===================================================
          FOOTER
      =================================================== */}

      <Footer />
    </>
  );
}







































// import { useEffect, useState } from "react";
// import {
//   Star,
//   Quote,
//   MessageSquareHeart,
//   ArrowLeft,
//   Send,
//   CheckCircle2,
//   ArrowRight,
// } from "lucide-react";
// import { Link } from "react-router-dom";

// import {
//   getTestimonials,
//   createTestimonial,
//   getMostVisited,
// } from "../api/content";

// import ImageUploadField from "../components/admin/ImageUploadField";
// import Footer from "../components/Footer";
// import FAQSection from "../components/FAQSection";

// /* =========================================================
//    HELPERS
// ========================================================= */

// function getSafeArray(value) {
//   if (Array.isArray(value)) {
//     return value;
//   }

//   if (Array.isArray(value?.items)) {
//     return value.items;
//   }

//   if (Array.isArray(value?.data)) {
//     return value.data;
//   }

//   if (Array.isArray(value?.results)) {
//     return value.results;
//   }

//   return [];
// }

// function getDestinationName(item) {
//   return (
//     item?.place_name ||
//     item?.destination ||
//     item?.name ||
//     item?.title ||
//     ""
//   )
//     .toString()
//     .trim();
// }

// /* =========================================================
//    STAR DISPLAY
// ========================================================= */

// function Stars({ rating }) {
//   const safeRating = Math.min(
//     5,
//     Math.max(0, Number(rating) || 0)
//   );

//   return (
//     <div
//       className="flex gap-1 text-accent"
//       aria-label={`${safeRating} out of 5 stars`}
//     >
//       {[1, 2, 3, 4, 5].map((i) => (
//         <Star
//           key={i}
//           className="w-4 h-4"
//           fill={
//             i <= safeRating
//               ? "currentColor"
//               : "none"
//           }
//           strokeWidth={1.5}
//           aria-hidden="true"
//         />
//       ))}
//     </div>
//   );
// }

// /* =========================================================
//    TESTIMONIAL CARD
// ========================================================= */

// function TestimonialCard({ item }) {
//   const initials =
//     item?.customer_name
//       ?.trim()
//       ?.split(/\s+/)
//       ?.map((name) => name[0])
//       ?.slice(0, 2)
//       ?.join("")
//       ?.toUpperCase() || "TR";

//   const hasSlug =
//     typeof item?.slug === "string" &&
//     item.slug.trim().length > 0;

//   return (
//     <article className="relative bg-white rounded-2xl border border-navy/10 p-6 flex flex-col gap-4 h-full transition hover:-translate-y-0.5 hover:shadow-md">
//       <Quote
//         className="absolute top-5 right-5 w-8 h-8 text-surface"
//         aria-hidden="true"
//       />

//       <Stars rating={item?.rating} />

//       <p className="text-navy/75 text-sm leading-relaxed flex-1">
//         “{item?.review}”
//       </p>

//       <div className="flex items-center gap-3 pt-3 border-t border-navy/10">
//         {item?.image?.url ? (
//           <img
//             src={item.image.url}
//             alt={`${item?.customer_name || "Traveller"} profile`}
//             loading="lazy"
//             decoding="async"
//             className="w-11 h-11 rounded-full object-cover"
//           />
//         ) : (
//           <div
//             className="w-11 h-11 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-semibold"
//             aria-hidden="true"
//           >
//             {initials}
//           </div>
//         )}

//         <div className="min-w-0 flex-1">
//           <p className="font-semibold text-navy text-sm truncate">
//             {item?.customer_name}
//           </p>

//           <p className="text-xs text-navy/55 mt-0.5 truncate">
//             {item?.customer_city}

//             {item?.destination && (
//               <>
//                 <span className="mx-1">·</span>
//                 {item.destination}
//               </>
//             )}
//           </p>
//         </div>
//       </div>

//       {hasSlug ? (
//         <Link
//           to={`/reviews/${encodeURIComponent(item.slug)}`}
//           className="mt-1 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-navy/10 bg-surface px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition"
//           aria-label={`Read full review from ${
//             item?.customer_name || "traveller"
//           }`}
//         >
//           Read Full Review

//           <ArrowRight
//             className="w-4 h-4"
//             aria-hidden="true"
//           />
//         </Link>
//       ) : (
//         <span className="mt-1 inline-flex items-center justify-center gap-2 w-full rounded-xl border border-navy/10 bg-surface px-4 py-2.5 text-sm font-semibold text-navy/50">
//           Review Details
//         </span>
//       )}
//     </article>
//   );
// }

// /* =========================================================
//    REVIEW FORM
//    INLINE SECTION — NOT MODAL
// ========================================================= */

// function ReviewForm({ onSubmitted }) {
//   const [form, setForm] = useState({
//     customer_name: "",
//     customer_city: "",
//     destination: "",
//     rating: 5,
//     review: "",
//   });

//   const [image, setImage] = useState(null);

//   const [destinations, setDestinations] = useState([]);
//   const [destinationsLoading, setDestinationsLoading] =
//     useState(true);
//   const [destinationsError, setDestinationsError] =
//     useState("");

//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);

//   /* =======================================================
//      LOAD AVAILABLE DESTINATIONS
//   ======================================================= */

//   useEffect(() => {
//     let mounted = true;

//     const loadDestinations = async () => {
//       try {
//         setDestinationsLoading(true);
//         setDestinationsError("");

//         const data = await getMostVisited();

//         if (!mounted) {
//           return;
//         }

//         const items = getSafeArray(data);

//         const validDestinations = items
//           .map((item) => ({
//             ...item,
//             displayName: getDestinationName(item),
//           }))
//           .filter((item) => item.displayName);

//         const uniqueDestinations = Array.from(
//           new Map(
//             validDestinations.map((item) => [
//               item.displayName.toLowerCase(),
//               item,
//             ])
//           ).values()
//         );

//         uniqueDestinations.sort(
//           (a, b) =>
//             Number(a?.display_order ?? 0) -
//             Number(b?.display_order ?? 0)
//         );

//         setDestinations(uniqueDestinations);
//       } catch (err) {
//         console.error(
//           "Failed to load destinations:",
//           err
//         );

//         if (!mounted) {
//           return;
//         }

//         setDestinations([]);
//         setDestinationsError(
//           "Unable to load available destinations. Please try again."
//         );
//       } finally {
//         if (mounted) {
//           setDestinationsLoading(false);
//         }
//       }
//     };

//     loadDestinations();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   /* =======================================================
//      INPUT CHANGE
//   ======================================================= */

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     setError("");
//   };

//   /* =======================================================
//      RATING
//   ======================================================= */

//   const handleRating = (rating) => {
//     setForm((prev) => ({
//       ...prev,
//       rating,
//     }));

//     setError("");
//   };

//   /* =======================================================
//      SUBMIT REVIEW
//   ======================================================= */

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setError("");
//     setSuccess(false);

//     if (!form.customer_name.trim()) {
//       setError("Please enter your name.");
//       return;
//     }

//     if (!form.customer_city.trim()) {
//       setError("Please enter your city.");
//       return;
//     }

//     if (!form.destination.trim()) {
//       setError(
//         "Please select the place you visited."
//       );
//       return;
//     }

//     if (form.review.trim().length < 10) {
//       setError(
//         "Please write at least 10 characters for your review."
//       );
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const payload = {
//         customer_name:
//           form.customer_name.trim(),

//         customer_city:
//           form.customer_city.trim(),

//         destination:
//           form.destination.trim(),

//         rating: Number(form.rating),

//         review:
//           form.review.trim(),

//         /*
//          * ImageUploadField already returns the
//          * Cloudinary image object.
//          */
//         image: image || null,
//       };

//       await createTestimonial(payload);

//       setSuccess(true);

//       setForm({
//         customer_name: "",
//         customer_city: "",
//         destination: "",
//         rating: 5,
//         review: "",
//       });

//       setImage(null);

//       if (onSubmitted) {
//         onSubmitted();
//       }
//     } catch (err) {
//       console.error(
//         "Failed to submit testimonial:",
//         err
//       );

//       setError(
//         err?.response?.data?.detail ||
//           "Unable to submit your review. Please try again."
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   /* =======================================================
//      SUCCESS STATE
//   ======================================================= */

//   if (success) {
//     return (
//       <section
//         id="share-review"
//         className="scroll-mt-24"
//       >
//         <div className="rounded-3xl border border-green-200 bg-green-50 p-8 sm:p-10 text-center">
//           <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center">
//             <CheckCircle2
//               className="w-9 h-9 text-green-600"
//               aria-hidden="true"
//             />
//           </div>

//           <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mt-6">
//             Thank You!
//           </h2>

//           <p className="text-navy/75 text-base font-medium mt-3">
//             Thank you for your valuable response!
//           </p>

//           <p className="text-navy/60 text-sm leading-relaxed mt-3 max-w-xl mx-auto">
//             Your review has been submitted successfully.
//             Our team will review your response before
//             publishing it on our website.
//           </p>

//           <div className="mt-5 max-w-sm mx-auto rounded-xl bg-white border border-navy/10 px-4 py-3">
//             <p className="text-xs text-navy/50">
//               Review status
//             </p>

//             <p className="text-sm font-semibold text-navy mt-1">
//               Pending approval
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={() => setSuccess(false)}
//             className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-7 py-3 font-semibold hover:bg-accent-hover transition"
//           >
//             <MessageSquareHeart
//               className="w-4 h-4"
//               aria-hidden="true"
//             />

//             Write Another Review
//           </button>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section
//       id="share-review"
//       className="scroll-mt-8"
//     >
//       <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
//         {/* =================================================
//             FORM INTRO
//         ================================================= */}

//         <div className="lg:sticky lg:top-8">
//           <p className="text-accent font-semibold text-xs uppercase tracking-wide">
//             Share your experience
//           </p>

//           <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy mt-2 leading-tight">
//             Your Valuable Review
//           </h2>

//           <p className="text-navy/65 text-sm sm:text-base leading-7 mt-4">
//             Tell future travellers about your
//             experience with On a Trip Holidays.
//           </p>

//           <div className="mt-7 space-y-4">
//             <div className="flex gap-3">
//               <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
//                 <MessageSquareHeart
//                   className="w-4 h-4"
//                   aria-hidden="true"
//                 />
//               </div>

//               <div>
//                 <p className="font-semibold text-navy text-sm">
//                   Share your experience
//                 </p>

//                 <p className="text-xs text-navy/55 leading-5 mt-1">
//                   Tell us what made your trip memorable.
//                 </p>
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
//                 <Star
//                   className="w-4 h-4"
//                   aria-hidden="true"
//                 />
//               </div>

//               <div>
//                 <p className="font-semibold text-navy text-sm">
//                   Rate your experience
//                 </p>

//                 <p className="text-xs text-navy/55 leading-5 mt-1">
//                   Give your honest rating from 1 to 5 stars.
//                 </p>
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
//                 <CheckCircle2
//                   className="w-4 h-4"
//                   aria-hidden="true"
//                 />
//               </div>

//               <div>
//                 <p className="font-semibold text-navy text-sm">
//                   Pending approval
//                 </p>

//                 <p className="text-xs text-navy/55 leading-5 mt-1">
//                   Reviews are checked before appearing publicly.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* =================================================
//             FORM
//         ================================================= */}

//         <div className="rounded-3xl border border-navy/10 bg-white p-6 sm:p-8 shadow-sm">
//           <form
//             onSubmit={handleSubmit}
//             className="space-y-5"
//           >
//             {/* NAME */}

//             <div>
//               <label
//                 htmlFor="customer_name"
//                 className="block text-sm font-medium text-navy mb-1.5"
//               >
//                 Your Name
//               </label>

//               <input
//                 id="customer_name"
//                 name="customer_name"
//                 type="text"
//                 value={form.customer_name}
//                 onChange={handleChange}
//                 required
//                 minLength={2}
//                 maxLength={100}
//                 placeholder="Enter your name"
//                 autoComplete="name"
//                 disabled={submitting}
//                 className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
//               />
//             </div>

//             {/* CITY */}

//             <div>
//               <label
//                 htmlFor="customer_city"
//                 className="block text-sm font-medium text-navy mb-1.5"
//               >
//                 Your City
//               </label>

//               <input
//                 id="customer_city"
//                 name="customer_city"
//                 type="text"
//                 value={form.customer_city}
//                 onChange={handleChange}
//                 required
//                 minLength={2}
//                 maxLength={100}
//                 placeholder="e.g. Hyderabad"
//                 autoComplete="address-level2"
//                 disabled={submitting}
//                 className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
//               />
//             </div>

//             {/* PLACE VISITED */}

//             <div>
//               <label
//                 htmlFor="destination"
//                 className="block text-sm font-medium text-navy mb-1.5"
//               >
//                 Place Visited
//               </label>

//               <select
//                 id="destination"
//                 name="destination"
//                 value={form.destination}
//                 onChange={handleChange}
//                 required
//                 disabled={
//                   submitting ||
//                   destinationsLoading
//                 }
//                 className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
//               >
//                 <option value="">
//                   {destinationsLoading
//                     ? "Loading destinations..."
//                     : "Select the place you visited"}
//                 </option>

//                 {!destinationsLoading &&
//                   destinations.map((destination) => (
//                     <option
//                       key={
//                         destination?.id ||
//                         destination?.slug ||
//                         destination?.displayName
//                       }
//                       value={destination.displayName}
//                     >
//                       {destination.displayName}
//                     </option>
//                   ))}
//               </select>

//               {destinationsError ? (
//                 <p className="text-xs text-red-600 mt-1.5">
//                   {destinationsError}
//                 </p>
//               ) : destinations.length === 0 &&
//                 !destinationsLoading ? (
//                 <p className="text-xs text-navy/50 mt-1.5">
//                   No destinations are currently available.
//                 </p>
//               ) : (
//                 <p className="text-xs text-navy/50 mt-1.5">
//                   Select the destination you actually visited.
//                 </p>
//               )}
//             </div>

//             {/* RATING */}

//             <div>
//               <p className="block text-sm font-medium text-navy mb-2">
//                 Your Rating
//               </p>

//               <div
//                 className="flex gap-2"
//                 role="radiogroup"
//                 aria-label="Choose your rating"
//               >
//                 {[1, 2, 3, 4, 5].map((rating) => (
//                   <button
//                     key={rating}
//                     type="button"
//                     onClick={() =>
//                       handleRating(rating)
//                     }
//                     disabled={submitting}
//                     className="p-1 rounded-lg hover:bg-surface transition disabled:cursor-not-allowed"
//                     aria-label={`Give ${rating} star${
//                       rating > 1 ? "s" : ""
//                     }`}
//                     aria-pressed={
//                       form.rating === rating
//                     }
//                   >
//                     <Star
//                       className={`w-7 h-7 ${
//                         rating <= form.rating
//                           ? "text-accent"
//                           : "text-navy/20"
//                       }`}
//                       fill={
//                         rating <= form.rating
//                           ? "currentColor"
//                           : "none"
//                       }
//                       strokeWidth={1.5}
//                     />
//                   </button>
//                 ))}
//               </div>

//               <p className="text-xs text-navy/50 mt-1">
//                 {form.rating} out of 5 stars
//               </p>
//             </div>

//             {/* REVIEW */}

//             <div>
//               <label
//                 htmlFor="review"
//                 className="block text-sm font-medium text-navy mb-1.5"
//               >
//                 Your Review
//               </label>

//               <textarea
//                 id="review"
//                 name="review"
//                 value={form.review}
//                 onChange={handleChange}
//                 required
//                 minLength={10}
//                 maxLength={3000}
//                 rows={7}
//                 placeholder="Tell us about your travel experience..."
//                 disabled={submitting}
//                 className="w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none resize-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-surface disabled:cursor-not-allowed"
//               />

//               <div className="flex justify-end mt-1">
//                 <span className="text-xs text-navy/40">
//                   {form.review.length}/3000
//                 </span>
//               </div>
//             </div>

//             {/* PHOTO */}

//             <div className="rounded-2xl border border-navy/10 bg-surface/30 p-4 sm:p-5">
//               <ImageUploadField
//                 value={image}
//                 onChange={setImage}
//                 label="Your Photo (Optional)"
//               />

//               <p className="text-xs text-navy/50 mt-2">
//                 You can share a photo from your trip,
//                 but this is completely optional.
//               </p>
//             </div>

//             {/* ERROR */}

//             {error && (
//               <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
//                 <p className="text-sm text-red-700">
//                   {error}
//                 </p>
//               </div>
//             )}

//             {/* SUBMIT */}

//             <button
//               type="submit"
//               disabled={
//                 submitting ||
//                 destinationsLoading ||
//                 destinations.length === 0
//               }
//               className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               <Send
//                 className="w-4 h-4"
//                 aria-hidden="true"
//               />

//               {submitting
//                 ? "Submitting..."
//                 : "Submit Your Review"}
//             </button>

//             <p className="text-xs text-center text-navy/50">
//               Your review will be published after our
//               team reviews it.
//             </p>
//           </form>
//         </div>
//       </div>
//     </section>
//   );
// }

// /* =========================================================
//    TESTIMONIALS PAGE
// ========================================================= */

// export default function TestimonialsPage() {
//   const [testimonials, setTestimonials] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const loadTestimonials = async () => {
//     try {
//       setLoading(true);

//       const data = await getTestimonials();

//       setTestimonials(
//         Array.isArray(data)
//           ? data
//           : getSafeArray(data)
//       );
//     } catch (err) {
//       console.error(
//         "Failed to load testimonials:",
//         err
//       );

//       setTestimonials([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadTestimonials();
//   }, []);

// const scrollToReviewForm = () => {
//   const section = document.getElementById("share-review");

//   if (!section) {
//     return;
//   }

//   const headerOffset = 110;

//   const sectionTop =
//     section.getBoundingClientRect().top + window.scrollY;

//   window.scrollTo({
//     top: Math.max(0, sectionTop - headerOffset),
//     behavior: "smooth",
//   });
// };

//  // const headerOffset = 90;

// //   const sectionTop =
// //     section.getBoundingClientRect().top +
// //     window.scrollY -
// //     headerOffset;

// //   window.scrollTo({
// //     top: Math.max(0, sectionTop),
// //     behavior: "smooth",
// //   });
// // };

//   return (
//     <>
//       <main className="bg-surface min-h-screen">

//         {/* =================================================
//             HERO
//         ================================================= */}

//         <section className="bg-white border-b border-navy/10">
//           <div
//             className="
//               max-w-6xl
//               mx-auto
//               px-4
//               py-6
//               sm:px-6
//               sm:py-8
//               lg:px-8
//               lg:py-10
//             "
//           >
//             <Link
//               to="/"
//               className="
//                 inline-flex
//                 items-center
//                 gap-2
//                 text-sm
//                 text-navy/60
//                 hover:text-navy
//                 transition
//                 mb-5
//               "
//             >
//               <ArrowLeft
//                 className="w-4 h-4"
//                 aria-hidden="true"
//               />

//               Back to Home
//             </Link>

//             <div className="max-w-3xl">
//               <p
//                 className="
//                   flex
//                   items-center
//                   gap-2
//                   text-accent
//                   font-semibold
//                   text-xs
//                   uppercase
//                   tracking-wide
//                 "
//               >
//                 <MessageSquareHeart
//                   className="w-4 h-4"
//                   aria-hidden="true"
//                 />

//                 Real trips, real words
//               </p>

//               <h1
//                 className="
//                   font-display
//                   text-2xl
//                   sm:text-3xl
//                   lg:text-4xl
//                   font-semibold
//                   leading-tight
//                   text-navy
//                   mt-1
//                 "
//               >
//                 What Travellers Say
//               </h1>

//               <p
//                 className="
//                   text-navy/60
//                   mt-2
//                   text-sm
//                   sm:text-base
//                   leading-6
//                   max-w-2xl
//                 "
//               >
//                 Discover genuine experiences shared
//                 by travellers who explored the world
//                 with On a Trip Holidays.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* =================================================
//             REVIEWS
//         ================================================= */}

//         <section className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
//           <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
//             <div>
//               <p className="text-accent font-semibold text-xs uppercase tracking-wide">
//                 Traveller experiences
//               </p>

//               <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mt-1">
//                 Reviews from our travellers
//               </h2>
//             </div>

//             {/* Scroll to form */}

//             <button
//               type="button"
//               onClick={scrollToReviewForm}
//               className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition"
//             >
//               <MessageSquareHeart
//                 className="w-4 h-4"
//                 aria-hidden="true"
//               />

//               Your Valuable Review
//             </button>
//           </div>

//           {/* =================================================
//               LOADING
//           ================================================= */}

//           {loading ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
//               {[1, 2, 3, 4, 5, 6].map((i) => (
//                 <div
//                   key={i}
//                   className="h-64 rounded-2xl bg-white animate-pulse border border-navy/10"
//                   aria-hidden="true"
//                 />
//               ))}
//             </div>
//           ) : testimonials.length === 0 ? (
//             /* =================================================
//                EMPTY STATE
//             ================================================= */

//             <div className="bg-white rounded-2xl border border-navy/10 p-10 text-center">
//               <div className="w-14 h-14 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
//                 <MessageSquareHeart
//                   className="w-7 h-7 text-accent"
//                   aria-hidden="true"
//                 />
//               </div>

//               <h3 className="font-display text-xl font-semibold text-navy mt-5">
//                 Be the first to share your experience
//               </h3>

//               <p className="text-sm text-navy/60 mt-2 mb-6 max-w-md mx-auto">
//                 Your experience can help other
//                 travellers plan their next journey.
//               </p>

//               <button
//                 type="button"
//                 onClick={scrollToReviewForm}
//                 className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-3 font-semibold hover:bg-accent-hover transition"
//               >
//                 <MessageSquareHeart
//                   className="w-4 h-4"
//                   aria-hidden="true"
//                 />

//                 Write a Review
//               </button>
//             </div>
//           ) : (
//             /* =================================================
//                TESTIMONIAL GRID
//             ================================================= */

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
//               {testimonials.map((testimonial) => (
//                 <TestimonialCard
//                   key={testimonial.id}
//                   item={testimonial}
//                 />
//               ))}
//             </div>
//           )}
//         </section>

//         {/* =================================================
//             YOUR VALUABLE REVIEW
//         ================================================= */}

//         <section className="bg-white border-y border-navy/10">
//           <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
//             <ReviewForm
//               onSubmitted={loadTestimonials}
//             />
//           </div>
//         </section>
//       </main>

//       {/* ===================================================
//           FAQ
//       =================================================== */}

//       <FAQSection />

//       {/* ===================================================
//           FOOTER
//       =================================================== */}

//       <Footer />
//     </>
//   );
// }









