

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { createEnquiry } from "../api/enquiries";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import generatePackagePDF from "../components/PackageItineraryPDF";

// ============================================================
// PACKAGE TYPE OPTIONS
// ============================================================

const PACKAGE_TYPE_OPTIONS = [
  {
    value: "all",
    label: "All Packages",
  },
  {
    value: "pilgrimage",
    label: "Pilgrimage",
  },
  {
    value: "mountains_adventure",
    label: "Mountains & Adventure",
  },
  {
    value: "family",
    label: "Family",
  },
  {
    value: "beach",
    label: "Beach",
  },
  {
    value: "romantic",
    label: "Romantic Sites",
  },
  {
    value: "wildlife_nature",
    label: "Wildlife & Nature",
  },
  {
    value: "international",
    label: "International",
  },
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

// ============================================================
// API BASE URL
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL 

// ============================================================
// HELPERS
// ============================================================

const normalizePackagesResponse = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.packages)) {
    return data.packages;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.msg || item?.message || "Invalid input";
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Failed to submit enquiry. Please try again.";
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

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
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object" && image.url) {
    return image.url;
  }

  return "";
};

// ============================================================
// FIELD VALIDATION
// ============================================================

const validateName = (value) => {
  const name = value.trim();

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
    return "Please enter valid name";
  }

  return "";
};

const validatePhone = (value) => {
  const phone = value.trim();

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

const validateTravellers = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "Please enter the number of travellers.";
  }

  const travellers = Number(value);

  if (!Number.isInteger(travellers)) {
    return "Number of travellers must be a whole number.";
  }

  if (travellers < 1) {
    return "At least 1 traveller is required.";
  }

  if (travellers > 100) {
    return "Number of travellers cannot exceed 100.";
  }

  return "";
};

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;


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



const validatePackage = (value) => {
  if (!value) {
    return "Please select a package.";
  }

  return "";
};

// ============================================================
// COMPONENT
// ============================================================

export default function EnquiryForm({
  pkg = null,
  batch = null,
  destination = null,
  onClose,
  onSuccess,
  downloadItinerary = false,
  showPackageType = true,
}) {
  // ----------------------------------------------------------
  // INITIAL PACKAGE
  // ----------------------------------------------------------

  const initialPackage = pkg || batch?.package || null;

  // ----------------------------------------------------------
  // BUILD INITIAL FORM
  // ----------------------------------------------------------

  const buildInitialForm = () => ({
    name: "",
    phone: "",
    package_type: initialPackage?.package_type || "all",
    package_id:
      initialPackage?.id != null
        ? String(initialPackage.id)
        : batch?.package_id != null
          ? String(batch.package_id)
          : "",
    travellers: "",
    travel_date: batch?.departure_date || "",
    message: "",
  });

  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [form, setForm] = useState(buildInitialForm);

  // ----------------------------------------------------------
  // FIELD ERROR STATE
  // ----------------------------------------------------------

  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    phone: "",
    package_id: "",
    travellers: "",
    travel_date: "",
  });

  // Track whether a field has been interacted with.
  // This prevents errors from appearing immediately when
  // the modal first opens.
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    package_type: false,
    package_id: false,
    travellers: false,
    travel_date: false,
  });

  // ----------------------------------------------------------
  // OTHER STATE
  // ----------------------------------------------------------

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submitLockRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  // ==========================================================
  // VALIDATE ONE FIELD
  // ==========================================================

  const validateField = (field, value, currentForm = form) => {
    switch (field) {
      case "name":
        return validateName(value);

      case "phone":
        return validatePhone(value);

      case "package_id":
        return validatePackage(value);

      case "travellers":
        return validateTravellers(value);

      case "travel_date":
        return validateTravelDate(
          value,
          Boolean(batch?.departure_date)
        );

      default:
        return "";
    }
  };

  // ==========================================================
  // VALIDATE ALL FIELDS
  // ==========================================================

  const validateAllFields = () => {
    const errors = {
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      package_id: validatePackage(form.package_id),
      travellers: validateTravellers(form.travellers),
      travel_date: validateTravelDate(
        form.travel_date,
        Boolean(batch?.departure_date)
      ),
    };

    setFieldErrors(errors);

    setTouched({
      name: true,
      phone: true,
      package_id: true,
      travellers: true,
      travel_date: true,
    });

    return errors;
  };

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setForm(buildInitialForm());

    setFieldErrors({
      name: "",
      phone: "",
      package_id: "",
      travellers: "",
      travel_date: "",
    });

    setTouched({
      name: false,
      phone: false,
      package_type: false,
      package_id: false,
      travellers: false,
      travel_date: false,
    });

    setError("");
    setSuccess(false);
    setLoading(false);

    submitLockRef.current = false;
    hasSubmittedRef.current = false;
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    resetForm();
    onClose?.();
  };

  // ==========================================================
  // LOAD PUBLISHED PACKAGES
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      setPackagesLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/packages`);

        if (!response.ok) {
          throw new Error(
            `Failed to load packages (${response.status})`
          );
        }

        const data = await response.json();

        const normalized = normalizePackagesResponse(data);

        const publishedPackages = normalized.filter(
          (item) =>
            item?.id != null &&
            (item?.status === "published" ||
              item?.status == null)
        );

        if (mounted) {
          setPackages(publishedPackages);
        }
      } catch (err) {
        console.error("Failed to load packages:", err);

        if (mounted) {
          setPackages([]);
        }
      } finally {
        if (mounted) {
          setPackagesLoading(false);
        }
      }
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // PREFILL PACKAGE / BATCH
  // ==========================================================

  useEffect(() => {
    const selectedPackage =
      pkg || batch?.package || null;

    setForm((prev) => ({
      ...prev,

      package_type:
        selectedPackage?.package_type ||
        prev.package_type ||
        "all",

      package_id:
        selectedPackage?.id != null
          ? String(selectedPackage.id)
          : batch?.package_id != null
            ? String(batch.package_id)
            : prev.package_id || "",

      travel_date:
        batch?.departure_date ||
        prev.travel_date ||
        "",
    }));
  }, [pkg, batch]);

  // ==========================================================
  // DESTINATION ID
  // ==========================================================

  const destinationId =
    destination?.destination_id ??
    destination?.id ??
    null;

  // ==========================================================
  // FILTER PACKAGES
  // ==========================================================

  const filteredPackages = useMemo(() => {
    let result = packages;

    if (destinationId != null) {
      result = result.filter(
        (item) =>
          String(item?.destination_id) ===
          String(destinationId)
      );
    }

    if (
      showPackageType &&
      form.package_type &&
      form.package_type !== "all"
    ) {
      result = result.filter(
        (item) =>
          item?.package_type === form.package_type
      );
    }

    return result;
  }, [
    packages,
    destinationId,
    showPackageType,
    form.package_type,
  ]);

  // ==========================================================
  // KEEP PRESELECTED PACKAGE VALID
  // ==========================================================

  useEffect(() => {
    if (
      packagesLoading ||
      !form.package_id
    ) {
      return;
    }

    const stillAvailable = filteredPackages.some(
      (item) =>
        String(item?.id) ===
        String(form.package_id)
    );

    if (!stillAvailable) {
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
  ]);

  // ==========================================================
  // SELECTED PACKAGE
  // ==========================================================

  const selectedPackage = useMemo(() => {
    return packages.find(
      (item) =>
        String(item?.id) ===
        String(form?.package_id)
    );
  }, [packages, form?.package_id]);

  // ==========================================================
  // FORM TITLE
  // ==========================================================

  const formTitle = batch
    ? "Enquire About This Trip"
    : pkg
      ? "Enquire About This Package"
      : destination
        ? `Plan Your ${
            destination?.place_name ||
            destination?.name ||
            "Trip"
          }`
        : "Plan Your Trip";

  // ==========================================================
  // FORM SUBTITLE
  // ==========================================================

  const formSubtitle = batch
    ? "Share your details and our travel team will get back to you."
    : pkg
      ? "Tell us your travel requirements and we'll help you plan."
      : destination
        ? "Choose a package from this destination and send us your requirements."
        : "Tell us about your trip and we'll help you plan it.";

  // ==========================================================
  // INPUT HANDLER
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark the field as touched immediately when user types.
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate immediately while typing.
    const validationError = validateField(
      name,
      value,
      {
        ...form,
        [name]: value,
      }
    );

    setFieldErrors((prev) => ({
      ...prev,
      [name]: validationError,
    }));

    // Clear general API error when user starts correcting fields.
    if (error) {
      setError("");
    }
  };

  // ==========================================================
  // BLUR VALIDATION
  // ==========================================================

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validationError = validateField(
      name,
      value,
      form
    );

    setFieldErrors((prev) => ({
      ...prev,
      [name]: validationError,
    }));
  };

  // ==========================================================
  // PACKAGE TYPE HANDLER
  // ==========================================================

  const handlePackageTypeChange = (e) => {
    const packageType = e.target.value;

    setForm((prev) => ({
      ...prev,
      package_type: packageType,
      package_id: "",
    }));

    setTouched((prev) => ({
      ...prev,
      package_id: true,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      package_id: "Please select a package.",
    }));

    if (error) {
      setError("");
    }
  };

  // ==========================================================
  // PACKAGE HANDLER
  // ==========================================================

  const handlePackageChange = (e) => {
    const packageId = e.target.value;

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
      package_id: validatePackage(packageId),
    }));

    if (error) {
      setError("");
    }
  };

  // ==========================================================
  // SUBMIT ERROR
  // ==========================================================

  const showSubmitError = (message) => {
    setError(message);
    toast.error(message);
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      submitLockRef.current ||
      hasSubmittedRef.current ||
      loading ||
      success
    ) {
      return;
    }

    // Validate everything BEFORE sending API request.
    const validationErrors = validateAllFields();

    const hasErrors = Object.values(validationErrors).some(
      Boolean
    );

    if (hasErrors) {
      const firstError =
        Object.values(validationErrors).find(Boolean);

      setError(firstError || "Please correct the highlighted fields.");

      toast.error(
        firstError ||
          "Please correct the highlighted fields."
      );

      return;
    }

    submitLockRef.current = true;

    setLoading(true);
    setError("");

    try {
      const name = form.name.trim();
      const phone = form.phone.trim();
      const travellers = Number(form.travellers);

      const packageForSubmit =
        selectedPackage ||
        packages.find(
          (item) =>
            String(item?.id) ===
            String(form.package_id)
        );

      if (!packageForSubmit) {
        const message = "Please select a valid package.";

        setFieldErrors((prev) => ({
          ...prev,
          package_id: message,
        }));

        showSubmitError(message);
        setLoading(false);
        submitLockRef.current = false;

        return;
      }

        const resolvedPackageType =
        packageForSubmit.package_type ||
        pkg?.package_type ||
        batch?.package?.package_type ||
        (form.package_type && form.package_type !== "all"
          ? form.package_type
          : "general");

      const payload = {
        package_id: Number(form.package_id) || pkg?.id || batch?.package_id || null,
        batch_id: batch?.id ?? null,
        package_type: resolvedPackageType,
        name,
        phone,
        travellers,
        travel_date: batch?.departure_date || form.travel_date || null,
        message: form.message.trim() || null,
      };
      

      console.log(
        "Submitting enquiry:",
        payload
      );

      const response = await createEnquiry(payload);

      console.log(
        "Enquiry submitted:",
        response
      );

      hasSubmittedRef.current = true;

      setSuccess(true);

      toast.success(
        "Enquiry submitted successfully!",
        {
          autoClose: 3500,
        }
      );

      // ------------------------------------------------------
      // NOTIFY PARENT
      // ------------------------------------------------------

      if (typeof onSuccess === "function") {
        try {
          await onSuccess();
        } catch (callbackError) {
          console.error(
            "Post-enquiry success callback failed:",
            callbackError
          );
        }
      }

      // ------------------------------------------------------
      // OPTIONAL PDF
      // ------------------------------------------------------

      if (
        downloadItinerary &&
        pkg
      ) {
        try {
          await generatePackagePDF(pkg);
        } catch (pdfError) {
          console.error(
            "Package PDF generation failed:",
            pdfError
          );
        }
      }

      // ------------------------------------------------------
      // CLOSE AFTER SUCCESS
      // ------------------------------------------------------

      setTimeout(() => {
        resetForm();
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error(
        "Enquiry submission failed:",
        err
      );

      const message = getErrorMessage(err);

      showSubmitError(message);
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  };

  // ==========================================================
  // INPUT CLASS HELPER
  // ==========================================================

  const getInputClass = (field) => {
    const hasError =
      touched[field] && fieldErrors[field];

    return `
      w-full
      min-w-0
      px-3
      sm:px-4
      py-2.5
      sm:py-3
      rounded-xl
      border
      outline-none
      text-sm
      sm:text-base
      text-[#061B45]
      bg-white
      placeholder:text-gray-400
      transition
      disabled:bg-gray-100
      ${
        hasError
          ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
          : "border-gray-200 focus:border-[#061B45] focus:ring-2 focus:ring-[#061B45]/10"
      }
    `;
  };

  // ==========================================================
  // ERROR MESSAGE
  // ==========================================================

  const FieldError = ({ field }) => {
    if (!touched[field] || !fieldErrors[field]) {
      return null;
    }

    return (
      <p
        className="mt-1.5 text-xs sm:text-sm text-red-600 leading-relaxed"
        role="alert"
      >
        {fieldErrors[field]}
      </p>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastStyle={{
          zIndex: 9999,
        }}
      />

      <div
        className="
          fixed inset-0
          z-[100]
          bg-black/60
          backdrop-blur-sm
          p-3 sm:p-4
          overflow-y-auto
        "
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            handleClose();
          }
        }}
      >
        <div
          className="
            relative
            w-full
            max-w-2xl
            mx-auto
            my-3
            sm:my-6
            lg:my-8
            bg-white
            rounded-2xl
            sm:rounded-3xl
            shadow-2xl
            overflow-hidden
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              sticky
              top-0
              z-20
              bg-white
              border-b
              border-gray-100
              px-4
              sm:px-6
              py-3.5
              sm:py-4
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div className="min-w-0 pr-2">
              <h2
                className="
                  text-lg
                  sm:text-xl
                  lg:text-2xl
                  font-bold
                  text-[#061B45]
                  leading-tight
                "
              >
                {formTitle}
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  sm:text-sm
                  text-gray-500
                  leading-relaxed
                "
              >
                {formSubtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="
                shrink-0
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                bg-gray-50
                hover:bg-gray-100
                text-gray-600
                hover:text-[#061B45]
                flex
                items-center
                justify-center
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              aria-label="Close enquiry form"
            >
              <X
                size={19}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <div
            className="
              px-4
              sm:px-6
              py-5
              sm:py-6
            "
          >
            {/* =================================================
                BATCH SUMMARY
            ================================================= */}

            {batch && (
              <div
                className="
                  mb-5
                  rounded-xl
                  sm:rounded-2xl
                  border
                  border-[#061B45]/10
                  bg-[#061B45]/[0.035]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >
                  <div
                    className="
                      shrink-0
                      w-10
                      h-10
                      rounded-xl
                      bg-[#061B45]
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <CalendarDays size={19} />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-sm
                        font-bold
                        text-[#061B45]
                      "
                    >
                      {batch?.package?.title ||
                        batch?.title ||
                        pkg?.title ||
                        "Selected Trip"}
                    </p>

                    {(batch?.package?.destination ||
                      batch?.destination) && (
                      <p
                        className="
                          mt-0.5
                          text-xs
                          sm:text-sm
                          text-gray-600
                        "
                      >
                        {batch?.package?.destination ||
                          batch?.destination}
                      </p>
                    )}

                    {batch?.departure_date && (
                      <p
                        className="
                          mt-1
                          text-xs
                          sm:text-sm
                          font-medium
                          text-[#061B45]
                        "
                      >
                        Departure:{" "}
                        {formatDate(
                          batch.departure_date
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-green-200
                  bg-green-50
                  px-4
                  py-3.5
                  flex
                  items-start
                  gap-3
                "
              >
                <CheckCircle2
                  className="
                    mt-0.5
                    shrink-0
                    text-green-600
                  "
                  size={20}
                />

                <div>
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-green-800
                    "
                  >
                    Enquiry submitted successfully.
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      sm:text-sm
                      text-green-700
                    "
                  >
                    Our travel team will contact you soon.
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                GENERAL ERROR
            ================================================= */}

            {error && (
              <div
                className="
                  mb-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3.5
                  flex
                  items-start
                  gap-3
                "
              >
                <AlertCircle
                  className="
                    mt-0.5
                    shrink-0
                    text-red-600
                  "
                  size={20}
                />

                <p
                  className="
                    text-sm
                    leading-relaxed
                    text-red-700
                  "
                >
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div
                className="
                  space-y-4
                  sm:space-y-5
                "
              >
                {/* =================================================
                    FULL NAME
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-name"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Full Name
                    <span
                      className="
                        ml-1
                        text-[#FF3B0B]
                      "
                    >
                      *
                    </span>
                  </label>

                  <input
                    id="enquiry-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading || success}
                    className={getInputClass("name")}
                  />

                  <FieldError field="name" />
                </div>

                {/* =================================================
                    PHONE
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-phone"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Phone Number / WhatsApp Number
                    <span className="ml-1 text-[#FF3B0B]">
                      *
                    </span>
                  </label>

                  <input
                    id="enquiry-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone or WhatsApp number"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading || success}
                    className={getInputClass("phone")}
                  />

                  <FieldError field="phone" />
                </div>

                {/* =================================================
                    PACKAGE TYPE
                ================================================= */}

                {showPackageType && (
                  <div>
                    <label
                      htmlFor="enquiry-package-type"
                      className="
                        block
                        mb-1.5
                        text-sm
                        font-semibold
                        text-[#061B45]
                      "
                    >
                      Package Type
                      <span className="ml-1 text-[#FF3B0B]">
                        *
                      </span>
                    </label>

                    <select
                      id="enquiry-package-type"
                      name="package_type"
                      value={form.package_type}
                      onChange={handlePackageTypeChange}
                      onBlur={handleBlur}
                      disabled={loading || success}
                      className={getInputClass(
                        "package_type"
                      )}
                    >
                      {PACKAGE_TYPE_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                    </select>

                    <FieldError field="package_type" />
                  </div>
                )}

                {/* =================================================
                    SELECT PACKAGE
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-package"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Select Package
                    <span className="ml-1 text-[#FF3B0B]">
                      *
                    </span>
                  </label>

                  <select
                    id="enquiry-package"
                    name="package_id"
                    value={form.package_id}
                    onChange={handlePackageChange}
                    onBlur={handleBlur}
                    disabled={
                      loading ||
                      success ||
                      packagesLoading ||
                      filteredPackages.length === 0
                    }
                    className={getInputClass(
                      "package_id"
                    )}
                  >
                    <option value="">
                      {packagesLoading
                        ? "Loading packages..."
                        : filteredPackages.length === 0
                          ? destinationId != null
                            ? "No packages available for this destination"
                            : "No packages available"
                          : "Select a package"}
                    </option>

                    {filteredPackages.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.title}

                          {item.destination
                            ? ` — ${item.destination}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  <FieldError field="package_id" />

                  {/* SELECTED PACKAGE */}

                  {selectedPackage && (
                    <div
                      className="
                        mt-2.5
                        rounded-xl
                        border
                        border-gray-100
                        bg-gray-50
                        p-3
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        {getImageUrl(
                          selectedPackage?.images?.[0]
                        ) && (
                          <img
                            src={getImageUrl(
                              selectedPackage.images[0]
                            )}
                            alt={
                              selectedPackage.title ||
                              "Selected package"
                            }
                            className="
                              w-12
                              h-12
                              rounded-lg
                              object-cover
                              shrink-0
                            "
                          />
                        )}

                        <div className="min-w-0">
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-[#061B45]
                              truncate
                            "
                          >
                            {selectedPackage.title}
                          </p>

                          <div
                            className="
                              mt-0.5
                              flex
                              flex-wrap
                              items-center
                              gap-x-2
                              gap-y-1
                              text-xs
                              text-gray-500
                            "
                          >
                            {selectedPackage.destination && (
                              <span>
                                {selectedPackage.destination}
                              </span>
                            )}

                            {selectedPackage.package_type && (
                              <>
                                {selectedPackage.destination && (
                                  <span>•</span>
                                )}

                                <span>
                                  {PACKAGE_TYPE_LABELS[
                                    selectedPackage.package_type
                                  ] ||
                                    selectedPackage.package_type}
                                </span>
                              </>
                            )}

                            {selectedPackage.duration_days && (
                              <>
                                <span>•</span>

                                <span>
                                  {
                                    selectedPackage.duration_days
                                  }{" "}
                                  {selectedPackage.duration_days ===
                                  1
                                    ? "Day"
                                    : "Days"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    TRAVELLERS
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-travellers"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Travellers
                    <span className="ml-1 text-[#FF3B0B]">
                      *
                    </span>
                  </label>

                  <input
                    id="enquiry-travellers"
                    name="travellers"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    placeholder="Number of travellers"
                    value={form.travellers}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading || success}
                    className={getInputClass(
                      "travellers"
                    )}
                  />

                  <FieldError field="travellers" />
                </div>

                {/* =================================================
                    TRAVEL DATE
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-travel-date"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Travel Date
                    <span className="ml-1 text-[#FF3B0B]">
                      *
                    </span>
                  </label>

                  <input
                    id="enquiry-travel-date"
                    name="travel_date"
                    type="date"
                    min={
                      !batch?.departure_date
                        ? new Date()
                            .toISOString()
                            .split("T")[0]
                        : undefined
                    }
                    value={form.travel_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={
                      loading ||
                      success ||
                      Boolean(
                        batch?.departure_date
                      )
                    }
                    className={getInputClass(
                      "travel_date"
                    )}
                  />

                  <FieldError field="travel_date" />

                  {batch?.departure_date && (
                    <p
                      className="
                        mt-1.5
                        text-xs
                        text-gray-500
                      "
                    >
                      This date is set to the selected
                      trip's departure date.
                    </p>
                  )}
                </div>

                {/* =================================================
                    REQUIREMENTS
                ================================================= */}

                <div>
                  <label
                    htmlFor="enquiry-message"
                    className="
                      block
                      mb-1.5
                      text-sm
                      font-semibold
                      text-[#061B45]
                    "
                  >
                    Requirements
                    <span
                      className="
                        ml-1
                        text-xs
                        font-normal
                        text-gray-400
                      "
                    >
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="enquiry-message"
                    name="message"
                    rows={4}
                    placeholder="Any specific requirements, preferences, pickup location, room preferences, or other details?"
                    value={form.message}
                    onChange={handleChange}
                    disabled={loading || success}
                    className="
                      w-full
                      min-w-0
                      px-3
                      sm:px-4
                      py-2.5
                      sm:py-3
                      rounded-xl
                      border
                      border-gray-200
                      outline-none
                      resize-y
                      min-h-[105px]
                      sm:min-h-[115px]
                      text-sm
                      sm:text-base
                      text-[#061B45]
                      bg-white
                      placeholder:text-gray-400
                      focus:border-[#061B45]
                      focus:ring-2
                      focus:ring-[#061B45]/10
                      transition
                      disabled:bg-gray-100
                    "
                  />
                </div>
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div
                className="
                  mt-6
                  pt-5
                  border-t
                  border-gray-100
                  flex
                  flex-col-reverse
                  sm:flex-row
                  sm:justify-end
                  gap-2.5
                  sm:gap-3
                "
              >
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="
                    w-full
                    sm:w-auto
                    min-h-[46px]
                    px-5
                    py-2.5
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-[#061B45]
                    text-sm
                    sm:text-base
                    font-semibold
                    hover:bg-gray-50
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    success ||
                    hasSubmittedRef.current
                  }
                  aria-busy={loading}
                  className="
                    w-full
                    sm:w-auto
                    min-h-[46px]
                    px-5
                    py-2.5
                    rounded-xl
                    bg-[#061B45]
                    text-white
                    text-sm
                    sm:text-base
                    font-semibold
                    hover:bg-[#0B2559]
                    active:bg-[#03112D]
                    transition
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-md
                    hover:shadow-lg
                  "
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Submitting...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={18} />
                      Submitted
                    </>
                  ) : (
                    "Submit Enquiry"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

