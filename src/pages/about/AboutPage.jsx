




import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  HeartHandshake,
  MessageSquareHeart,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  Eye,
} from "lucide-react";

import FAQSection from "../../components/FAQSection";

import {FaInstagram ,FaLinkedin ,FaFacebook} from "react-icons/fa";


import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getAbout } from "../../api/content";
import EnquiryForm from "../EnquiryForm";
import ReviewFormModal from "../../components/ReviewFormModal";

/* =========================================================
   HELPERS
========================================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image.trim();
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.src ||
      image.image_url ||
      ""
    );
  }

  return "";
};

const getSafeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getDisplayOrder = (item) => {
  const value = Number(item?.display_order);

  return Number.isFinite(value)
    ? value
    : Number.MAX_SAFE_INTEGER;
};

const sortByDisplayOrder = (items) => {
  return [...items].sort(
    (a, b) =>
      getDisplayOrder(a) - getDisplayOrder(b) ||
      Number(a?.id || 0) - Number(b?.id || 0)
  );
};

const cleanText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return `${value}+ ${value === 1 ? "year" : "years"} experience`;
};

const getSafeUrl = (value) => {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
};

/* =========================================================
   SOCIAL LINK
========================================================= */

function SocialLink({ href, label, icon: Icon }) {
  const safeHref = getSafeUrl(href);
  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full
                 bg-navy/5 text-navy hover:bg-accent hover:text-white
                 transition-colors"
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </a>
  );
}

/* =========================================================
   IMAGE
========================================================= */

function PersonImage({
  image,
  name,
  className = "",
  fallbackClassName = "",
}) {
  const imageUrl = getImageUrl(image);

  if (!imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-blue
                    text-navy/30 ${fallbackClassName} ${className}`}
        aria-label={`${name || "Person"} photo unavailable`}
      >
        <Users className="w-12 h-12" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name ? `${name} - On a Trip Holiday` : "On a Trip Holiday team"}
      className={`object-cover ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}

/* =========================================================
   ABOUT PAGE
========================================================= */

export default function AboutPage({ onPlanTrip }) {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localEnquiryOpen, setLocalEnquiryOpen] = useState(false);
  const [showReview,setShowReview]=useState(false);


  const handlePlanTrip =
    typeof onPlanTrip === "function"
      ? onPlanTrip
      : () => setLocalEnquiryOpen(true);

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadAbout = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAbout();

        if (!isMounted) return;

        setAboutData(data || null);
      } catch (err) {
        console.error("Failed to load About page:", err);

        if (isMounted) {
          setAboutData(null);
          setError(
            "We couldn't load our About information right now."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAbout();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =======================================================
     NORMALIZE BACKEND RESPONSE
  ======================================================= */

  const about = aboutData?.about || null;

  const leadership = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.leadership).filter(
          (person) => person?.is_active !== false
        )
      ),
    [aboutData?.leadership]
  );

  const team = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.team).filter(
          (member) =>
            member?.is_active !== false &&
            member?.show_public_profile !== false
        )
      ),
    [aboutData?.team]
  );

  const milestones = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.milestones)
      ),
    [aboutData?.milestones]
  );

  const values = useMemo(
    () =>
      sortByDisplayOrder(
        getSafeArray(aboutData?.values)
      ),
    [aboutData?.values]
  );

  /* =======================================================
     LEADERSHIP / FOUNDER
  ======================================================= */

  const founder = useMemo(() => {
    if (!leadership.length) return null;

    return (
      leadership.find((person) => {
        const designation = cleanText(person?.designation).toLowerCase();
        return (
          designation.includes("ceo") ||
          designation.includes("chief executive") ||
          designation.includes("founder") ||
          designation.includes("managing director")
        );
      }) || leadership[0]
    );
  }, [leadership]);

  /* =======================================================
     SEO DATA
  ======================================================= */

  const companyName =
    cleanText(about?.company_name) || "On a Trip Holiday";

  const seoTitle =
    cleanText(about?.hero_title) || "About Us";

  const seoDescription =
    cleanText(about?.hero_description) ||
    "Learn more about On a Trip Holiday, our story, our people and how we create thoughtful travel experiences.";

  const aboutJsonLd = useMemo(() => {
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: `About ${companyName}`,
        url: `${SITE_URL}/about`,
        description: seoDescription,
        isPartOf: {
          "@type": "WebSite",
          name: companyName,
          url: SITE_URL,
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
            name: "About Us",
            item: `${SITE_URL}/about`,
          },
        ],
      },
    ];

    /*
     * Add founder/leadership structured data only when
     * leadership information actually exists.
     */
    if (founder) {
      const founderImage = getImageUrl(founder.image);

      schemas.push({
        "@context": "https://schema.org",
        "@type": "Person",
        name: founder.name,
        jobTitle: founder.designation,
        description:
          founder.full_bio ||
          founder.short_bio ||
          undefined,
        ...(founderImage
          ? {
              image: founderImage,
            }
          : {}),
        ...(founder.email
          ? {
              email: founder.email,
            }
          : {}),
        ...(founder.telephone || founder.phone
          ? {
              telephone:
                founder.telephone || founder.phone,
            }
          : {}),
        ...(founder.linkedin ||
        founder.instagram ||
        founder.facebook
          ? {
              sameAs: [
                founder.linkedin,
                founder.instagram,
                founder.facebook,
              ].filter(Boolean),
            }
          : {}),
      });
    }

    return schemas;
  }, [companyName, seoDescription, founder]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="About Us"
          description="Learn more about On a Trip Holiday, our story, our people and our approach to travel."
          path="/about"
        />

        <section className="bg-navy text-ivory">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="animate-pulse max-w-3xl">
              <div className="h-4 w-24 bg-white/10 rounded mb-5" />
              <div className="h-10 sm:h-14 bg-white/10 rounded-lg w-full max-w-2xl" />
              <div className="h-5 bg-white/10 rounded mt-5 max-w-xl" />
              <div className="h-5 bg-white/10 rounded mt-2 max-w-lg" />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 bg-surface rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     ERROR / EMPTY STATE
  ======================================================= */

  if (error || !about) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="About Us"
          description="Learn more about On a Trip Holiday."
          path="/about"
        />

        <section className="bg-navy text-ivory py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
              <Compass
                className="w-7 h-7 text-accent"
                aria-hidden="true"
              />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold">
              About On a Trip Holiday
            </h1>

            <p className="mt-4 text-ivory/70 max-w-xl mx-auto">
              {error ||
                "About information is not available yet."}
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-7
                         bg-accent hover:bg-accent-hover
                         text-white font-semibold
                         px-6 py-3 rounded-full transition-colors"
            >
              Back to Home
              <ArrowRight
                className="w-4 h-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* ===================================================
          SEO
      =================================================== */}

      <Seo
        title={seoTitle}
        description={seoDescription}
        path="/about"
        image={
          getImageUrl(founder?.image) ||
          `${SITE_URL}/og-default.jpg`
        }
        type="website"
        jsonLd={aboutJsonLd}
      />
      
{/* ===================================================
    HERO
=================================================== */}
<section
  className="relative overflow-hidden bg-navy text-ivory"
  aria-labelledby="about-hero-title"
>
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
    <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
  </div>

  <div
    className="
      relative
      mx-auto
      max-w-6xl
      px-4
      py-10
      sm:px-6
      sm:py-14
      lg:px-8
      lg:py-16
    "
  >
    {/* Breadcrumb */}
    <nav
      aria-label="Breadcrumb"
      className="mb-8 flex items-center gap-2 text-sm text-ivory/50"
    >
      <Link
        to="/"
        className="transition-colors hover:text-white"
      >
        Home
      </Link>

      <ChevronRight
        className="h-4 w-4"
        aria-hidden="true"
      />

      <span className="text-ivory/80">
        About Us
      </span>
    </nav>

    <div className="max-w-4xl">
      <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
        <Sparkles
          className="h-4 w-4"
          aria-hidden="true"
        />

        Who we are
      </div>

      <h1
        id="about-hero-title"
        className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {cleanText(about?.hero_title) ||
          "Travel planned with care."}
      </h1>

      {cleanText(about?.hero_description) && (
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-ivory/75 sm:text-lg lg:text-xl">
          {about.hero_description}
        </p>
      )}

      {Number(about?.years_experience) > 0 && (
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-3">
          <CalendarDays
            className="h-5 w-5 text-accent"
            aria-hidden="true"
          />

          <span className="text-sm text-ivory/85 sm:text-base">
            {about.years_experience}+ years of travel experience
          </span>
        </div>
      )}
    </div>
  </div>
</section>

{/* ===================================================
    TRUST / COMPANY FACTS
    Only show values actually controlled by backend.
=================================================== */}
{(about?.founded_year || about?.years_experience) && (
  <section
    className="bg-white py-8 sm:py-10 lg:py-12"
    aria-label="Company facts"
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {about?.founded_year && (
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <CalendarDays
              className="mb-3 h-5 w-5 text-accent"
              aria-hidden="true"
            />

            <p className="font-display text-2xl font-semibold text-navy sm:text-3xl">
              {about.founded_year}
            </p>

            <p className="mt-1 text-sm text-navy/60">
              Year founded
            </p>
          </div>
        )}

        {about?.years_experience && (
          <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
            <Compass
              className="mb-3 h-5 w-5 text-accent"
              aria-hidden="true"
            />

            <p className="font-display text-2xl font-semibold text-navy sm:text-3xl">
              {about.years_experience}+
            </p>

            <p className="mt-1 text-sm text-navy/60">
              Years of experience
            </p>
          </div>
        )}
      </div>
    </div>
  </section>
)}

      {/* ===================================================
          OUR STORY
      =================================================== */}

      {(cleanText(about?.story_title) ||
      cleanText(about?.story_content)) && (
      <section className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 lg:gap-12">
          <div>
            <p className="text-accent font-semibold text-xs uppercase tracking-[0.14em]">
              Our journey
            </p>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-1 leading-tight">
              {cleanText(about?.story_title) || "Our story"}
            </h2>
          </div>

          <div className="text-navy/70 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {about?.story_content}
          </div>
        </div>
      </section>
    )}

      {/* ===================================================
          MISSION + VISION
      =================================================== */}

      {(cleanText(about?.mission) ||
        cleanText(about?.vision)) && (
        <section className="bg-surface py-8 sm:py-10 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {cleanText(about?.mission) && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-navy/10">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                    <Target
                      className="w-5 h-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-accent text-xs font-semibold uppercase tracking-wide">
                    Our mission
                  </p>

                  <p className="mt-2 text-navy/70 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                    {about?.mission}
                  </p>
                </div>
              )}

              {cleanText(about?.vision) && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-navy/10">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                    <Eye
                      className="w-5 h-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-accent text-xs font-semibold uppercase tracking-wide">
                    Our vision
                  </p>

                  <p className="mt-2 text-navy/70 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                    {about?.vision}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          FOUNDER / LEADERSHIP
          Only appears when leadership.length > 0
      =================================================== */}

        {leadership.length > 0 && (
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
              <div>
                <p className="text-accent font-semibold text-xs uppercase tracking-[0.14em]">
                 Founder & CEO 
                </p>

                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-1">
                  Meet our leadership
                </h2>

                <p className="mt-2 text-navy/60 max-w-2xl text-sm sm:text-base leading-relaxed">
                  Get to know the people behind On a Trip Holiday
                  and the experience we bring to every journey.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {leadership.map((person) => {
                const imageUrl = getImageUrl(person?.image);
                const experienceText =
                  getExperienceText(person?.experience_years);

                return (
                  <article
                    key={person.id || person.slug}
                    className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]">
                      {/* IMAGE */}

                      <div className="min-h-[300px] md:min-h-full bg-surface-blue">
                        <PersonImage
                          image={person.image}
                          name={person.name}
                          className="w-full h-full min-h-[300px] md:min-h-full"
                          fallbackClassName="w-full min-h-[300px] md:min-h-full"
                        />
                      </div>

                      {/* CONTENT */}

                      <div className="p-6 sm:p-8 lg:p-10">
                        <p className="text-accent font-semibold text-sm uppercase tracking-wide">
                          {person.designation}
                        </p>

                        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-navy mt-2">
                          {person.name}
                        </h3>

                        {experienceText && (
                          <div className="inline-flex items-center gap-2 mt-3 text-sm text-navy/60">
                            <Compass
                              className="w-4 h-4 text-accent"
                              aria-hidden="true"
                            />
                            {experienceText}
                          </div>
                        )}

                        {cleanText(person.short_bio) && (
                          <p className="mt-5 text-navy/70 leading-relaxed text-sm sm:text-base">
                            {person.short_bio}
                          </p>
                        )}

                        {cleanText(person.company_message) && (
                          <div className="mt-6 rounded-2xl bg-surface p-5 border border-navy/5">
                            <p className="text-sm text-navy/65 leading-relaxed italic">
                              “{person.company_message}”
                            </p>
                          </div>
                        )}

                        {/* SOCIAL */}

                        {(person.linkedin ||
                          person.instagram ||
                          person.facebook) && (
                          <div className="flex flex-wrap gap-2 mt-6">
                            <SocialLink
                              href={person.linkedin}
                              label={`${person.name} on LinkedIn`}
                              icon={FaLinkedin}
                            />

                            <SocialLink
                              href={person.instagram}
                              label={`${person.name} on Instagram`}
                              icon={FaInstagram}
                            />

                            <SocialLink
                              href={person.facebook}
                              label={`${person.name} on Facebook`}
                              icon={FaFacebook}
                            />
                          </div>
                        )}

                        <Link
                          to={`/about/leadership/${person.slug}`}
                          className="inline-flex items-center gap-2 mt-7
                                     bg-navy hover:bg-primary-hover
                                     text-white font-semibold
                                     px-5 py-3 rounded-full
                                     transition-colors"
                        >
                          View full profile
                          <ArrowRight
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          OUR TEAM
          Only appears when team.length > 0
      =================================================== */}

        {team.length > 0 && (
      <section className="bg-surface py-8 sm:py-10 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-5 sm:mb-6">
            <p className="text-accent font-semibold text-xs uppercase tracking-[0.14em]">
              Our team
            </p>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-1 leading-tight">
              The people behind your journey
            </h2>

            <p className="mt-2 text-navy/60 text-sm sm:text-base leading-relaxed">
              Meet the team working behind the scenes to make
              your travel experience simple and memorable.
            </p>
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {team.map((member) => {
                const canOpenProfile =
                  member.show_public_profile === true;

                const cardContent = (
                  <article
                    className={`h-full overflow-hidden rounded-3xl
                               bg-white border border-navy/10
                               shadow-sm transition-all
                               ${
                                 canOpenProfile
                                   ? "hover:-translate-y-1 hover:shadow-lg"
                                   : ""
                               }`}
                  >
                    {/* PHOTO */}

                    <div className="aspect-[4/3] bg-surface-blue overflow-hidden">
                      <PersonImage
                        image={member.image}
                        name={member.name}
                        className="w-full h-full"
                        fallbackClassName="w-full h-full"
                      />
                    </div>

                    {/* DETAILS */}

                    <div className="p-5 sm:p-6">
                      <p className="text-accent text-xs sm:text-sm font-semibold uppercase tracking-wide">
                        {member.designation}
                      </p>

                      <h3 className="font-display text-xl sm:text-2xl font-semibold text-navy mt-1">
                        {member.name}
                      </h3>

                      {cleanText(member.department) && (
                        <p className="text-sm text-navy/50 mt-1">
                          {member.department}
                        </p>
                      )}

                      {cleanText(
                        member.short_description
                      ) && (
                        <p className="mt-4 text-sm text-navy/65 leading-relaxed line-clamp-3">
                          {member.short_description}
                        </p>
                      )}

                      {getExperienceText(
                        member.experience_years
                      ) && (
                        <div className="flex items-center gap-2 mt-4 text-xs text-navy/55">
                          <Compass
                            className="w-4 h-4 text-accent"
                            aria-hidden="true"
                          />
                          {getExperienceText(
                            member.experience_years
                          )}
                        </div>
                      )}

                      {canOpenProfile && (
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                          View profile
                          <ArrowRight
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );

                if (!canOpenProfile) {
                  return (
                    <div
                      key={
                        member.id || member.slug
                      }
                      className="h-full"
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={
                      member.id || member.slug
                    }
                    to={`/about/team/${member.slug}`}
                    className="block h-full"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MILESTONES / COMPANY JOURNEY
          Only appears when milestones.length > 0
      =================================================== */}

      {milestones.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <p className="text-accent font-semibold text-sm uppercase tracking-[0.14em]">
                Our journey
              </p>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-2">
                Moments that shaped us
              </h2>
            </div>

            <div className="relative">
              {/* TIMELINE LINE */}

              <div
                className="absolute left-4 sm:left-1/2 top-0 bottom-0
                           w-px bg-navy/10"
                aria-hidden="true"
              />

              <div className="space-y-8 sm:space-y-12">
                {milestones.map((milestone, index) => {
                  const imageUrl = getImageUrl(
                    milestone.image
                  );

                  const isEven = index % 2 === 0;

                  return (
                    <article
                      key={
                        milestone.id ||
                        `${milestone.year}-${milestone.title}`
                      }
                      className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10"
                    >
                      {/* MOBILE / LEFT DOT */}

                      <div
                        className="absolute left-4 sm:left-1/2
                                   top-1.5 -translate-x-1/2
                                   w-3 h-3 rounded-full
                                   bg-accent border-4 border-white
                                   shadow-sm z-10"
                        aria-hidden="true"
                      />

                      {/* CONTENT */}

                      <div
                        className={`pl-10 sm:pl-0 ${
                          isEven
                            ? "sm:pr-10 sm:text-right"
                            : "sm:col-start-2 sm:pl-10"
                        }`}
                      >
                        <p className="text-accent font-display text-2xl font-semibold">
                          {milestone.year}
                        </p>

                        <h3 className="font-display text-xl sm:text-2xl font-semibold text-navy mt-1">
                          {milestone.title}
                        </h3>

                        {cleanText(
                          milestone.description
                        ) && (
                          <p className="mt-3 text-sm text-navy/65 leading-relaxed whitespace-pre-line">
                            {milestone.description}
                          </p>
                        )}

                        {imageUrl && (
                          <div
                            className={`mt-5 overflow-hidden rounded-2xl border border-navy/10 ${
                              isEven
                                ? "sm:ml-auto"
                                : ""
                            } max-w-sm`}
                          >
                            <img
                              src={imageUrl}
                              alt={`${milestone.title} - ${milestone.year}`}
                              className="w-full aspect-[16/9] object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          VALUES
          Only appears when values.length > 0
      =================================================== */}

      {values.length > 0 && (
        <section className="bg-surface py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8 sm:mb-10">
              <p className="text-accent font-semibold text-sm uppercase tracking-[0.14em]">
                What we stand for
              </p>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-2">
                Our values
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {values.map((value) => (
                <article
                  key={
                    value.id ||
                    `${value.title}-${value.display_order}`
                  }
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-navy/10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-5">
                    {value.icon ? (
                      /*
                       * The admin can store an icon name/string.
                       * We don't dynamically execute arbitrary
                       * component names. Use a safe generic icon
                       * when the backend stores a custom icon value.
                       */
                      <Sparkles
                        className="w-6 h-6 text-accent"
                        aria-hidden="true"
                      />
                    ) : (
                      <HeartHandshake
                        className="w-6 h-6 text-accent"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <h3 className="font-display text-xl font-semibold text-navy">
                    {value.title}
                  </h3>

                  {cleanText(value.description) && (
                    <p className="mt-3 text-sm text-navy/65 leading-relaxed whitespace-pre-line">
                      {value.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          PLAN YOUR JOURNEY
          Existing enquiry workflow retained
      =================================================== */}

        <section
        id="enquire"
        className="bg-navy py-8 sm:py-10 lg:py-12"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* LEFT */}

            <div className="text-ivory min-w-0">
              <p className="text-accent font-semibold text-sm uppercase tracking-wide">
                Plan your journey
              </p>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold mt-2 leading-tight">
                Tell us where you want to go.
              </h2>

              <p className="mt-5 text-ivory/70 text-base sm:text-lg leading-relaxed max-w-xl">
                Not sure which package is right for you?
                Tell us a little about your trip and our
                travel team will help you plan it.
              </p>

              <div className="mt-7 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-accent shrink-0 mt-0.5"
                    aria-hidden="true"
                  />

                  <p className="text-sm sm:text-base text-ivory/80">
                    Personalized travel recommendations
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-accent shrink-0 mt-0.5"
                    aria-hidden="true"
                  />

                  <p className="text-sm sm:text-base text-ivory/80">
                    Honest pricing with no hidden charges
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-accent shrink-0 mt-0.5"
                    aria-hidden="true"
                  />

                  <p className="text-sm sm:text-base text-ivory/80">
                    Support from planning to your journey
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 text-ivory/70">
                <MessageCircle
                  className="w-5 h-5 text-accent shrink-0"
                  aria-hidden="true"
                />

                <span className="text-sm">
                  Our team will get back to you after
                  receiving your enquiry.
                </span>
              </div>
            </div>

            {/* RIGHT */}

            <div className="w-full min-w-0">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-xl">
                <div className="mb-5 sm:mb-6">
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-navy">
                    Plan My Trip
                  </h3>

                  <p className="mt-1 text-sm text-navy/60">
                    Share your travel details and we'll
                    help you plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePlanTrip}
                  className="w-full inline-flex items-center justify-center gap-2
                             bg-accent hover:bg-accent-hover
                             text-white font-semibold
                             px-6 py-3.5 rounded-full
                             transition-colors"
                >
                  Start Your Enquiry

                  <ArrowRight
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

       <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm uppercase tracking-wide font-bold text-[#F22727]">
                Traveller experiences
              </p>

              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#102040]">
                Your Valuable Review
              </h2>

              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                Share your experience with On a Trip Holidays and help
                future travellers plan their journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy  text-white font-bold px-5 py-3.5 transition shrink-0"
            >
              <MessageSquareHeart className="w-4 h-4" />
              Your Valuable Review
            </button>
          </div>
        </div>
      </section>


        {showReview && (
              <ReviewFormModal
                open={showReview}
                onClose={() => setShowReview(false)}
                onSubmitted={() => setShowReview(false)}
              />
            )}


      <FAQSection />

      

      {/* ===================================================
          FOOTER
      =================================================== */}

      <Footer />

      {!onPlanTrip && localEnquiryOpen && (
        <EnquiryForm
          onClose={() => setLocalEnquiryOpen(false)}
        />
      )}
    </div>
  );
}
























