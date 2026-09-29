import { useEffect, useState } from "react";
import {
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../../api/adminTestimonials";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY_FORM = {
  customer_name: "",
  customer_city: "",
  trip_name: "",
  rating: 5,
  review: "",
  status: "draft",
  image: null,
};

export default function TestimonialsManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");

    getAllTestimonialsAdmin()
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setItems([]);
        setError(
          err?.response?.data?.detail ||
            "Could not load testimonials"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditing({});
    setError("");
  };

  const openEdit = (t) => {
    setForm({
      customer_name: t.customer_name || "",
      customer_city: t.customer_city || "",
      trip_name: t.trip_name || "",
      rating: t.rating || 5,
      review: t.review || "",
      status: t.status || "draft",
      image: t.image || null,
    });

    setEditing(t);
    setError("");
  };

  const closeModal = () => {
    setEditing(null);
    setError("");
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_city: form.customer_city.trim(),
        trip_name: form.trip_name.trim() || null,
        rating: Number(form.rating),
        review: form.review.trim(),
        status: form.status,
        image: form.image,
      };

      if (editing?.id) {
        await updateTestimonial(editing.id, payload);
      } else {
        await createTestimonial(payload);
      }

      closeModal();
      load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not save testimonial"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial?")) {
      return;
    }

    try {
      await deleteTestimonial(id);
      load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not delete testimonial"
      );
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-navy">
            Testimonials
          </h1>

          <p className="text-sm text-navy/50 mt-1">
            Manage customer testimonials displayed on the website.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Testimonial
        </button>
      </div>

      {/* Global Error */}
      {error && editing === null && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-600 break-words">
            {error}
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-navy/50 text-sm">
          Loading…
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {items.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-navy/10 p-4 min-w-0"
            >
              {/* Customer + Status */}
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy break-words">
                    {t.customer_name}
                  </p>

                  {/* City */}
                  {t.customer_city && (
                    <p className="text-xs text-navy/50 mt-0.5 break-words">
                      {t.customer_city}
                    </p>
                  )}

                  {/* Trip */}
                  {t.trip_name && (
                    <p className="text-xs text-accent-hover mt-0.5 break-words">
                      {t.trip_name}
                    </p>
                  )}

                  {/* Rating */}
                  <p
                    className="text-xs text-accent-hover mt-1"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {"★".repeat(t.rating)}
                    {"☆".repeat(5 - t.rating)}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    t.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-surface text-navy/60"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              {/* Review */}
              <p className="text-sm text-navy/70 mt-3 line-clamp-3 break-words">
                {t.review}
              </p>

              {/* Customer Image Preview */}
              {t.image?.url && (
                <div className="mt-3">
                  <img
                    src={t.image.url}
                    alt={t.customer_name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:gap-4">
                <button
                  onClick={() => openEdit(t)}
                  className="w-full sm:w-auto text-secondary text-sm font-medium hover:underline text-left"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="w-full sm:w-auto text-red-600 text-sm font-medium hover:underline text-left"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-navy/40 col-span-full text-sm">
              No testimonials yet.
            </p>
          )}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-navy break-words">
                  {editing?.id
                    ? "Edit Testimonial"
                    : "New Testimonial"}
                </h2>

                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 text-navy/50 hover:text-navy text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-6 space-y-4"
            >
              {/* Customer Name */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Customer Name
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customer_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Priya Sharma"
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                />
              </div>

              {/* Customer City */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Customer City
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.customer_city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customer_city: e.target.value,
                    })
                  }
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                />
              </div>

              {/* Trip / Package */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Trip / Package
                  <span className="text-navy/40 font-normal">
                    {" "}
                    (optional)
                  </span>
                </label>

                <input
                  maxLength={150}
                  value={form.trip_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      trip_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Kerala Trip"
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                />
              </div>

              {/* Rating */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Rating
                </label>

                <select
                  value={form.rating}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rating: e.target.value,
                    })
                  }
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </div>

              {/* Review */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Review
                </label>

                <textarea
                  required
                  minLength={5}
                  rows={4}
                  value={form.review}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      review: e.target.value,
                    })
                  }
                  placeholder="Write the customer's testimonial..."
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none resize-y focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                />
              </div>

              {/* Status */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>
                </select>
              </div>

              {/* Image */}
              <div className="min-w-0">
                <ImageUploadField
                  value={form.image}
                  onChange={(img) =>
                    setForm({
                      ...form,
                      image: img,
                    })
                  }
                  label="Customer Photo (optional)"
                />
              </div>

              {/* Form Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3 sm:px-4 py-3">
                  <p className="text-sm text-red-600 break-words">
                    {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}