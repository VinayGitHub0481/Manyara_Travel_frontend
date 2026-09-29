


// src/pages/admin/PolicyManage.jsx

import { useEffect, useMemo, useState } from "react";
import {
  getAllPoliciesAdmin,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../../api/adminPolicy";

const EMPTY_FORM = {
  policy_type: "terms_conditions",
  question: "",
  answer: "",
  display_order: 0,
  status: "published",
};

const POLICY_TYPES = [
  {
    value: "terms_conditions",
    label: "Terms & Conditions",
  },
  {
    value: "booking",
    label: "Booking",
  },
  {
    value: "cancellation",
    label: "Cancellation",
  },
];

const POLICY_TYPE_LABELS = {
  terms_conditions: "Terms & Conditions",
  booking: "Booking",
  cancellation: "Cancellation",
};

export default function PolicyManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  // ============================================================
  // LOAD POLICIES
  // ============================================================

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllPoliciesAdmin();

      const sorted = [...(data || [])].sort(
        (a, b) =>
          Number(a.display_order ?? 0) -
          Number(b.display_order ?? 0)
      );

      setItems(sorted);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load policies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // FILTERED POLICIES
  // ============================================================

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return items;
    }

    return items.filter(
      (item) => item.policy_type === activeFilter
    );
  }, [items, activeFilter]);

  // ============================================================
  // OPEN CREATE
  // ============================================================

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setEditing({});
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = (item) => {
    setForm({
      policy_type:
        item.policy_type || "terms_conditions",

      question: item.question || "",

      answer: item.answer || "",

      display_order:
        item.display_order ?? 0,

      status:
        item.status || "published",
    });

    setError("");
    setEditing(item);
  };

  // ============================================================
  // HANDLE SAVE
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.question.trim()) {
      setError("Question / heading is required.");
      return;
    }

    if (!form.answer.trim()) {
      setError("Answer / content is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        policy_type: form.policy_type,
        question: form.question.trim(),
        answer: form.answer.trim(),
        display_order: Number(form.display_order) || 0,
        status: form.status,
      };

      if (editing?.id) {
        await updatePolicy(
          editing.id,
          payload
        );
      } else {
        await createPolicy(payload);
      }

      setEditing(null);
      setForm({
        ...EMPTY_FORM,
      });

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not save policy."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Delete this policy item? This action cannot be undone."
      )
    ) {
      return;
    }

    setError("");

    try {
      await deletePolicy(id);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not delete policy."
      );
    }
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setEditing(null);
    setForm({
      ...EMPTY_FORM,
    });
    setError("");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">
            Company Policies
          </h1>

          <p className="text-sm text-navy/50 mt-1">
            Manage Terms & Conditions, Booking and Cancellation
            policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Policy
        </button>
      </div>

      {/* ======================================================
          FILTER TABS
      ====================================================== */}

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-navy text-ivory"
              : "bg-white border border-navy/10 text-navy/60 hover:bg-surface"
          }`}
        >
          All
        </button>

        {POLICY_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() =>
              setActiveFilter(type.value)
            }
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === type.value
                ? "bg-navy text-ivory"
                : "bg-white border border-navy/10 text-navy/60 hover:bg-surface"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && !editing && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 break-words">
          {error}
        </div>
      )}

      {/* ======================================================
          POLICY LIST
      ====================================================== */}

      {loading ? (
        <p className="text-navy/50 text-sm">
          Loading policies…
        </p>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-navy/10 overflow-hidden min-w-0"
            >
              <div className="p-4 sm:p-5">

                {/* ==================================================
                    TOP ROW
                ================================================== */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0 flex-1">

                    {/* Policy Type */}

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy">
                        {POLICY_TYPE_LABELS[
                          item.policy_type
                        ] || item.policy_type}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {item.status === "published"
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    {/* Question */}

                    <h2 className="font-semibold text-navy text-sm sm:text-base break-words">
                      {item.question}
                    </h2>

                    {/* Order */}

                    <p className="text-xs text-navy/40 mt-1">
                      Order: {item.display_order}
                    </p>

                    {/* Answer */}

                    <p className="text-sm text-navy/60 mt-3 leading-6 whitespace-pre-line break-words">
                      {item.answer}
                    </p>
                  </div>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(item)
                      }
                      className="w-full sm:w-auto text-secondary text-sm font-medium hover:underline text-left sm:text-center py-1"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      className="w-full sm:w-auto text-red-600 text-sm font-medium hover:underline text-left sm:text-center py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ====================================================
              EMPTY STATE
          ==================================================== */}

          {filteredItems.length === 0 && (
            <div className="py-10 text-center bg-white rounded-xl border border-navy/10">
              <p className="text-navy/40 text-sm">
                No policies found.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-3 text-secondary text-sm font-medium hover:underline"
              >
                + Add a policy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {editing !== null && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">

          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-2xl h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">

            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="sticky top-0 z-10 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-navy break-words">
                {editing?.id
                  ? "Edit Policy"
                  : "New Policy"}
              </h2>

              <p className="text-xs text-navy/50 mt-1">
                Create and manage customer-facing policy
                content.
              </p>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSave}
              className="p-4 sm:p-6 space-y-5"
            >

              {/* ==================================================
                  POLICY TYPE
              ================================================== */}

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Policy Type
                </label>

                <select
                  value={form.policy_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      policy_type:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0 bg-white"
                >
                  {POLICY_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-navy/40 mt-1.5">
                  Choose where this policy item belongs.
                </p>
              </div>

              {/* ==================================================
                  QUESTION
              ================================================== */}

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Question / Heading
                </label>

                <input
                  required
                  maxLength={300}
                  value={form.question}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      question:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. What is your booking policy?"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0 bg-white"
                />

                <p className="text-xs text-navy/40 mt-1.5">
                  This heading will be displayed to customers.
                </p>
              </div>

              {/* ==================================================
                  ANSWER
              ================================================== */}

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Answer / Content
                </label>

                <textarea
                  required
                  rows={8}
                  value={form.answer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      answer:
                        e.target.value,
                    })
                  }
                  placeholder="Enter the policy explanation..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-y bg-white leading-6"
                />

                <p className="text-xs text-navy/40 mt-1.5">
                  You can use multiple paragraphs. Line breaks
                  will be preserved on the public page.
                </p>
              </div>

              {/* ==================================================
                  DISPLAY ORDER
              ================================================== */}

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Display Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      display_order:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0 bg-white"
                />

                <p className="text-xs text-navy/40 mt-1.5">
                  Lower numbers appear first.
                </p>
              </div>

              {/* ==================================================
                  STATUS
              ================================================== */}

              <div>
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0 bg-white"
                >
                  <option value="published">
                    Published
                  </option>

                  <option value="draft">
                    Draft
                  </option>
                </select>

                <p className="text-xs text-navy/40 mt-1.5">
                  Draft policies should not appear on the
                  public website.
                </p>
              </div>

              {/* ==================================================
                  FORM ERROR
              ================================================== */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 break-words">
                  {error}
                </div>
              )}

              {/* ==================================================
                  BUTTONS
              ================================================== */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editing?.id
                    ? "Update Policy"
                    : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}