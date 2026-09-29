import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Heart,
  Loader2,
  MapPin,
  GripVertical,
  ImagePlus,
  Star,
  CalendarDays,
  Link as LinkIcon,
  FileText,
  Sparkles,
} from "lucide-react";

import {
  getHappyMoments,
  createHappyMoment,
  updateHappyMoment,
  deleteHappyMoment,
} from "../../api/content";

import { uploadImage } from "../../api/adminUsers";
import ImageUploadField from "../../components/admin/ImageUploadField";


// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM = {
  image: null,
  gallery_images: [],
  title: "",
  slug: "",
  short_caption: "",
  place_name: "",
  place_description: "",
  experience: "",
  highlights: [""],
  travel_date: "",
  display_order: 0,
  is_featured: false,
};


// ============================================================
// SLUG GENERATOR
// ============================================================

const generateSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HappyMomentsManage() {
  const [moments, setMoments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const galleryInputRef = useRef(null);


  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchMoments = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getHappyMoments();

      setMoments(
        Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                (a?.display_order ?? 0) -
                (b?.display_order ?? 0)
            )
          : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to load happy moments."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMoments();
  }, []);


  // ==========================================================
  // OPEN ADD
  // ==========================================================

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      highlights: [""],
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const openEdit = (moment) => {
    setEditingId(moment.id);

    setForm({
      image: moment?.image || null,

      gallery_images: Array.isArray(moment?.gallery_images)
        ? moment.gallery_images
        : [],

      title: moment?.title || "",

      slug: moment?.slug || "",

      short_caption:
        moment?.short_caption || "",

      place_name:
        moment?.place_name || "",

      place_description:
        moment?.place_description || "",

      experience:
        moment?.experience || "",

      highlights:
        Array.isArray(moment?.highlights) &&
        moment.highlights.length > 0
          ? moment.highlights
          : [""],

      travel_date:
        moment?.travel_date || "",

      display_order:
        moment?.display_order ?? 0,

      is_featured:
        Boolean(moment?.is_featured),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {
    if (saving || galleryUploading) return;

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };


  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // ==========================================================
  // TITLE CHANGE
  // Generate slug automatically only while creating
  // ==========================================================

  const handleTitleChange = (value) => {
    setForm((prev) => ({
      ...prev,
      title: value,

      slug:
        !editingId || !prev.slug
          ? generateSlug(value)
          : prev.slug,
    }));
  };


  // ==========================================================
  // SLUG CHANGE
  // ==========================================================

  const handleSlugChange = (value) => {
    setForm((prev) => ({
      ...prev,
      slug: generateSlug(value),
    }));
  };


  // ==========================================================
  // HIGHLIGHT CHANGE
  // ==========================================================

  const handleHighlightChange = (index, value) => {
    setForm((prev) => {
      const highlights = [...prev.highlights];

      highlights[index] = value;

      return {
        ...prev,
        highlights,
      };
    });
  };


  // ==========================================================
  // ADD HIGHLIGHT
  // ==========================================================

  const addHighlight = () => {
    setForm((prev) => ({
      ...prev,
      highlights: [
        ...prev.highlights,
        "",
      ],
    }));
  };


  // ==========================================================
  // REMOVE HIGHLIGHT
  // ==========================================================

  const removeHighlight = (index) => {
    setForm((prev) => {
      const highlights = prev.highlights.filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        highlights:
          highlights.length > 0
            ? highlights
            : [""],
      };
    });
  };


  // ==========================================================
  // GALLERY UPLOAD
  // Uses existing uploadImage(file)
  // ==========================================================

  const handleGalleryFiles = async (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) return;

    setGalleryUploading(true);
    setError("");

    try {
      const uploadedImages = [];

      for (const file of files) {
        const result = await uploadImage(file);

        if (result?.url) {
          uploadedImages.push({
            url: result.url,
            public_id: result.public_id || null,
          });
        }
      }

      setForm((prev) => ({
        ...prev,
        gallery_images: [
          ...prev.gallery_images,
          ...uploadedImages,
        ],
      }));
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Gallery image upload failed. Try smaller images."
      );
    } finally {
      setGalleryUploading(false);

      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };


  // ==========================================================
  // REMOVE GALLERY IMAGE
  // ==========================================================

  const removeGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      gallery_images:
        prev.gallery_images.filter(
          (_, i) => i !== index
        ),
    }));
  };


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    if (!form.slug.trim()) {
      return "URL slug is required.";
    }

    if (!form.image?.url) {
      return "Cover image is required.";
    }

    if (!form.title.trim()) {
      return "Title is required.";
    }

    if (
      form.short_caption &&
      form.short_caption.length > 300
    ) {
      return "Short caption must be 300 characters or less.";
    }

    if (
      form.place_description &&
      form.place_description.length > 1000
    ) {
      return "Place description must be 1000 characters or less.";
    }

    if (
      form.experience &&
      form.experience.length > 2000
    ) {
      return "Traveller experience must be 2000 characters or less.";
    }

    return null;
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const cleanedHighlights =
        form.highlights
          .map((item) => item.trim())
          .filter(Boolean);

      const payload = {
        slug: form.slug.trim(),

        image: {
          url: form.image.url,
          public_id:
            form.image.public_id || null,
        },

        gallery_images:
          form.gallery_images.map((image) => ({
            url: image.url,
            public_id:
              image.public_id || null,
          })),

        title:
          form.title.trim() || null,

        short_caption:
          form.short_caption.trim() || null,

        place_name:
          form.place_name.trim() || null,

        place_description:
          form.place_description.trim() || null,

        experience:
          form.experience.trim() || null,

        highlights:
          cleanedHighlights,

        travel_date:
          form.travel_date || null,

        display_order:
          Number(form.display_order) || 0,

        is_featured:
          Boolean(form.is_featured),
      };


      // ======================================================
      // UPDATE
      // ======================================================

      if (editingId) {
        await updateHappyMoment(
          editingId,
          payload
        );

        setSuccess(
          "Happy moment updated successfully."
        );
      }


      // ======================================================
      // CREATE
      // ======================================================

      else {
        await createHappyMoment(payload);

        setSuccess(
          "Happy moment created successfully."
        );
      }

      await fetchMoments();

      setTimeout(() => {
        setShowModal(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 700);
    } catch (err) {
      const detail =
        err?.response?.data?.detail;

      if (
        err?.response?.status === 409
      ) {
        setError(
          detail ||
            "A happy moment with this slug already exists."
        );
      } else if (
        Array.isArray(detail)
      ) {
        setError(
          detail
            .map(
              (item) =>
                item?.msg ||
                "Validation error"
            )
            .join(", ")
        );
      } else {
        setError(
          detail ||
            "Failed to save happy moment."
        );
      }
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this happy moment?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteHappyMoment(id);

      setMoments((prev) =>
        prev.filter(
          (moment) => moment.id !== id
        )
      );

      setSuccess(
        "Happy moment deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to delete happy moment."
      );
    }
  };


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-h-screen bg-surface/30 px-4 py-6 sm:px-6 lg:px-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <Heart
                className="w-6 h-6 text-accent"
                fill="currentColor"
              />

              <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                Happy Moments
              </h1>
            </div>

            <p className="mt-1 text-sm text-navy/60">
              Manage traveller memories displayed on your website.
            </p>
          </div>


          <button
            type="button"
            onClick={openAdd}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-5
              py-3
              rounded-xl
              bg-navy
              text-white
              text-sm
              font-semibold
              hover:bg-secondary
              transition-colors
              shadow-sm
            "
          >
            <Plus className="w-4 h-4" />

            Add Happy Moment
          </button>

        </div>


        {/* ===================================================
            ALERTS
        ==================================================== */}

        {error && !showModal && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && !showModal && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}


        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          </div>
        ) : moments.length === 0 ? (

          <div className="
            mt-8
            rounded-2xl
            border
            border-dashed
            border-navy/15
            bg-white
            p-10
            text-center
          ">
            <Heart className="w-12 h-12 mx-auto text-navy/15" />

            <h2 className="mt-4 text-lg font-semibold text-navy">
              No happy moments yet
            </h2>

            <p className="mt-2 text-sm text-navy/50">
              Add your first traveller memory.
            </p>

            <button
              type="button"
              onClick={openAdd}
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                px-5
                py-2.5
                rounded-lg
                bg-accent
                text-white
                text-sm
                font-semibold
                hover:bg-accent-hover
              "
            >
              <Plus className="w-4 h-4" />
              Add Moment
            </button>
          </div>

        ) : (

          /* =================================================
             MOMENT CARDS
          ================================================== */

          <div className="
            mt-8
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-5
          ">

            {moments.map((moment) => (

              <article
                key={moment.id}
                className="
                  overflow-hidden
                  rounded-2xl
                  bg-white
                  border
                  border-navy/10
                  shadow-sm
                  hover:shadow-md
                  transition-shadow
                "
              >

                {/* IMAGE */}

                <div className="relative aspect-[4/3] bg-surface">

                  {moment?.image?.url ? (
                    <img
                      src={moment.image.url}
                      alt={
                        moment.title ||
                        moment.place_name ||
                        "Happy moment"
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-10 h-10 text-navy/15" />
                    </div>
                  )}


                  {/* FEATURED */}

                  {moment.is_featured && (
                    <div className="
                      absolute
                      top-3
                      left-3
                      inline-flex
                      items-center
                      gap-1.5
                      px-3
                      py-1.5
                      rounded-full
                      bg-accent
                      text-white
                      text-xs
                      font-semibold
                      shadow-sm
                    ">
                      <Star
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                      />

                      Featured
                    </div>
                  )}


                  {/* ORDER */}

                  <div className="
                    absolute
                    top-3
                    right-3
                    inline-flex
                    items-center
                    gap-1
                    px-2.5
                    py-1.5
                    rounded-full
                    bg-white/90
                    backdrop-blur-sm
                    text-navy
                    text-xs
                    font-semibold
                  ">
                    <GripVertical className="w-3 h-3" />

                    {moment.display_order ?? 0}
                  </div>

                </div>


                {/* CONTENT */}

                <div className="p-4 sm:p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      {moment.place_name && (
                        <div className="
                          flex
                          items-center
                          gap-1.5
                          text-accent-hover
                          text-xs
                          font-semibold
                        ">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />

                          <span className="truncate">
                            {moment.place_name}
                          </span>
                        </div>
                      )}


                      <h2 className="
                        mt-2
                        text-base
                        sm:text-lg
                        font-semibold
                        text-navy
                        line-clamp-2
                      ">
                        {moment.title ||
                          "Untitled Happy Moment"}
                      </h2>

                    </div>

                  </div>


                  {/* SHORT CAPTION */}

                  {moment.short_caption && (
                    <p className="
                      mt-3
                      text-sm
                      text-navy/60
                      leading-relaxed
                      line-clamp-2
                    ">
                      {moment.short_caption}
                    </p>
                  )}


                  {/* META */}

                  <div className="
                    mt-4
                    flex
                    flex-wrap
                    items-center
                    gap-3
                    text-xs
                    text-navy/50
                  ">

                    {moment.travel_date && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />

                        {formatDate(
                          moment.travel_date
                        )}
                      </span>
                    )}

                    {moment.gallery_images?.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <ImagePlus className="w-3.5 h-3.5" />

                        {moment.gallery_images.length} photos
                      </span>
                    )}

                  </div>


                  {/* ACTIONS */}

                  <div className="
                    mt-5
                    pt-4
                    border-t
                    border-navy/5
                    flex
                    items-center
                    justify-end
                    gap-2
                  ">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(moment)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        px-3
                        py-2
                        rounded-lg
                        bg-navy/5
                        text-navy
                        text-xs
                        font-semibold
                        hover:bg-navy/10
                        transition-colors
                      "
                    >
                      <Pencil className="w-3.5 h-3.5" />

                      Edit
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(moment.id)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        px-3
                        py-2
                        rounded-lg
                        bg-red-50
                        text-red-600
                        text-xs
                        font-semibold
                        hover:bg-red-100
                        transition-colors
                      "
                    >
                      <Trash2 className="w-3.5 h-3.5" />

                      Delete
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>


      {/* =====================================================
          MODAL
      ====================================================== */}

      {showModal && (

        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-navy/60
          backdrop-blur-sm
          p-3
          sm:p-5
        ">

          <div className="
            w-full
            max-w-4xl
            max-h-[95vh]
            overflow-hidden
            rounded-2xl
            sm:rounded-3xl
            bg-white
            shadow-2xl
            flex
            flex-col
          ">

            {/* MODAL HEADER */}

            <div className="
              flex
              items-center
              justify-between
              gap-4
              px-5
              py-4
              sm:px-6
              border-b
              border-navy/10
              shrink-0
            ">

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-navy">
                  {editingId
                    ? "Edit Happy Moment"
                    : "Add Happy Moment"}
                </h2>

                <p className="mt-0.5 text-xs sm:text-sm text-navy/50">
                  Add the content visitors will see on the detail page.
                </p>
              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  galleryUploading
                }
                className="
                  w-9
                  h-9
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-navy/60
                  hover:bg-navy/5
                  hover:text-navy
                  disabled:opacity-40
                "
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            {/* MODAL BODY */}

            <form
              onSubmit={handleSubmit}
              className="
                overflow-y-auto
                px-5
                py-5
                sm:px-6
                sm:py-6
              "
            >

              {/* ERROR */}

              {error && (
                <div className="
                  mb-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-700
                ">
                  {error}
                </div>
              )}


              {/* =================================================
                  IMAGES
              ================================================== */}

              <div className="
                rounded-2xl
                border
                border-navy/10
                bg-surface/20
                p-4
                sm:p-5
              ">

                <div className="flex items-center gap-2 mb-5">
                  <ImagePlus className="w-5 h-5 text-accent" />

                  <h3 className="font-semibold text-navy">
                    Images
                  </h3>
                </div>


                {/* COVER */}

                <ImageUploadField
                  label="Cover Image *"
                  value={form.image}
                  onChange={(value) =>
                    handleChange(
                      "image",
                      value
                    )
                  }
                />


                {/* GALLERY */}

                <div className="mt-6">

                  <label className="
                    block
                    text-sm
                    font-medium
                    text-navy
                    mb-1.5
                  ">
                    Gallery Images
                  </label>

                  <p className="
                    text-xs
                    text-navy/50
                    mb-3
                  ">
                    Add additional images for the detailed happy moment page.
                  </p>


                  <div className="
                    grid
                    grid-cols-2
                    sm:grid-cols-3
                    md:grid-cols-4
                    gap-3
                  ">

                    {form.gallery_images.map(
                      (image, index) => (

                        <div
                          key={`${image.public_id || image.url}-${index}`}
                          className="
                            relative
                            aspect-square
                            rounded-xl
                            overflow-hidden
                            border
                            border-navy/10
                            bg-white
                          "
                        >

                          <img
                            src={image.url}
                            alt={`Gallery ${index + 1}`}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                          />


                          <button
                            type="button"
                            onClick={() =>
                              removeGalleryImage(
                                index
                              )
                            }
                            disabled={
                              galleryUploading
                            }
                            className="
                              absolute
                              top-1.5
                              right-1.5
                              w-7
                              h-7
                              rounded-full
                              bg-navy/75
                              text-white
                              flex
                              items-center
                              justify-center
                              hover:bg-red-600
                              transition-colors
                            "
                            aria-label="Remove gallery image"
                          >
                            <X className="w-4 h-4" />
                          </button>

                        </div>

                      )
                    )}


                    {/* ADD GALLERY */}

                    <button
                      type="button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                      disabled={
                        galleryUploading
                      }
                      className="
                        aspect-square
                        rounded-xl
                        border-2
                        border-dashed
                        border-navy/20
                        text-navy/50
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        hover:border-secondary
                        hover:text-secondary
                        transition-colors
                        disabled:opacity-50
                      "
                    >

                      {galleryUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Plus className="w-6 h-6" />
                      )}

                      <span className="text-xs font-medium text-center px-2">
                        {galleryUploading
                          ? "Uploading..."
                          : "Add Images"}
                      </span>

                    </button>

                  </div>


                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryFiles}
                    className="hidden"
                  />

                </div>

              </div>


              {/* =================================================
                  BASIC INFORMATION
              ================================================== */}

              <div className="
                mt-5
                rounded-2xl
                border
                border-navy/10
                bg-white
                p-4
                sm:p-5
              ">

                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-5 h-5 text-accent" />

                  <h3 className="font-semibold text-navy">
                    Basic Information
                  </h3>
                </div>


                <div className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-5
                ">

                  {/* TITLE */}

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Title *
                    </label>

                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        handleTitleChange(
                          e.target.value
                        )
                      }
                      placeholder="A Perfect Goa Escape"
                      maxLength={200}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                    <p className="mt-1 text-[11px] text-navy/40">
                      {form.title.length}/200
                    </p>

                  </div>


                  {/* SLUG */}

                  <div className="md:col-span-2">

                    <label className="
                      flex
                      items-center
                      gap-1.5
                      text-sm
                      font-medium
                      text-navy
                      mb-1.5
                    ">
                      <LinkIcon className="w-4 h-4" />

                      URL Slug *
                    </label>

                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        handleSlugChange(
                          e.target.value
                        )
                      }
                      placeholder="perfect-goa-escape"
                      maxLength={250}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        font-mono
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                    <p className="mt-1.5 text-[11px] text-navy/40">
                      Public URL: /happy-moments/
                      {form.slug || "your-slug"}
                    </p>

                  </div>


                  {/* SHORT CAPTION */}

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Short Caption
                    </label>

                    <textarea
                      value={
                        form.short_caption
                      }
                      onChange={(e) =>
                        handleChange(
                          "short_caption",
                          e.target.value
                        )
                      }
                      placeholder="Sun, sand, and unforgettable memories — Goa gave us the perfect holiday!"
                      maxLength={300}
                      rows={3}
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                    <p className="mt-1 text-[11px] text-navy/40">
                      {form.short_caption.length}/300
                    </p>

                  </div>


                  {/* PLACE */}

                  <div>

                    <label className="
                      flex
                      items-center
                      gap-1.5
                      text-sm
                      font-medium
                      text-navy
                      mb-1.5
                    ">
                      <MapPin className="w-4 h-4" />

                      Place Name
                    </label>

                    <input
                      type="text"
                      value={form.place_name}
                      onChange={(e) =>
                        handleChange(
                          "place_name",
                          e.target.value
                        )
                      }
                      placeholder="Goa"
                      maxLength={150}
                      className="
                        w-full
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                  </div>


                  {/* TRAVEL DATE */}

                  <div>

                    <label className="
                      flex
                      items-center
                      gap-1.5
                      text-sm
                      font-medium
                      text-navy
                      mb-1.5
                    ">
                      <CalendarDays className="w-4 h-4" />

                      Travel Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.travel_date
                      }
                      onChange={(e) =>
                        handleChange(
                          "travel_date",
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  DETAIL CONTENT
              ================================================== */}

              <div className="
                mt-5
                rounded-2xl
                border
                border-navy/10
                bg-white
                p-4
                sm:p-5
              ">

                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-accent" />

                  <h3 className="font-semibold text-navy">
                    Detailed Content
                  </h3>
                </div>


                {/* PLACE DESCRIPTION */}

                <div>

                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Place Description
                  </label>

                  <textarea
                    value={
                      form.place_description
                    }
                    onChange={(e) =>
                      handleChange(
                        "place_description",
                        e.target.value
                      )
                    }
                    placeholder="Goa is known for its beautiful beaches, vibrant coastal atmosphere and stunning sunsets."
                    maxLength={1000}
                    rows={4}
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-navy/15
                      px-4
                      py-3
                      text-sm
                      text-navy
                      leading-relaxed
                      outline-none
                      focus:border-secondary
                      focus:ring-2
                      focus:ring-secondary/10
                    "
                  />

                  <p className="mt-1 text-[11px] text-navy/40">
                    {form.place_description.length}/1000
                  </p>

                </div>


                {/* EXPERIENCE */}

                <div className="mt-5">

                  <label className="block text-sm font-medium text-navy mb-1.5">
                    Traveller Experience
                  </label>

                  <textarea
                    value={
                      form.experience
                    }
                    onChange={(e) =>
                      handleChange(
                        "experience",
                        e.target.value
                      )
                    }
                    placeholder="Our Goa trip was an amazing escape. We loved exploring the beaches, enjoying the beautiful views and discovering different parts of Goa."
                    maxLength={2000}
                    rows={7}
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-navy/15
                      px-4
                      py-3
                      text-sm
                      text-navy
                      leading-relaxed
                      outline-none
                      focus:border-secondary
                      focus:ring-2
                      focus:ring-secondary/10
                    "
                  />

                  <p className="mt-1 text-[11px] text-navy/40">
                    {form.experience.length}/2000
                  </p>

                </div>


                {/* HIGHLIGHTS */}

                <div className="mt-5">

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    mb-3
                  ">

                    <label className="block text-sm font-medium text-navy">
                      Highlights
                    </label>

                    <button
                      type="button"
                      onClick={addHighlight}
                      className="
                        inline-flex
                        items-center
                        gap-1
                        text-xs
                        font-semibold
                        text-secondary
                        hover:text-accent
                      "
                    >
                      <Plus className="w-3.5 h-3.5" />

                      Add Highlight
                    </button>

                  </div>


                  <div className="space-y-2.5">

                    {form.highlights.map(
                      (highlight, index) => (

                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >

                          <span className="
                            flex
                            items-center
                            justify-center
                            w-7
                            h-7
                            rounded-full
                            bg-accent/10
                            text-accent
                            text-xs
                            font-bold
                            shrink-0
                          ">
                            {index + 1}
                          </span>


                          <input
                            type="text"
                            value={highlight}
                            onChange={(e) =>
                              handleHighlightChange(
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Beautiful beaches"
                            className="
                              flex-1
                              rounded-xl
                              border
                              border-navy/15
                              px-4
                              py-2.5
                              text-sm
                              text-navy
                              outline-none
                              focus:border-secondary
                              focus:ring-2
                              focus:ring-secondary/10
                            "
                          />


                          <button
                            type="button"
                            onClick={() =>
                              removeHighlight(
                                index
                              )
                            }
                            className="
                              w-9
                              h-9
                              rounded-lg
                              flex
                              items-center
                              justify-center
                              text-navy/40
                              hover:bg-red-50
                              hover:text-red-600
                              transition-colors
                              shrink-0
                            "
                            aria-label="Remove highlight"
                          >
                            <X className="w-4 h-4" />
                          </button>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>


              {/* =================================================
                  DISPLAY SETTINGS
              ================================================== */}

              <div className="
                mt-5
                rounded-2xl
                border
                border-navy/10
                bg-white
                p-4
                sm:p-5
              ">

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-5
                ">

                  {/* DISPLAY ORDER */}

                  <div>

                    <label className="
                      block
                      text-sm
                      font-medium
                      text-navy
                      mb-1.5
                    ">
                      Display Order
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.display_order
                      }
                      onChange={(e) =>
                        handleChange(
                          "display_order",
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-navy/15
                        px-4
                        py-3
                        text-sm
                        text-navy
                        outline-none
                        focus:border-secondary
                        focus:ring-2
                        focus:ring-secondary/10
                      "
                    />

                    <p className="mt-1 text-[11px] text-navy/40">
                      Lower numbers appear first.
                    </p>

                  </div>


                  {/* FEATURED */}

                  <label className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-navy/10
                    px-4
                    py-3
                    cursor-pointer
                    hover:bg-surface/30
                    transition-colors
                  ">

                    <input
                      type="checkbox"
                      checked={
                        form.is_featured
                      }
                      onChange={(e) =>
                        handleChange(
                          "is_featured",
                          e.target.checked
                        )
                      }
                      className="
                        w-5
                        h-5
                        rounded
                        accent-[#F22727]
                      "
                    />

                    <div>

                      <p className="
                        text-sm
                        font-semibold
                        text-navy
                        flex
                        items-center
                        gap-1.5
                      ">
                        <Star
                          className="w-4 h-4 text-accent"
                          fill="currentColor"
                        />

                        Featured on Homepage
                      </p>

                      <p className="text-xs text-navy/50 mt-0.5">
                        Show this moment in the homepage Happy Moments section.
                      </p>

                    </div>

                  </label>

                </div>

              </div>


              {/* =================================================
                  ACTIONS
              ================================================== */}

              <div className="
                sticky
                bottom-0
                mt-6
                pt-4
                bg-white
                border-t
                border-navy/10
                flex
                flex-col-reverse
                sm:flex-row
                sm:justify-end
                gap-3
              ">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    galleryUploading
                  }
                  className="
                    w-full
                    sm:w-auto
                    px-5
                    py-3
                    rounded-xl
                    border
                    border-navy/15
                    text-navy
                    text-sm
                    font-semibold
                    hover:bg-navy/5
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving ||
                    galleryUploading
                  }
                  className="
                    w-full
                    sm:w-auto
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-6
                    py-3
                    rounded-xl
                    bg-navy
                    text-white
                    text-sm
                    font-semibold
                    hover:bg-secondary
                    transition-colors
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >

                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />

                      {editingId
                        ? "Updating..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingId
                        ? "Update Happy Moment"
                        : "Add Happy Moment"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}