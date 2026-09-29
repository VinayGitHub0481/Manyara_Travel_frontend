

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import {FaInstagram ,FaLinkedin ,FaFacebook} from "react-icons/fa";

import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getLeadership } from "../../api/content";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getSafeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") return image;

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

const getDisplayOrder = (item) => {
  const value = Number(item?.display_order);
  return Number.isFinite(value) ? value : 0;
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return `${value} ${value === 1 ? "year" : "years"} experience`;
};

const getInitials = (name) => {
  const value = cleanText(name);

  if (!value) return "OT";

  const words = value.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const getSafeUrl = (value) => {
  const url = cleanText(value);

  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return url;
  }

  return "";
};

/* -------------------------------------------------------------------------- */
/* Leadership Image                                                           */
/* -------------------------------------------------------------------------- */

function LeadershipImage({ leader, large = false }) {
  const imageUrl = getImageUrl(leader?.image);
  const initials = getInitials(leader?.name);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2rem] bg-navy-50",
        large ? "aspect-[4/5]" : "aspect-[4/5]",
      ].join(" ")}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={cleanText(leader?.name) || "On a Trip leadership"}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-100 via-navy-50 to-orange-50">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold text-navy-800 shadow-lg">
            {initials}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/60 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact Actions                                                             */
/* -------------------------------------------------------------------------- */

function ContactActions({ leader }) {
  const email = cleanText(leader?.email);
  const phone = cleanText(leader?.phone);
  const whatsapp = cleanText(leader?.whatsapp);

  const whatsappHref = whatsapp
    ? whatsapp.startsWith("http://") || whatsapp.startsWith("https://")
      ? whatsapp
      : `https://wa.me/${whatsapp.replace(/[^\d+]/g, "")}`
    : "";

  const hasActions = email || phone || whatsappHref;

  if (!hasActions) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-navy-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          aria-label={`Email ${cleanText(leader?.name)}`}
          title="Email"
        >
          <Mail size={17} />
        </a>
      )}

      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-navy-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          aria-label={`Call ${cleanText(leader?.name)}`}
          title="Call"
        >
          <Phone size={17} />
        </a>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-navy-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          aria-label={`WhatsApp ${cleanText(leader?.name)}`}
          title="WhatsApp"
        >
          <MessageCircle size={17} />
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Social Links                                                               */
/* -------------------------------------------------------------------------- */

function SocialLinks({ leader }) {
  const linkedin = getSafeUrl(leader?.linkedin);
  const instagram = getSafeUrl(leader?.instagram);
  const facebook = getSafeUrl(leader?.facebook);

  if (!linkedin && !instagram && !facebook) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-800 hover:text-white"
          aria-label={`${cleanText(leader?.name)} LinkedIn`}
          title="LinkedIn"
        >
          <FaLinkedin size={16} />
        </a>
      )}

 {instagram && (
  <a
    href={instagram}
    target="_blank"
    rel="noreferrer"
    onClick={(event) => event.stopPropagation()}
    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-800 hover:text-white"
    aria-label={`${cleanText(leader?.name)} Instagram`}
    title="Instagram"
  >
    <FaInstagram size={16} />
  </a>
)}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-800 hover:text-white"
          aria-label={`${cleanText(leader?.name)} Facebook`}
          title="Facebook"
        >
          <FaFacebook size={ 16} />
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Leadership Card                                                             */
/* -------------------------------------------------------------------------- */

function LeadershipCard({ leader }) {
  const name = cleanText(leader?.name);
  const designation = cleanText(leader?.designation);
  const shortBio =
    cleanText(leader?.short_bio) || cleanText(leader?.full_bio);
  const experience = getExperienceText(leader?.experience_years);

  const hasProfile = Boolean(leader?.slug);

  const cardContent = (
    <article className="group h-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-travel-hover transition duration-300 hover:-translate-y-1">
      <LeadershipImage leader={leader} />

      <div className="flex h-full flex-col p-6 sm:p-7">
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            {designation || "Leadership"}
          </p>

          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900 sm:text-[1.7rem]">
            {name || "Leadership member"}
          </h2>
        </div>

        {shortBio && (
          <p className="line-clamp-4 text-sm leading-7 text-slate-600">
            {shortBio}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {experience && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
              <BriefcaseBusiness size={14} />
              {experience}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
            <UserRound size={14} />
            Leadership
          </span>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <ContactActions leader={leader} />
              <SocialLinks leader={leader} />
            </div>

            {hasProfile && (
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-navy-800 transition group-hover:text-orange-600">
                View profile
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );

  if (!hasProfile) {
    return cardContent;
  }

  return (
    <Link
      to={`/about/leadership/${leader.slug}`}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
      aria-label={`View profile of ${name}`}
    >
      {cardContent}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading Card                                                                */
/* -------------------------------------------------------------------------- */

function LeadershipSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-white">
      <div className="aspect-[4/5] animate-pulse bg-slate-100" />

      <div className="space-y-4 p-6 sm:p-7">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Leadership() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadLeadership = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getLeadership();

        if (!mounted) return;

        const items = getSafeArray(response);

        const sorted = [...items].sort((a, b) => {
          const orderDifference =
            getDisplayOrder(a) - getDisplayOrder(b);

          if (orderDifference !== 0) {
            return orderDifference;
          }

          return Number(a?.id || 0) - Number(b?.id || 0);
        });

        setLeaders(sorted);
      } catch (err) {
        console.error("Failed to load leadership:", err);

        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "We couldn't load the leadership information right now."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLeadership();

    return () => {
      mounted = false;
    };
  }, []);

  const leaderCount = useMemo(() => leaders.length, [leaders]);

  const pageDescription =
    "Meet the leadership team behind On a Trip Holiday and learn more about the people building thoughtful travel experiences.";

  const itemListSchema = leaders.map((leader, index) => {
    const item = {
      "@type": "ListItem",
      position: index + 1,
      name: cleanText(leader?.name) || "On a Trip leader",
    };

    if (leader?.slug) {
      item.url = `${SITE_URL}/about/leadership/${leader.slug}`;
    }

    return item;
  });

  return (
    <>
      <Seo
        title="Our Leadership"
        description={pageDescription}
        path="/about/leadership"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "On a Trip Holiday Leadership",
            description: pageDescription,
            url: `${SITE_URL}/about/leadership`,
            isPartOf: {
              "@type": "WebSite",
              name: "On a Trip Holiday",
              url: SITE_URL,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "On a Trip Holiday Leadership Team",
            numberOfItems: leaderCount,
            itemListElement: itemListSchema,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "About",
                item: `${SITE_URL}/about`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Leadership",
                item: `${SITE_URL}/about/leadership`,
              },
            ],
          },
        ]}
      />

      <main className="min-h-screen bg-white">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="relative overflow-hidden bg-navy-900">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />

          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-sm text-white/60"
            >
              <Link
                to="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <ChevronRight size={15} />

              <Link
                to="/about"
                className="transition hover:text-white"
              >
                About
              </Link>

              <ChevronRight size={15} />

              <span className="text-white">Leadership</span>
            </nav>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                <Users size={15} />
                Our leadership
              </div>

              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                The people behind{" "}
                <span className="text-orange-400">
                  On a Trip Holiday
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                Meet the leaders shaping our approach to travel, service,
                and thoughtfully planned journeys.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-orange-600">
                Leadership team
              </p>

              <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
                Meet our leaders
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Get to know the people guiding On a Trip Holiday and the
                experiences we create for our travellers.
              </p>
            </div>

            {!loading && !error && leaderCount > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-700">
                <Users size={16} />
                {leaderCount}{" "}
                {leaderCount === 1 ? "leader" : "leaders"}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              <LeadershipSkeleton />
              <LeadershipSkeleton />
              <LeadershipSkeleton />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-[2rem] border border-orange-200 bg-orange-50 px-6 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm">
                <Users size={24} />
              </div>

              <h2 className="mt-5 font-display text-2xl font-semibold text-navy-900">
                Leadership information unavailable
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
                {error}
              </p>

              <Link
                to="/about"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-700"
              >
                <ArrowLeft size={16} />
                Back to About
              </Link>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && leaders.length === 0 && (
            <div className="rounded-[2rem] border border-border bg-surface px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy-700 shadow-sm">
                <Users size={28} />
              </div>

              <h2 className="mt-5 font-display text-2xl font-semibold text-navy-900">
                Leadership profiles coming soon
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600">
                Our leadership information will appear here once it has
                been published.
              </p>

              <Link
                to="/about"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-700"
              >
                Explore About Us
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Leaders */}
          {!loading && !error && leaders.length > 0 && (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((leader) => (
                <LeadershipCard
                  key={leader?.id || leader?.slug || leader?.name}
                  leader={leader}
                />
              ))}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom CTA                                                       */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-navy-900 to-navy-700 px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
                Plan your next journey
              </p>

              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ready to explore with On a Trip?
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                Browse our travel packages and find a journey that fits
                the way you want to travel.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/packages"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  Explore packages
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Back to About
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}