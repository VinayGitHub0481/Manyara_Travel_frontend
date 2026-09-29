


import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from "lucide-react";

import { getPublishedPolicies } from "../api/adminPolicy";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";

const TERMS_PATH = "/terms-and-conditions";

export default function TermsAndConditions() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadPolicies = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublishedPolicies();

        if (!mounted) return;

        setPolicies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load terms and conditions:", err);

        if (!mounted) return;

        setError(
          "Unable to load the terms and conditions right now. Please try again later."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPolicies();

    return () => {
      mounted = false;
    };
  }, []);

  const termsPolicies = useMemo(() => {
    return policies
      .filter(
        (policy) =>
          policy?.policy_type === "terms_conditions" &&
          policy?.status === "published"
      )
      .sort(
        (a, b) =>
          Number(a?.display_order ?? 0) -
          Number(b?.display_order ?? 0)
      );
  }, [policies]);

  const toggleItem = (id) => {
    setOpenItems((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const pageDescription =
    "Read On a Trip Holiday's terms and conditions for travel bookings, package reservations, payments, services and applicable booking requirements.";

  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms & Conditions | On a Trip Holiday",
        url: `${SITE_URL}${TERMS_PATH}`,
        description: pageDescription,
        isPartOf: {
          "@type": "WebSite",
          name: "On a Trip Holiday",
          url: SITE_URL,
        },
        about: {
          "@type": "Thing",
          name: "Travel Booking Terms and Conditions",
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
            name: "Terms & Conditions",
            item: `${SITE_URL}${TERMS_PATH}`,
          },
        ],
      },
    ],
    [pageDescription]
  );

  return (
    <>
      <Seo
        title="Terms & Conditions"
        description={pageDescription}
        path={TERMS_PATH}
        type="website"
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-ivory text-navy">
        {/* ========================================================
            HERO
        ========================================================= */}
        <section
          className="bg-navy-dark text-ivory"
          aria-labelledby="terms-page-title"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2">
                <FileText
                  className="h-5 w-5 text-accent"
                  aria-hidden="true"
                />

                <span className="text-sm font-medium text-ivory/70">
                  Company Policies
                </span>
              </div>

              <h1
                id="terms-page-title"
                className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              >
                Terms &amp; Conditions
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/65 sm:text-base">
                Please review the terms and conditions that apply to
                bookings, travel packages, payments and services provided by
                On a Trip Holiday.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            TERMS CONTENT
        ========================================================= */}
        <section
          className="py-10 sm:py-14 lg:py-16"
          aria-labelledby="terms-policy-heading"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 id="terms-policy-heading" className="sr-only">
              Terms and Conditions
            </h2>

            {loading && (
              <div
                className="flex items-center justify-center py-16"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex items-center gap-3 text-navy/60">
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />

                  <span className="text-sm">
                    Loading terms and conditions...
                  </span>
                </div>
              </div>
            )}

            {!loading && error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 p-5"
                role="alert"
              >
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!loading && !error && termsPolicies.length === 0 && (
              <div className="rounded-xl border border-navy/10 bg-white p-8 text-center shadow-sm">
                <FileText
                  className="mx-auto h-8 w-8 text-navy/30"
                  aria-hidden="true"
                />

                <h2 className="mt-4 text-lg font-semibold text-navy">
                  Terms &amp; Conditions
                </h2>

                <p className="mt-2 text-sm text-navy/55">
                  Our terms and conditions are currently being updated.
                </p>
              </div>
            )}

            {!loading && !error && termsPolicies.length > 0 && (
              <div className="space-y-3">
                {termsPolicies.map((policy, index) => {
                  const isOpen = Boolean(openItems[policy?.id]);

                  return (
                    <article
                      key={policy?.id}
                      className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(policy?.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-navy/[0.02] sm:px-6 sm:py-5"
                        aria-expanded={isOpen}
                        aria-controls={`terms-policy-${policy?.id}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="shrink-0 text-sm font-semibold text-accent">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <h3 className="text-sm font-semibold leading-6 text-navy sm:text-base">
                            {policy?.question}
                          </h3>
                        </div>

                        {isOpen ? (
                          <ChevronUp
                            className="h-5 w-5 shrink-0 text-navy/50"
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronDown
                            className="h-5 w-5 shrink-0 text-navy/50"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      {isOpen && (
                        <div
                          id={`terms-policy-${policy?.id}`}
                          className="border-t border-navy/10 px-5 py-5 sm:px-6"
                        >
                          <p className="whitespace-pre-line text-sm leading-7 text-navy/65">
                            {policy?.answer}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* ====================================================
                RELATED POLICIES
            ==================================================== */}
            <div className="mt-10 border-t border-navy/10 pt-6">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/cancellation"
                  className="inline-flex items-center rounded-lg border border-navy/10 px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:border-accent hover:text-accent"
                >
                 Cancellation Policy
                </Link>
                   <Link
                  to="/bookings"
                  className="inline-flex items-center rounded-lg border border-navy/10 px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:border-accent hover:text-accent"
                >
                 Booking Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />
        <Footer />
      </main>
    </>
  );
}
