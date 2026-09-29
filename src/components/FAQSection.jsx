

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown, HelpCircle } from "lucide-react";
import { getFaqs } from "../api/content";

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-navy/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="
          w-full
          flex items-center justify-between
          gap-3 sm:gap-4
          py-4 sm:py-5
          text-left
          focus:outline-none
        "
      >
        <span className="font-medium text-navy text-sm sm:text-base md:text-lg leading-6 pr-2">
          {faq.question}
        </span>

        <ChevronDown
          className={`w-5 h-5 sm:w-5.5 sm:h-5.5 text-secondary shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <p
          className="
            text-navy/65
            text-sm sm:text-base
            leading-6 sm:leading-relaxed
            pb-4 sm:pb-5
            pr-7 sm:pr-10
          "
        >
          {faq.answer}
        </p>
      )}
    </div>
  );
}

export default function FAQSection({ category = "general" }) {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let mounted = true;

    getFaqs()
      .then((data) => {
        if (!mounted) return;

        const filteredFaqs = data
          .filter(
            (faq) => (faq.category || "general") === category
          )
          .sort(
            (a, b) =>
              a.display_order - b.display_order
          );

        setFaqs(filteredFaqs);
      })
      .catch(() => {
        if (mounted) {
          setFaqs([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [category]);

  useEffect(() => {
    setOpenId(null);
  }, [category]);

  const faqJsonLd = useMemo(() => {
    if (faqs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }, [faqs]);

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section
      id={category === "general" ? "faqs" : undefined}
      className="
        scroll-mt-20
        w-full
        bg-surface-blue
        py-8
        sm:py-10
        lg:py-12
      "
    >
      {faqJsonLd && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(faqJsonLd)}
          </script>
        </Helmet>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-5 sm:mb-6 lg:mb-7">
          <p
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              text-accent-hover
              font-semibold
              text-xs
              uppercase
              tracking-wide
            "
          >
            <HelpCircle
              className="w-4 h-4"
              aria-hidden="true"
            />

            Good to know
          </p>

          <h2
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
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ List */}
        <div className="w-full max-w-3xl mx-auto">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() =>
                setOpenId(
                  openId === faq.id
                    ? null
                    : faq.id
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
