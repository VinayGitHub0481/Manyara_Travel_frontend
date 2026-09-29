

import { useEffect, useRef, useState } from "react";
import {
  Star,
  X,
  Send,
  CheckCircle2,
  MessageSquareHeart,
} from "lucide-react";
import { createTestimonial, getMostVisited } from "../api/content";
import ImageUploadField from "./admin/ImageUploadField";

function getSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
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

const EMPTY_FORM = {
  customer_name: "",
  customer_city: "",
  destination: "",
  rating: 5,
  review: "",
};

const INPUT_CLASSES =
  "w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-surface";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not(.sr-only), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NAME_PATTERN = /^[A-Za-zÀ-ÿ.' -]+$/;
const CITY_PATTERN = /^[A-Za-zÀ-ÿ.' -]+$/;

export default function ReviewFormModal({
  open,
  onClose,
  onSubmitted,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [destinationsLoading, setDestinationsLoading] =
    useState(false);
  const [destinationsError, setDestinationsError] =
    useState("");
  const [destinationsLoaded, setDestinationsLoaded] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const closeModal = () => {
    if (submitting) return;
    onClose?.();
  };

  /*
   * =========================================================
   * FIELD VALIDATION
   * =========================================================
   */

  const validateField = (name, value) => {
    const cleanValue =
      typeof value === "string" ? value.trim() : value;

    switch (name) {
      case "customer_name":
        if (!cleanValue) {
          return "Please enter your name.";
        }

        if (cleanValue.length < 2) {
          return "Name must contain at least 2 characters.";
        }

        if (cleanValue.length > 100) {
          return "Name cannot exceed 100 characters.";
        }

        if (!NAME_PATTERN.test(cleanValue)) {
          return "Please enter a valid name.";
        }

        return "";

      case "customer_city":
        if (!cleanValue) {
          return "Please enter your city.";
        }

        if (cleanValue.length < 2) {
          return "City must contain at least 2 characters.";
        }

        if (cleanValue.length > 100) {
          return "City cannot exceed 100 characters.";
        }

        if (!CITY_PATTERN.test(cleanValue)) {
          return "Please enter a valid city.";
        }

        return "";

      case "destination":
        if (!cleanValue) {
          return "Please select the place you visited.";
        }

        if (destinations.length > 0) {
          const exists = destinations.some(
            (destination) =>
              destination.displayName.toLowerCase() ===
              cleanValue.toLowerCase()
          );

          if (!exists) {
            return "Please select a valid destination.";
          }
        }

        return "";

      case "rating":
        if (
          !Number.isInteger(Number(value)) ||
          Number(value) < 1 ||
          Number(value) > 5
        ) {
          return "Please select a rating between 1 and 5 stars.";
        }

        return "";

      case "review":
        if (!cleanValue) {
          return "Please write your review.";
        }

        if (cleanValue.length < 10) {
          return "Review must contain at least 10 characters.";
        }

        if (cleanValue.length > 3000) {
          return "Review cannot exceed 3000 characters.";
        }

        return "";

      default:
        return "";
    }
  };

  /*
   * =========================================================
   * VALIDATE ALL FIELDS
   * =========================================================
   */

  const validateForm = () => {
    const fieldNames = [
      "customer_name",
      "customer_city",
      "destination",
      "rating",
      "review",
    ];

    const nextErrors = {};

    fieldNames.forEach((fieldName) => {
      const error = validateField(
        fieldName,
        form[fieldName]
      );

      if (error) {
        nextErrors[fieldName] = error;
      }
    });

    return nextErrors;
  };

  /*
   * =========================================================
   * BODY SCROLL + FOCUS MANAGEMENT
   * =========================================================
   */

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current =
      document.activeElement;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);

      document.body.style.overflow =
        previousOverflow;

      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  /*
   * =========================================================
   * RESET TEMPORARY STATES WHEN MODAL CLOSES
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setSubmitError("");
      setErrors({});
    }
  }, [open]);

  /*
   * =========================================================
   * LOAD DESTINATIONS
   * =========================================================
   */

  useEffect(() => {
    if (!open || destinationsLoaded) return;

    let mounted = true;

    const loadDestinations = async () => {
      try {
        setDestinationsLoading(true);
        setDestinationsError("");

        const data = await getMostVisited();

        if (!mounted) return;

        const validDestinations = getSafeArray(data)
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
        setDestinationsLoaded(true);
      } catch (err) {
        console.error(
          "Failed to load destinations:",
          err
        );

        if (!mounted) return;

        setDestinations([]);
        setDestinationsError(
          "Unable to load destinations. Please try again."
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
  }, [open, destinationsLoaded]);

  /*
   * =========================================================
   * KEYBOARD ACCESSIBILITY
   * =========================================================
   */

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable =
      panelRef.current?.querySelectorAll(FOCUSABLE);

    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  /*
   * =========================================================
   * HANDLE INPUT CHANGE
   * =========================================================
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    /*
     * Validate ONLY the field being changed.
     */
    const fieldError = validateField(name, value);

    setErrors((previous) => ({
      ...previous,
      [name]: fieldError,
    }));

    setSubmitError("");
  };

  /*
   * =========================================================
   * RATING
   * =========================================================
   */

  const handleRating = (rating) => {
    setForm((previous) => ({
      ...previous,
      rating,
    }));

    const fieldError = validateField(
      "rating",
      rating
    );

    setErrors((previous) => ({
      ...previous,
      rating: fieldError,
    }));

    setSubmitError("");
  };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitError("");

    if (imageUploading) {
      setSubmitError(
        "Please wait for your photo to finish uploading."
      );
      return;
    }

    /*
     * Validate every field using the same switch-based
     * field validation function.
     */
    const validationErrors = validateForm();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField =
        Object.keys(validationErrors)[0];

      requestAnimationFrame(() => {
        document
          .getElementById(
            `modal_${firstInvalidField}`
          )
          ?.focus();
      });

      return;
    }

    setSubmitting(true);

    try {
      await createTestimonial({
        customer_name: form.customer_name.trim(),
        customer_city: form.customer_city.trim(),
        destination: form.destination.trim(),
        rating: Number(form.rating),
        review: form.review.trim(),
        image: image || null,
      });

      setSuccess(true);
      setForm(EMPTY_FORM);
      setErrors({});
      setImage(null);

      onSubmitted?.();
    } catch (err) {
      console.error(
        "Failed to submit testimonial:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      setSubmitError(
        typeof detail === "string"
          ? detail
          : "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const submitDisabled =
    submitting ||
    imageUploading ||
    destinationsLoading ||
    destinations.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onKeyDown={handleKeyDown}
        className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-navy/10 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="review-modal-title"
              className="font-display text-xl font-semibold leading-tight text-navy sm:text-2xl"
            >
              {success
                ? "Thank you!"
                : "Your Valuable Review"}
            </h2>

            {!success && (
              <p className="mt-1 text-sm leading-relaxed text-navy/60">
                Tell future travellers about your trip.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label="Close review form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy/60 transition hover:bg-surface hover:text-navy focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 sm:h-10 sm:w-10"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        {success ? (
          <div className="overflow-y-auto px-5 py-8 text-center sm:px-7 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2
                className="h-9 w-9 text-green-600"
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-base font-medium text-navy/80">
              Thank you for your valuable response!
            </p>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-navy/60">
              Your review has been submitted. Our team
              will check it before publishing it on our
              website.
            </p>

            <div className="mx-auto mt-5 max-w-xs rounded-xl border border-navy/10 bg-surface px-4 py-3">
              <p className="text-xs text-navy/50">
                Review status
              </p>

              <p className="mt-1 text-sm font-semibold text-navy">
                Pending approval
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setSubmitError("");
                  setErrors({});
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/15 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <MessageSquareHeart
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Write another review
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="modal_customer_name"
                      className="mb-1.5 block text-sm font-medium text-navy"
                    >
                      Your Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      ref={firstFieldRef}
                      id="modal_customer_name"
                      name="customer_name"
                      type="text"
                      value={form.customer_name}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      placeholder="Enter your name"
                      autoComplete="name"
                      disabled={submitting}
                      aria-invalid={
                        !!errors.customer_name
                      }
                      className={`${INPUT_CLASSES} ${
                        errors.customer_name
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : ""
                      }`}
                    />

                    {errors.customer_name && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.customer_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="modal_customer_city"
                      className="mb-1.5 block text-sm font-medium text-navy"
                    >
                      Your City{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="modal_customer_city"
                      name="customer_city"
                      type="text"
                      value={form.customer_city}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      placeholder="e.g. Hyderabad"
                      autoComplete="address-level2"
                      disabled={submitting}
                      aria-invalid={
                        !!errors.customer_city
                      }
                      className={`${INPUT_CLASSES} ${
                        errors.customer_city
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : ""
                      }`}
                    />

                    {errors.customer_city && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.customer_city}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="modal_destination"
                    className="mb-1.5 block text-sm font-medium text-navy"
                  >
                    Place Visited{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="modal_destination"
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    disabled={
                      submitting ||
                      destinationsLoading
                    }
                    aria-invalid={
                      !!errors.destination
                    }
                    className={`${INPUT_CLASSES} ${
                      errors.destination
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  >
                    <option value="">
                      {destinationsLoading
                        ? "Loading destinations..."
                        : "Select the place you visited"}
                    </option>

                    {!destinationsLoading &&
                      destinations.map(
                        (destination) => (
                          <option
                            key={
                              destination?.id ||
                              destination?.slug ||
                              destination?.displayName
                            }
                            value={
                              destination.displayName
                            }
                          >
                            {destination.displayName}
                          </option>
                        )
                      )}
                  </select>

                  {errors.destination && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.destination}
                    </p>
                  )}

                  {!errors.destination &&
                    destinationsError && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {destinationsError}
                      </p>
                    )}
                </div>

                <div>
                  <p className="mb-1.5 text-sm font-medium text-navy">
                    Your Rating{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </p>

                  <div
                    className="flex gap-1"
                    role="radiogroup"
                    aria-label="Choose your rating"
                  >
                    {[1, 2, 3, 4, 5].map(
                      (rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            handleRating(rating)
                          }
                          disabled={submitting}
                          aria-label={`Give ${rating} star${
                            rating > 1 ? "s" : ""
                          }`}
                          aria-pressed={
                            form.rating === rating
                          }
                          className="rounded-lg p-1 transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed"
                        >
                          <Star
                            className={`h-8 w-8 sm:h-7 sm:w-7 ${
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
                      )
                    )}
                  </div>

                  <p className="mt-1 text-xs text-navy/50">
                    {form.rating} out of 5 stars
                  </p>

                  {errors.rating && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.rating}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="modal_review"
                    className="mb-1.5 block text-sm font-medium text-navy"
                  >
                    Your Review{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <textarea
                    id="modal_review"
                    name="review"
                    value={form.review}
                    onChange={handleChange}
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    placeholder="Tell us about your travel experience..."
                    disabled={submitting}
                    aria-invalid={!!errors.review}
                    className={`${INPUT_CLASSES} resize-none ${
                      errors.review
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-navy/40">
                    <span>
                      Minimum 10 characters
                    </span>

                    <span>
                      {form.review.length}/3000
                    </span>
                  </div>

                  {errors.review && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.review}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-navy/10 bg-surface/30 p-4">
                  <ImageUploadField
                    value={image}
                    onChange={setImage}
                    onBusyChange={setImageUploading}
                    uploadEndpoint="/uploads/review-image"
                    disabled={submitting}
                    label="Your Photo (Optional)"
                  />

                  <p className="mt-2 text-xs leading-relaxed text-navy/50">
                    You can share a photo from your trip,
                    but this is completely optional.
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-navy/10 bg-white px-5 py-4 sm:px-6">
              {submitError && (
                <div
                  className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5"
                  role="alert"
                >
                  <p className="text-sm leading-relaxed text-red-700">
                    {submitError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {submitting
                  ? "Submitting..."
                  : imageUploading
                  ? "Uploading photo..."
                  : "Submit Your Review"}
              </button>

              <p className="mt-2 text-center text-xs leading-relaxed text-navy/50">
                Your review will be published after our
                team reviews it.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

