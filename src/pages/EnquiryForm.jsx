


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Minus,
  PlaneTakeoff,
  Plus,
  Send,
  X,
} from "lucide-react";

import { createEnquiry } from "../api/enquiries";
import { getPackages } from "../api/content";
import { useQuery } from "../hooks/useQuery";
import generatePackagePDF from "../components/PackageItineraryPDF";

/* ============================================================
   PACKAGE TYPE OPTIONS
============================================================ */

const PACKAGE_TYPE_OPTIONS = [
  { value: "all", label: "All Destinations" },
  { value: "pilgrimage", label: "Pilgrimage" },
  {
    value: "mountains_adventure",
    label: "Mountains & Adventure",
  },
  { value: "family", label: "Family" },
  { value: "beach", label: "Beach" },
  { value: "romantic", label: "Romantic" },
  {
    value: "wildlife_nature",
    label: "Wildlife & Nature",
  },
  { value: "international", label: "International" },
];

const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  romantic: "Romantic",
  international: "International",
  beach: "Beach",
  family: "Family",
  wildlife_nature: "Wildlife & Nature",
};

/* ============================================================
   DOM IDS
============================================================ */

const FIELD_IDS = {
  name: "enquiry-name",
  phone: "enquiry-phone",
  package_id: "enquiry-package",
  adults: "enquiry-adults",
  kids: "enquiry-kids",
  nights: "enquiry-nights",
  travel_date: "enquiry-travel-date",
};

const FIELD_ORDER = [
  "name",
  "phone",
  "package_id",
  "adults",
  "kids",
  "nights",
  "travel_date",
];

const EMPTY_ERRORS = {
  name: "",
  phone: "",
  package_type: "",
  package_id: "",
  adults: "",
  kids: "",
  nights: "",
  travel_date: "",
};

const EMPTY_TOUCHED = {
  name: false,
  phone: false,
  package_type: false,
  package_id: false,
  adults: false,
  kids: false,
  nights: false,
  travel_date: false,
};

const EXIT_MS = 280;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* ============================================================
   THEME CLASSES
============================================================ */

const INPUT_BASE =
  "block w-full min-w-0 rounded-xl border bg-input px-4 text-base text-text-dark outline-none transition-all duration-200 placeholder:text-placeholder disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

const inputClass = (hasError, extra = "h-12") =>
  `${INPUT_BASE} ${extra} ${
    hasError
      ? "border-error bg-error-bg/30 focus:border-error focus:ring-4 focus:ring-error/10"
      : "border-border hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/10"
  }`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2";

const LABEL =
  "mb-1.5 flex items-baseline gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600";

const PRIMARY_BUTTON =
  "bg-accent text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-orange active:translate-y-0 active:scale-[0.99]";

const OUTLINE_BUTTON =
  "border border-border bg-card text-text-dark transition-colors hover:border-border-strong hover:bg-surface-soft";

/* ============================================================
   HELPERS
============================================================ */

const normalizePackagesResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.packages)) return data.packages;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        return item?.msg || item?.message || "Invalid input";
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof detail === "string") return detail;

  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Failed to submit enquiry. Please try again.";
};

const formatDate = (value) => {
  if (!value) return "";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object" && image.url) {
    return image.url;
  }

  return "";
};

/*
 * Local date for <input type="date" min>.
 * Avoids UTC causing yesterday's date in India.
 */
function getTodayForDateInput() {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  );

  return local.toISOString().split("T")[0];
}

/* ============================================================
   FIELD VALIDATION
============================================================ */

const validateName = (value) => {
  const name = String(value ?? "").trim();

  if (!name) {
    return "Please enter your full name.";
  }

  if (name.length < 2) {
    return "Name must be at least 2 characters.";
  }

  if (name.length > 100) {
    return "Name must be less than 100 characters.";
  }

  if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(name)) {
    return "Please enter a valid name.";
  }

  return "";
};

const validatePhone = (value) => {
  const phone = String(value ?? "").trim();

  if (!phone) {
    return "Please enter your phone or WhatsApp number.";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return "Phone number must contain at least 10 digits.";
  }

  if (digits.length > 15) {
    return "Phone number must contain at most 15 digits.";
  }

  if (!/^[+\d\s()-]+$/.test(phone)) {
    return "Please enter a valid phone number.";
  }

  return "";
};

const validateAdults = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "Please enter the number of adults.";
  }

  const adults = Number(value);

  if (!Number.isInteger(adults)) {
    return "Number of adults must be a whole number.";
  }

  if (adults < 1) {
    return "At least 1 adult is required.";
  }

  if (adults > 100) {
    return "Number of adults cannot exceed 100.";
  }

  return "";
};

const validateKids = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "Please enter the number of kids.";
  }

  const kids = Number(value);

  if (!Number.isInteger(kids)) {
    return "Number of kids must be a whole number.";
  }

  if (kids < 0) {
    return "Number of kids cannot be negative.";
  }

  if (kids > 100) {
    return "Number of kids cannot exceed 100.";
  }

  return "";
};

const validateNights = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "Please enter the number of nights.";
  }

  const nights = Number(value);

  if (!Number.isInteger(nights)) {
    return "Number of nights must be a whole number.";
  }

  if (nights < 1) {
    return "At least 1 night is required.";
  }

  if (nights > 365) {
    return "Number of nights cannot exceed 365.";
  }

  return "";
};

const validateTravelDate = (value, isBatch = false) => {
  if (!value) {
    return "Please select your travel date.";
  }

  if (isBatch) {
    return "";
  }

  const selectedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Please enter a valid travel date.";
  }

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const selectedYear = selectedDate.getFullYear();

  if (
    selectedYear !== currentYear &&
    selectedYear !== nextYear
  ) {
    return `Travel date must be in ${currentYear} or ${nextYear}.`;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return "Travel date cannot be in the past.";
  }

  return "";
};

const validatePackage = (value) =>
  value ? "" : "Please select a package.";

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Field({
  id,
  label,
  required,
  optional,
  error,
  hint,
  children,
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}

        {required && (
          <span
            className="text-accent"
            aria-hidden="true"
          >
            *
          </span>
        )}

        {optional && (
          <span className="text-xs font-normal normal-case tracking-normal text-muted">
            (optional)
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-error-text sm:text-sm"
        >
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
            aria-hidden="true"
          />

          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-relaxed text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ValidTick({ show }) {
  if (!show) return null;

  return (
    <CheckCircle2
      className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-success"
      aria-hidden="true"
    />
  );
}

function TripSummary({
  title,
  destination,
  typeLabel,
  days,
  image,
  departure,
  onChange,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-white/80 p-3 shadow-travel-card backdrop-blur">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-[72px] sm:w-[72px]"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-brand sm:h-[72px] sm:w-[72px]">
          <CalendarDays
            className="h-6 w-6"
            aria-hidden="true"
          />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-display text-xl font-semibold leading-[1.15] text-text-dark sm:text-[22px]">
          {title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted sm:text-[13px]">
          {destination && (
            <span className="inline-flex items-center gap-1">
              <MapPin
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
              {destination}
            </span>
          )}

          {days ? (
            <span>
              {days} {Number(days) === 1 ? "day" : "days"}
            </span>
          ) : null}

          {typeLabel && <span>{typeLabel}</span>}
        </div>

        {departure && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-link">
            <CalendarDays
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            Departs {departure}
          </p>
        )}
      </div>

      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-link transition-colors hover:bg-white/70 ${FOCUS_RING}`}
        >
          Change
        </button>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function EnquiryForm({
  pkg = null,
  batch = null,
  destination = null,
  onClose,
  onSuccess,
  downloadItinerary = false,
  showPackageType = true,
}) {
  const initialPackage =
    pkg || batch?.package || null;

  /* ============================================================
     INITIAL FORM
  ============================================================ */

  const buildInitialForm = useCallback(
    () => ({
      name: "",
      phone: "",
      package_type:
        initialPackage?.package_type || "all",

      package_id:
        initialPackage?.id != null
          ? String(initialPackage.id)
          : batch?.package_id != null
            ? String(batch.package_id)
            : "",

      adults: "2",
      kids: "0",
      nights: "1",

      travel_date:
        batch?.departure_date || "",

      message: "",
    }),
    [initialPackage, batch],
  );

  const [form, setForm] = useState(buildInitialForm);

  const [fieldErrors, setFieldErrors] =
    useState(EMPTY_ERRORS);

  const [touched, setTouched] =
    useState(EMPTY_TOUCHED);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [changingPackage, setChangingPackage] =
    useState(false);

  const [entered, setEntered] =
    useState(false);

  const dialogRef = useRef(null);

  const submitLockRef = useRef(false);

  const hasSubmittedRef = useRef(false);

  const closeTimerRef = useRef(null);

  /* ============================================================
     PACKAGES
  ============================================================ */

  const {
    data: packageData,
    loading: packagesLoading,
  } = useQuery(getPackages);

  const packages = useMemo(
    () =>
      normalizePackagesResponse(packageData).filter(
        (item) =>
          item?.id != null &&
          (item?.status === "published" ||
            item?.status == null),
      ),
    [packageData],
  );

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateField = useCallback(
    (field, value) => {
      switch (field) {
        case "name":
          return validateName(value);

        case "phone":
          return validatePhone(value);

        case "package_id":
          return validatePackage(value);

        case "adults":
          return validateAdults(value);

        case "kids":
          return validateKids(value);

        case "nights":
          return validateNights(value);

        case "travel_date":
          return validateTravelDate(
            value,
            Boolean(batch?.departure_date),
          );

        default:
          return "";
      }
    },
    [batch?.departure_date],
  );

  const validateAllFields = useCallback(() => {
    const errors = {
      name: validateName(form.name),

      phone: validatePhone(form.phone),

      package_id: validatePackage(
        form.package_id,
      ),

      adults: validateAdults(form.adults),

      kids: validateKids(form.kids),

      nights: validateNights(form.nights),

      travel_date: validateTravelDate(
        form.travel_date,
        Boolean(batch?.departure_date),
      ),
    };

    setFieldErrors((prev) => ({
      ...prev,
      ...errors,
    }));

    setTouched((prev) => ({
      ...prev,
      name: true,
      phone: true,
      package_id: true,
      adults: true,
      kids: true,
      nights: true,
      travel_date: true,
    }));

    return errors;
  }, [
    form.name,
    form.phone,
    form.package_id,
    form.adults,
    form.kids,
    form.nights,
    form.travel_date,
    batch?.departure_date,
  ]);

  const errorOf = (field) =>
    touched[field] ? fieldErrors[field] : "";

  const describedBy = (field, hint) => {
    const id = FIELD_IDS[field];

    if (errorOf(field)) {
      return `${id}-error`;
    }

    return hint ? `${id}-hint` : undefined;
  };

  /* ============================================================
     RESET / CLOSE
  ============================================================ */

  const resetForm = useCallback(() => {
    setForm(buildInitialForm());

    setFieldErrors(EMPTY_ERRORS);

    setTouched(EMPTY_TOUCHED);

    setError("");

    setSuccess(false);

    setLoading(false);

    setChangingPackage(false);

    submitLockRef.current = false;

    hasSubmittedRef.current = false;
  }, [buildInitialForm]);

  const handleClose = useCallback(() => {
    if (
      loading ||
      closeTimerRef.current
    ) {
      return;
    }

    setEntered(false);

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;

      resetForm();

      onClose?.();
    }, EXIT_MS);
  }, [
    loading,
    resetForm,
    onClose,
  ]);

  const closeRef = useRef(handleClose);

  closeRef.current = handleClose;

  useEffect(() => {
    return () => {
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  /* ============================================================
     OPEN / SCROLL / ESC
  ============================================================ */

  useEffect(() => {
    const previouslyFocused =
      document.activeElement;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKey = (event) => {
      if (event.key === "Escape") {
        closeRef.current();
      }
    };

    window.addEventListener(
      "keydown",
      onKey,
    );

    let inner;

    const outer =
      requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          setEntered(true);

          const wide =
            window.matchMedia?.(
              "(min-width: 640px)",
            )?.matches;

          const target = wide
            ? document.getElementById(
                FIELD_IDS.name,
              )
            : null;

          (
            target ||
            dialogRef.current
          )?.focus({
            preventScroll: true,
          });
        });
      });

    return () => {
      cancelAnimationFrame(outer);

      cancelAnimationFrame(inner);

      window.removeEventListener(
        "keydown",
        onKey,
      );

      document.body.style.overflow =
        previousOverflow;

      previouslyFocused?.focus?.();
    };
  }, []);

  /* ============================================================
     FOCUS TRAP
  ============================================================ */

  const handleKeyDown = (event) => {
    if (
      event.key !== "Tab" ||
      !dialogRef.current
    ) {
      return;
    }

    const nodes = Array.from(
      dialogRef.current.querySelectorAll(
        FOCUSABLE,
      ),
    );

    if (nodes.length === 0) {
      return;
    }

    const first = nodes[0];

    const last = nodes[nodes.length - 1];

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

  /* ============================================================
     PREFILL
  ============================================================ */

  useEffect(() => {
    const selected =
      pkg ||
      batch?.package ||
      null;

    const nextPackageType =
      selected?.package_type || "all";

    const nextPackageId =
      selected?.id != null
        ? String(selected.id)
        : batch?.package_id != null
          ? String(batch.package_id)
          : "";

    const nextTravelDate =
      batch?.departure_date || "";

    setForm((prev) => {
      if (
        prev.package_type ===
          nextPackageType &&
        prev.package_id ===
          nextPackageId &&
        prev.travel_date ===
          nextTravelDate
      ) {
        return prev;
      }

      return {
        ...prev,
        package_type: nextPackageType,
        package_id: nextPackageId,
        travel_date: nextTravelDate,
      };
    });
  }, [pkg, batch]);

  /* ============================================================
     PACKAGE FILTERING
  ============================================================ */

  const destinationId =
    destination?.destination_id ??
    destination?.id ??
    null;

  const destinationPackageIds = useMemo(() => {
  if (!Array.isArray(destination?.packages)) return null;
  return new Set(destination.packages.map((p) => String(p?.id)));
  }, [destination]);

  const filteredPackages = useMemo(() => {
  let result = packages;

  if (destinationPackageIds) {
    // Destination came with its own package list (seasoned detail page)
    result = result.filter((item) =>
      destinationPackageIds.has(String(item?.id))
    );
  } else if (destinationId != null) {
    // Existing behaviour (most-visited destinations)
    result = result.filter(
      (item) => String(item?.destination_id) === String(destinationId)
    );
  }

  if (showPackageType && form.package_type && form.package_type !== "all") {
    result = result.filter((item) => item?.package_type === form.package_type);
  }

  return result;
}, [packages, destinationPackageIds, destinationId, showPackageType, form.package_type]);

  /* ============================================================
     SELECTED PACKAGE
  ============================================================ */

  const selectedPackage = useMemo(() => {
    const fromList = packages.find(
      (item) =>
        String(item?.id) ===
        String(form?.package_id),
    );

    if (fromList) {
      return fromList;
    }

    if (
      pkg &&
      String(pkg?.id) ===
        String(form?.package_id)
    ) {
      return pkg;
    }

    if (
      batch?.package &&
      String(batch.package?.id) ===
        String(form?.package_id)
    ) {
      return batch.package;
    }

    return null;
  }, [
    packages,
    form?.package_id,
    pkg,
    batch?.package,
  ]);

  /* ============================================================
     CLEAR INVALID PACKAGE
  ============================================================ */

  useEffect(() => {
    if (
      packagesLoading ||
      !form.package_id
    ) {
      return;
    }

    const stillAvailable =
      filteredPackages.some(
        (item) =>
          String(item?.id) ===
          String(form.package_id),
      );

    const isExplicitPackage =
      pkg &&
      String(pkg?.id) ===
        String(form.package_id);

    const isBatchPackage =
      batch?.package &&
      String(batch.package?.id) ===
        String(form.package_id);

    if (
      !stillAvailable &&
      !isExplicitPackage &&
      !isBatchPackage
    ) {
      setForm((prev) => ({
        ...prev,
        package_id: "",
      }));

      setFieldErrors((prev) => ({
        ...prev,
        package_id: "",
      }));
    }
  }, [
    packagesLoading,
    filteredPackages,
    form.package_id,
    pkg,
    batch?.package,
  ]);

  /* ============================================================
     DISPLAY VALUES
  ============================================================ */

  const summaryPackage =
    selectedPackage ||
    pkg ||
    batch?.package ||
    null;

  const showPickers =
    !batch &&
    (!pkg || changingPackage);

  const formTitle = batch
    ? "Enquire about this trip"
    : pkg
      ? "Enquire about this package"
      : destination
        ? `Plan your ${
            destination?.place_name ||
            destination?.name ||
            "trip"
          }`
        : "Plan your trip";

  const formSubtitle = batch
    ? "Share your details and our travel team will get back to you."
    : pkg
      ? "Tell us what you need and we will plan it with you."
      : destination
        ? "Pick a package from this destination and send us your requirements."
        : "Tell us about your trip and we will help you plan it.";

  const isDirty =
    !success &&
    Boolean(
      form.name.trim() ||
        form.phone.trim() ||
        form.message.trim(),
    );

  /* ============================================================
     FORM HANDLERS
  ============================================================ */

  const handleChange = useCallback(
    (event) => {
      const { name, value } =
        event.target;

      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(
          name,
          value,
        ),
      }));

      setError("");
    },
    [validateField],
  );

  const handleBlur = useCallback(
    (event) => {
      const { name, value } =
        event.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(
          name,
          value,
        ),
      }));
    },
    [validateField],
  );

  /* ============================================================
     COUNTER HELPERS
  ============================================================ */

  const updateCounter = useCallback(
    (field, value, min, max) => {
      const numericValue = Number(value);

      const next = Math.min(
        max,
        Math.max(
          min,
          Number.isFinite(numericValue)
            ? numericValue
            : min,
        ),
      );

      const stringValue = String(next);

      setForm((prev) => ({
        ...prev,
        [field]: stringValue,
      }));

      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(
          field,
          stringValue,
        ),
      }));

      setError("");
    },
    [validateField],
  );

  const handleNumberInput = useCallback(
    (field, event) => {
      const value = event.target.value
        .replace(/\D/g, "")
        .slice(0, 3);

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));

      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(
          field,
          value,
        ),
      }));

      setError("");
    },
    [validateField],
  );

  const adjustAdults = (delta) => {
    updateCounter(
      "adults",
      Number(form.adults || 1) + delta,
      1,
      100,
    );
  };

  const adjustKids = (delta) => {
    updateCounter(
      "kids",
      Number(form.kids || 0) + delta,
      0,
      100,
    );
  };

  const adjustNights = (delta) => {
    updateCounter(
      "nights",
      Number(form.nights || 1) + delta,
      1,
      365,
    );
  };

  /* ============================================================
     PACKAGE TYPE
  ============================================================ */

  const handlePackageTypeChange =
    useCallback((event) => {
      const packageType =
        event.target.value;

      setForm((prev) => ({
        ...prev,
        package_type: packageType,
        package_id: "",
      }));

      setTouched((prev) => ({
        ...prev,
        package_type: true,
        package_id: false,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        package_type: "",
        package_id: "",
      }));

      setError("");
    }, []);

  const handlePackageChange =
    useCallback((event) => {
      const packageId =
        event.target.value;

      setForm((prev) => ({
        ...prev,
        package_id: packageId,
      }));

      setTouched((prev) => ({
        ...prev,
        package_id: true,
      }));

      setFieldErrors((prev) => ({
        ...prev,
        package_id:
          validatePackage(packageId),
      }));

      setError("");
    }, []);

  /* ============================================================
     BACKDROP
  ============================================================ */

  const handleBackdrop = () => {
    if (loading || isDirty) {
      return;
    }

    handleClose();
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (
        submitLockRef.current ||
        hasSubmittedRef.current ||
        loading ||
        success
      ) {
        return;
      }

      const validationErrors =
        validateAllFields();

      const firstInvalid =
        FIELD_ORDER.find(
          (field) =>
            validationErrors[field],
        );

      if (firstInvalid) {
        setError(
          "Please fix the highlighted fields.",
        );

        if (
          firstInvalid ===
          "package_id"
        ) {
          setChangingPackage(true);
        }

        setTimeout(() => {
          document
            .getElementById(
              FIELD_IDS[firstInvalid],
            )
            ?.focus();
        }, 0);

        return;
      }

      submitLockRef.current = true;

      setLoading(true);

      setError("");

      try {
        const packageForSubmit =
          selectedPackage ||
          pkg ||
          batch?.package ||
          null;

        const resolvedPackageId =
          Number(form.package_id) ||
          packageForSubmit?.id ||
          pkg?.id ||
          batch?.package_id ||
          null;

        if (!resolvedPackageId) {
          const message =
            "Please select a valid package.";

          setFieldErrors((prev) => ({
            ...prev,
            package_id: message,
          }));

          setChangingPackage(true);

          setError(message);

          return;
        }

        const resolvedPackageType =
          packageForSubmit?.package_type ||
          pkg?.package_type ||
          batch?.package?.package_type ||
          (form.package_type &&
          form.package_type !== "all"
            ? form.package_type
            : "general");

        /*
         * IMPORTANT:
         * This payload now matches the current
         * enquiries table.
         *
         * Removed:
         * - batch_id
         * - travellers
         *
         * Added:
         * - seasoned_id
         * - adults
         * - kids
         * - nights
         */

        const payload = {
          package_id:
            resolvedPackageId,

          seasoned_id:
            batch?.id ?? null,

          package_type:
            resolvedPackageType,

          destination:
            packageForSubmit?.destination ||
            batch?.destination ||
            destination?.place_name ||
            destination?.name ||
            null,

          name:
            form.name.trim(),

          phone:
            form.phone.trim(),

          adults:
            Number(form.adults),

          kids:
            Number(form.kids),

          nights:
            Number(form.nights),

          travel_date:
            batch?.departure_date ||
            form.travel_date ||
            null,

          message:
            form.message.trim() ||
            null,
        };

        await createEnquiry(payload);

        hasSubmittedRef.current = true;

        setSuccess(true);

        if (
          typeof onSuccess ===
          "function"
        ) {
          try {
            await onSuccess();
          } catch (callbackError) {
            console.error(
              "Post-enquiry success callback failed:",
              callbackError,
            );
          }
        }

        if (
          downloadItinerary &&
          pkg
        ) {
          try {
            await generatePackagePDF(
              pkg,
            );
          } catch (pdfError) {
            console.error(
              "Package PDF generation failed:",
              pdfError,
            );
          }
        }
      } catch (err) {
        console.error(
          "Enquiry submission failed:",
          err,
        );

        setError(
          getErrorMessage(err),
        );
      } finally {
        setLoading(false);

        submitLockRef.current = false;
      }
    },
    [
      loading,
      success,
      validateAllFields,
      form.name,
      form.phone,
      form.adults,
      form.kids,
      form.nights,
      form.package_id,
      form.package_type,
      form.travel_date,
      form.message,
      selectedPackage,
      pkg,
      batch,
      destination,
      onSuccess,
      downloadItinerary,
    ],
  );

  /* ============================================================
     RENDER VALUES
  ============================================================ */

  const closeButton = (
    <button
      type="button"
      onClick={handleClose}
      disabled={loading}
      aria-label="Close enquiry form"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:text-text-dark disabled:cursor-not-allowed disabled:opacity-50 ${OUTLINE_BUTTON} ${FOCUS_RING}`}
    >
      <X
        size={19}
        strokeWidth={2}
        aria-hidden="true"
      />
    </button>
  );

  const nameValid =
    touched.name &&
    !fieldErrors.name &&
    form.name.trim();

  const phoneValid =
    touched.phone &&
    !fieldErrors.phone &&
    form.phone.trim();

  const firstName =
    form.name
      .trim()
      .split(/\s+/)[0] ||
    "there";

  const sheetMotion = entered
    ? "translate-y-0 opacity-100 sm:scale-100"
    : "translate-y-full opacity-100 sm:translate-y-3 sm:scale-[0.98] sm:opacity-0";

  /* ============================================================
     PORTAL
  ============================================================ */

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}

      <div
        onMouseDown={handleBackdrop}
        aria-hidden="true"
        className={`absolute inset-0 bg-ink/60 bg-[radial-gradient(ellipse_at_30%_0%,rgba(232,40,111,0.32),transparent_55%)] backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none ${
          entered
            ? "opacity-100"
            : "opacity-0"
        }`}
      />

      {/* Layout wrapper */}

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="enquiry-title"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`pointer-events-auto relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-petal-gradient font-body antialiased shadow-brand outline-none transition-[transform,opacity] duration-300 ease-soft motion-reduce:transition-none sm:max-h-[90dvh] sm:rounded-3xl ${sheetMotion}`}
        >
          {/* Top accent */}

          <div
            className="relative z-10 h-1 shrink-0 bg-orange-gradient"
            aria-hidden="true"
          />

          {/* Background decoration */}

          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(242,88,143,0.26),transparent_70%)]" />

            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(200,19,94,0.12),transparent_70%)]" />

            <div className="absolute inset-0 bg-[radial-gradient(rgba(200,19,94,0.10)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_45%)]" />
          </div>

          {success ? (
            /* ====================================================
               SUCCESS
            ==================================================== */

            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-8">
              <div className="flex justify-end">
                {closeButton}
              </div>

              <div
                className="mx-auto flex w-full max-w-md flex-1 flex-col items-center py-4 text-center"
                role="status"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success ring-8 ring-success-bg/50">
                  <CheckCircle2
                    className="h-8 w-8"
                    aria-hidden="true"
                  />
                </span>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Enquiry received
                </p>

                <h2
                  id="enquiry-title"
                  className="mt-1.5 font-display text-4xl font-semibold leading-none text-text-display"
                >
                  Thank you, {firstName}
                </h2>

                <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                  Our travel team will
                  contact you on{" "}
                  <span className="font-semibold text-text-dark">
                    {form.phone.trim()}
                  </span>{" "}
                  very soon.
                </p>

                <div className="mt-6 w-full rounded-2xl border border-primary/15 bg-white/80 p-4 text-left">
                  <p className="font-display text-xl font-semibold leading-tight text-text-dark">
                    {summaryPackage?.title ||
                      batch?.title ||
                      "Your trip"}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Adults
                      </dt>

                      <dd className="mt-0.5 text-sm font-semibold text-text-dark">
                        {form.adults}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Kids
                      </dt>

                      <dd className="mt-0.5 text-sm font-semibold text-text-dark">
                        {form.kids}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Nights
                      </dt>

                      <dd className="mt-0.5 text-sm font-semibold text-text-dark">
                        {form.nights}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Travel date
                      </dt>

                      <dd className="mt-0.5 text-sm font-semibold text-text-dark">
                        {formatDate(
                          batch?.departure_date ||
                            form.travel_date,
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {downloadItinerary &&
                  pkg && (
                    <p className="mt-4 text-sm text-muted">
                      Your itinerary PDF
                      is downloading.
                    </p>
                  )}

                <button
                  type="button"
                  onClick={handleClose}
                  className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-[13px] font-semibold uppercase tracking-[0.16em] ${PRIMARY_BUTTON} ${FOCUS_RING}`}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="relative shrink-0 border-b border-primary/10 bg-white/70 backdrop-blur-md">
                {/* Mobile drag handle */}

                <div
                  className="flex justify-center pt-2.5 sm:hidden"
                  aria-hidden="true"
                >
                  <span className="h-1 w-10 rounded-full bg-border" />
                </div>

                <div className="flex items-start gap-3 px-4 pb-4 pt-3 sm:px-6 sm:py-5">
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-lighter text-primary sm:flex">
                    <PlaneTakeoff
                      className="h-5 w-5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                      Manyara Privé Vacations
                    </p>

                    <h2
                      id="enquiry-title"
                      className="mt-1 font-display text-[28px] font-semibold leading-[1.05] text-text-display sm:text-[32px]"
                    >
                      {formTitle}
                    </h2>

                    <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                      {formSubtitle}
                    </p>
                  </div>

                  {closeButton}
                </div>
              </div>

              {/* ==================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="relative flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                  <div className="space-y-5">
                    {/* Preselected trip */}

                    {!showPickers && (
                      <TripSummary
                        title={
                          summaryPackage?.title ||
                          batch?.title ||
                          "Selected trip"
                        }
                        destination={
                          summaryPackage?.destination ||
                          batch?.destination
                        }
                        typeLabel={
                          PACKAGE_TYPE_LABELS[
                            summaryPackage
                              ?.package_type
                          ] || ""
                        }
                        days={
                          summaryPackage?.duration_days
                        }
                        image={getImageUrl(
                          summaryPackage?.images?.[0],
                        )}
                        departure={formatDate(
                          batch?.departure_date,
                        )}
                        onChange={
                          pkg && !batch
                            ? () =>
                                setChangingPackage(
                                  true,
                                )
                            : undefined
                        }
                      />
                    )}

                    {/* Name + phone */}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id={FIELD_IDS.name}
                        label="Full name"
                        required
                        error={errorOf("name")}
                      >
                        <div className="relative">
                          <input
                            id={FIELD_IDS.name}
                            name="name"
                            type="text"
                            autoComplete="name"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            placeholder="Your name"
                            value={form.name}
                            onChange={
                              handleChange
                            }
                            onBlur={handleBlur}
                            maxLength={100}
                            disabled={loading}
                            aria-invalid={
                              errorOf("name")
                                ? "true"
                                : undefined
                            }
                            aria-describedby={describedBy(
                              "name",
                            )}
                            className={`${inputClass(
                              Boolean(
                                errorOf("name"),
                              ),
                            )} pr-11`}
                          />

                          <ValidTick
                            show={Boolean(
                              nameValid,
                            )}
                          />
                        </div>
                      </Field>

                      <Field
                        id={FIELD_IDS.phone}
                        label="Phone / WhatsApp"
                        required
                        error={errorOf(
                          "phone",
                        )}
                        hint="We will call or WhatsApp you on this number."
                      >
                        <div className="relative">
                          <input
                            id={FIELD_IDS.phone}
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            enterKeyHint="next"
                            placeholder="10-digit number"
                            value={form.phone}
                            onChange={
                              handleChange
                            }
                            onBlur={handleBlur}
                            disabled={loading}
                            aria-invalid={
                              errorOf("phone")
                                ? "true"
                                : undefined
                            }
                            aria-describedby={describedBy(
                              "phone",
                              "We will call or WhatsApp you on this number.",
                            )}
                            className={`${inputClass(
                              Boolean(
                                errorOf("phone"),
                              ),
                            )} pr-11`}
                          />

                          <ValidTick
                            show={Boolean(
                              phoneValid,
                            )}
                          />
                        </div>
                      </Field>
                    </div>

                    {/* Package pickers */}

                    {showPickers && (
                      <div className="space-y-5">
                        {showPackageType && (
                          <Field
                            id="enquiry-package-type"
                            label="Trip type"
                          >
                            <div className="relative">
                              <select
                                id="enquiry-package-type"
                                name="package_type"
                                value={
                                  form.package_type
                                }
                                onChange={
                                  handlePackageTypeChange
                                }
                                disabled={
                                  loading
                                }
                                className={`${inputClass(
                                  false,
                                )} cursor-pointer appearance-none pr-11`}
                              >
                                {PACKAGE_TYPE_OPTIONS.map(
                                  (
                                    option,
                                  ) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              <ChevronDown
                                className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                                aria-hidden="true"
                              />
                            </div>
                          </Field>
                        )}

                        <Field
                          id={
                            FIELD_IDS.package_id
                          }
                          label="Package"
                          required
                          error={errorOf(
                            "package_id",
                          )}
                        >
                          <div className="relative">
                            <select
                              id={
                                FIELD_IDS.package_id
                              }
                              name="package_id"
                              value={
                                form.package_id
                              }
                              onChange={
                                handlePackageChange
                              }
                              onBlur={
                                handleBlur
                              }
                              disabled={
                                loading ||
                                (packagesLoading &&
                                  !selectedPackage) ||
                                (filteredPackages.length ===
                                  0 &&
                                  !selectedPackage)
                              }
                              aria-invalid={
                                errorOf(
                                  "package_id",
                                )
                                  ? "true"
                                  : undefined
                              }
                              aria-describedby={describedBy(
                                "package_id",
                              )}
                              className={`${inputClass(
                                Boolean(
                                  errorOf(
                                    "package_id",
                                  ),
                                ),
                              )} cursor-pointer appearance-none pr-11`}
                            >
                              <option value="">
                                {packagesLoading &&
                                packages.length ===
                                  0
                                  ? "Loading packages..."
                                  : filteredPackages.length ===
                                      0
                                    ? destinationId !=
                                      null
                                      ? "No packages for this destination"
                                      : "No packages available"
                                    : "Select a package"}
                              </option>

                              {selectedPackage &&
                                !filteredPackages.some(
                                  (item) =>
                                    String(
                                      item?.id,
                                    ) ===
                                    String(
                                      selectedPackage?.id,
                                    ),
                                ) && (
                                  <option
                                    value={
                                      selectedPackage.id
                                    }
                                  >
                                    {
                                      selectedPackage.title
                                    }

                                    {selectedPackage.destination
                                      ? ` — ${selectedPackage.destination}`
                                      : ""}
                                  </option>
                                )}

                              {filteredPackages.map(
                                (item) => (
                                  <option
                                    key={item.id}
                                    value={
                                      item.id
                                    }
                                  >
                                    {item.title}

                                    {item.destination
                                      ? ` — ${item.destination}`
                                      : ""}
                                  </option>
                                ),
                              )}
                            </select>

                            <ChevronDown
                              className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                              aria-hidden="true"
                            />
                          </div>
                        </Field>

                        {selectedPackage && (
                          <TripSummary
                            title={
                              selectedPackage.title
                            }
                            destination={
                              selectedPackage.destination
                            }
                            typeLabel={
                              PACKAGE_TYPE_LABELS[
                                selectedPackage
                                  .package_type
                              ] || ""
                            }
                            days={
                              selectedPackage.duration_days
                            }
                            image={getImageUrl(
                              selectedPackage
                                ?.images?.[0],
                            )}
                          />
                        )}
                      </div>
                    )}

                    {/* ==================================================
                        ADULTS + KIDS
                    ================================================== */}

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Adults */}

                      <Field
                        id={FIELD_IDS.adults}
                        label="Adults"
                        required
                        error={errorOf(
                          "adults",
                        )}
                      >
                        <div
                          className={`flex h-12 items-stretch overflow-hidden rounded-xl border bg-input transition-all duration-200 focus-within:ring-4 ${
                            errorOf("adults")
                              ? "border-error bg-error-bg/30 focus-within:border-error focus-within:ring-error/10"
                              : "border-border hover:border-border-strong focus-within:border-accent focus-within:ring-accent/10"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              adjustAdults(-1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.adults,
                              ) <= 1
                            }
                            aria-label="Decrease adults"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Minus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>

                          <input
                            id={
                              FIELD_IDS.adults
                            }
                            name="adults"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            value={form.adults}
                            onChange={(event) =>
                              handleNumberInput(
                                "adults",
                                event,
                              )
                            }
                            onBlur={handleBlur}
                            disabled={loading}
                            aria-invalid={
                              errorOf(
                                "adults",
                              )
                                ? "true"
                                : undefined
                            }
                            aria-describedby={describedBy(
                              "adults",
                            )}
                            className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular-nums text-text-dark outline-none disabled:text-muted"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              adjustAdults(1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.adults,
                              ) >= 100
                            }
                            aria-label="Increase adults"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Plus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </Field>

                      {/* Kids */}

                      <Field
                        id={FIELD_IDS.kids}
                        label="Kids"
                        required
                        error={errorOf(
                          "kids",
                        )}
                        hint="Enter 0 if there are no kids."
                      >
                        <div
                          className={`flex h-12 items-stretch overflow-hidden rounded-xl border bg-input transition-all duration-200 focus-within:ring-4 ${
                            errorOf("kids")
                              ? "border-error bg-error-bg/30 focus-within:border-error focus-within:ring-error/10"
                              : "border-border hover:border-border-strong focus-within:border-accent focus-within:ring-accent/10"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              adjustKids(-1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.kids,
                              ) <= 0
                            }
                            aria-label="Decrease kids"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Minus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>

                          <input
                            id={FIELD_IDS.kids}
                            name="kids"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            value={form.kids}
                            onChange={(event) =>
                              handleNumberInput(
                                "kids",
                                event,
                              )
                            }
                            onBlur={handleBlur}
                            disabled={loading}
                            aria-invalid={
                              errorOf("kids")
                                ? "true"
                                : undefined
                            }
                            aria-describedby={describedBy(
                              "kids",
                              "Enter 0 if there are no kids.",
                            )}
                            className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular-nums text-text-dark outline-none disabled:text-muted"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              adjustKids(1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.kids,
                              ) >= 100
                            }
                            aria-label="Increase kids"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Plus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </Field>
                    </div>

                    {/* ==================================================
                        NIGHTS + DATE
                    ================================================== */}

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Nights */}

                      <Field
                        id={FIELD_IDS.nights}
                        label="Nights"
                        required
                        error={errorOf(
                          "nights",
                        )}
                      >
                        <div
                          className={`flex h-12 items-stretch overflow-hidden rounded-xl border bg-input transition-all duration-200 focus-within:ring-4 ${
                            errorOf("nights")
                              ? "border-error bg-error-bg/30 focus-within:border-error focus-within:ring-error/10"
                              : "border-border hover:border-border-strong focus-within:border-accent focus-within:ring-accent/10"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              adjustNights(-1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.nights,
                              ) <= 1
                            }
                            aria-label="Decrease nights"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Minus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>

                          <input
                            id={
                              FIELD_IDS.nights
                            }
                            name="nights"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            value={form.nights}
                            onChange={(event) =>
                              handleNumberInput(
                                "nights",
                                event,
                              )
                            }
                            onBlur={handleBlur}
                            disabled={loading}
                            aria-invalid={
                              errorOf(
                                "nights",
                              )
                                ? "true"
                                : undefined
                            }
                            aria-describedby={describedBy(
                              "nights",
                            )}
                            className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular-nums text-text-dark outline-none disabled:text-muted"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              adjustNights(1)
                            }
                            disabled={
                              loading ||
                              Number(
                                form.nights,
                              ) >= 365
                            }
                            aria-label="Increase nights"
                            className="flex w-11 shrink-0 items-center justify-center text-primary transition-colors hover:bg-surface-soft active:bg-primary-lighter disabled:text-placeholder disabled:hover:bg-transparent"
                          >
                            <Plus
                              size={18}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </Field>

                      {/* Travel date */}

                      <Field
                        id={
                          FIELD_IDS.travel_date
                        }
                        label="Travel date"
                        required
                        error={errorOf(
                          "travel_date",
                        )}
                        hint={
                          batch?.departure_date
                            ? "Set to this trip's departure date."
                            : "An approximate date is fine."
                        }
                      >
                        <input
                          id={
                            FIELD_IDS.travel_date
                          }
                          name="travel_date"
                          type="date"
                          min={
                            !batch?.departure_date
                              ? getTodayForDateInput()
                              : undefined
                          }
                          value={
                            form.travel_date
                          }
                          onChange={
                            handleChange
                          }
                          onBlur={handleBlur}
                          disabled={
                            loading ||
                            Boolean(
                              batch?.departure_date,
                            )
                          }
                          aria-invalid={
                            errorOf(
                              "travel_date",
                            )
                              ? "true"
                              : undefined
                          }
                          aria-describedby={describedBy(
                            "travel_date",
                            batch?.departure_date
                              ? "Set to this trip's departure date."
                              : "An approximate date is fine.",
                          )}
                          className={`${inputClass(
                            Boolean(
                              errorOf(
                                "travel_date",
                              ),
                            ),
                          )} min-h-[3rem] appearance-none text-left [color-scheme:light]`}
                        />
                      </Field>
                    </div>

                    {/* ==================================================
                        REQUIREMENTS
                    ================================================== */}

                    <Field
                      id="enquiry-message"
                      label="Requirements"
                      optional
                    >
                      <textarea
                        id="enquiry-message"
                        name="message"
                        rows={4}
                        maxLength={3000}
                        placeholder="Pickup city, hotel preference, special occasion, anything we should know."
                        value={form.message}
                        onChange={handleChange}
                        disabled={loading}
                        className={inputClass(
                          false,
                          "min-h-[110px] resize-y py-3",
                        )}
                      />

                      {form.message.length >=
                        2500 && (
                        <p className="mt-1.5 text-right text-xs text-muted">
                          {form.message.length}
                          /3000
                        </p>
                      )}
                    </Field>
                  </div>
                </div>

                {/* ==================================================
                    STICKY FOOTER
                ================================================== */}

                <div className="shrink-0 border-t border-primary/10 bg-white/90 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6 sm:pb-5 sm:pt-4">
                  {error && (
                    <div
                      className="mb-3 flex items-start gap-2 rounded-xl border border-error/20 bg-error-bg px-3 py-2.5 text-sm leading-relaxed text-error-text"
                      role="alert"
                    >
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <span>
                        {error}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className={`hidden h-12 items-center justify-center rounded-xl px-6 text-[13px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex ${OUTLINE_BUTTON} ${FOCUS_RING}`}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-7 text-[13px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100 sm:w-auto sm:min-w-[12rem] ${PRIMARY_BUTTON} ${FOCUS_RING}`}
                    >
                      {loading ? (
                        <>
                          <Loader2
                            className="h-[18px] w-[18px] animate-spin"
                            aria-hidden="true"
                          />

                          Sending...
                        </>
                      ) : (
                        <>
                          <Send
                            className="h-[17px] w-[17px]"
                            aria-hidden="true"
                          />

                          Send enquiry
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-2.5 text-center text-xs leading-relaxed text-muted sm:text-right">
                    This is an enquiry
                    only. No payment is
                    needed.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}



