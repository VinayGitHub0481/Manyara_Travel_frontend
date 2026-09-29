import React, { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

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

import {
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa";

import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getTeamMemberBySlug } from "../../api/content";
import FAQSection from "../../components/FAQSection";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getImageUrl = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return (
      image?.url ||
      image?.secure_url ||
      image?.src ||
      image?.image_url ||
      ""
    );
  }

  return "";
};

/**
 * Only allow normal web URLs for social links.
 * This prevents unsafe values such as javascript: URLs.
 */
const getSafeUrl = (value) => {
  const url = cleanText(value);

  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    ) {
      return parsed.toString();
    }

    return "";
  } catch {
    return "";
  }
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

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
};

/**
 * Converts a WhatsApp phone number into a wa.me URL.
 *
 * Examples:
 * +91 98765 43210 -> https://wa.me/919876543210
 * 919876543210    -> https://wa.me/919876543210
 *
 * If the admin already entered a complete WhatsApp URL,
 * it is returned after validation.
 */
const getWhatsAppUrl = (value) => {
  const whatsapp = cleanText(value);

  if (!whatsapp) return "";

  // Already a URL
  if (/^https?:\/\//i.test(whatsapp)) {
    return getSafeUrl(whatsapp);
  }

  // Convert phone number to digits only
  const digits = whatsapp.replace(/[^\d]/g, "");

  if (!digits) return "";

  return `https://wa.me/${digits}`;
};

/* -------------------------------------------------------------------------- */
/* Contact Actions                                                            */
/* -------------------------------------------------------------------------- */

function ContactActions({ member }) {
  const email = cleanText(member?.email);
  const phone = cleanText(member?.phone);
  const whatsappHref = getWhatsAppUrl(member?.whatsapp);

  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">

          {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-orange-600 px-4 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <Phone
            size={16}
            aria-hidden="true"
          />
          Call
        </a>
      )}

      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <Mail
            size={16}
            aria-hidden="true"
          />
          Email
        </a>
      )}

  

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-green-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          <FaWhatsapp
            size={16}
            aria-hidden="true"
          />
          WhatsApp
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Social Links                                                               */
/* -------------------------------------------------------------------------- */

function SocialLinks({ member }) {
  const linkedin = getSafeUrl(member?.linkedin);
  const instagram = getSafeUrl(member?.instagram);

  if (!linkedin && !instagram) {
    return null;
  }

  const memberName =
    cleanText(member?.name) || "Team member";

  return (
    <div className="flex items-center gap-2">
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-800 hover:text-white sm:h-11 sm:w-11"
          aria-label={`${memberName} LinkedIn`}
          title="LinkedIn"
        >
          <FaLinkedinIn
            className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
          />
        </a>
      )}

      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-700 transition hover:bg-navy-800 hover:text-white sm:h-11 sm:w-11"
          aria-label={`${memberName} Instagram`}
          title="Instagram"
        >
          <FaInstagram
            className="h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading State                                                              */
/* -------------------------------------------------------------------------- */

function TeamMemberSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-navy-900">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />

          <div className="mt-7 grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12">
            <div className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-white/10" />

            <div className="space-y-4">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="h-16 w-full animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TeamMemberDetail() {
  const { slug } = useParams();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------------------------------- */
  /* Load Team Member                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadMember = async () => {
      if (!slug) {
        setError(
          "Team member profile could not be found."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMember(null);

        const response =
          await getTeamMemberBySlug(slug);

        if (!mounted) return;

        setMember(response);
      } catch (err) {
        console.error(
          "Failed to load team member:",
          err
        );

        if (!mounted) return;

        const status = err?.response?.status;

        if (status === 404) {
          setError(
            "This team member profile is not available."
          );
        } else if (status === 403) {
          setError(
            "This team member profile is not publicly available."
          );
        } else {
          setError(
            err?.response?.data?.detail ||
              "We couldn't load this team member profile right now."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* ---------------------------------------------------------------------- */
  /* Normalized Data                                                        */
  /* ---------------------------------------------------------------------- */

  const name = cleanText(member?.name);
  const designation = cleanText(member?.designation);
  const department = cleanText(member?.department);

  const shortDescription = cleanText(
    member?.short_description
  );

  const fullDescription =
    cleanText(member?.full_description) ||
    shortDescription;

  const imageUrl = getImageUrl(member?.image);

  const experience = getExperienceText(
    member?.experience_years
  );

  const pageTitle = name
    ? `${name} — ${
        designation || "Team Member"
      }`
    : "Team Member";

  const pageDescription =
    shortDescription ||
    (name
      ? `Learn more about ${name}, ${
          designation || "a team member"
        } at On a Trip Holiday.`
      : "Meet the team behind On a Trip Holiday.");

  const profileUrl = member?.slug
    ? `${SITE_URL}/about/team/${member.slug}`
    : `${SITE_URL}/about/team`;

  /* ---------------------------------------------------------------------- */
  /* Person Schema                                                          */
  /* ---------------------------------------------------------------------- */

  const personSchema = useMemo(() => {
    if (!member) return null;

    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: name || "On a Trip Team Member",
      url: profileUrl,
      worksFor: {
        "@type": "Organization",
        name: "On a Trip Holiday",
        url: SITE_URL,
      },
    };

    if (designation) {
      person.jobTitle = designation;
    }

    if (department) {
      person.department = department;
    }

    if (imageUrl) {
      person.image = imageUrl;
    }

    if (member?.email) {
      person.email = cleanText(member.email);
    }

    if (
      member?.telephone ||
      member?.phone
    ) {
      person.telephone = cleanText(
        member.telephone ||
          member.phone
      );
    }

    const linkedin = getSafeUrl(
      member?.linkedin
    );

    const instagram = getSafeUrl(
      member?.instagram
    );

    const sameAs = [];

    if (linkedin) {
      sameAs.push(linkedin);
    }

    if (instagram) {
      sameAs.push(instagram);
    }

    if (sameAs.length > 0) {
      person.sameAs = sameAs;
    }

    return person;
  }, [
    member,
    name,
    designation,
    department,
    imageUrl,
    profileUrl,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Seo
          title="Team Member"
          description="Meet the team behind On a Trip Holiday."
          path={`/about/team/${slug || ""}`}
        />

        <TeamMemberSkeleton />
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error / Not Found                                                      */
  /* ---------------------------------------------------------------------- */

  if (error || !member) {
    return (
      <>
        <Seo
          title="Team Member Not Found"
          description="The requested On a Trip Holiday team member profile is not available."
          path={`/about/team/${slug || ""}`}
          noindex
        />

        <main className="min-h-screen bg-white">
          <section className="bg-navy-900">
            <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-orange-400 sm:h-16 sm:w-16">
                <UserRound
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <h1 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
                Team member unavailable
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                {error ||
                  "The requested team member profile could not be found."}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
                <Link
                  to="/about/team"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  <ArrowLeft
                    size={17}
                    aria-hidden="true"
                  />
                  Back to team
                </Link>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  About On a Trip
                </Link>
              </div>
            </div>
          </section>

          <Footer />
        </main>
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Main                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        path={`/about/team/${member.slug}`}
        image={imageUrl || undefined}
        type="profile"
        jsonLd={[
          personSchema,
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
                name: "Team",
                item: `${SITE_URL}/about/team`,
              },
              {
                "@type": "ListItem",
                position: 4,
                name:
                  name || "Team Member",
                item: profileUrl,
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

          <div className="relative mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
            {/* Breadcrumb */}

            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1.5 text-xs text-white/60 sm:gap-2 sm:text-sm"
            >
              <Link
                to="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <ChevronRight
                size={14}
                aria-hidden="true"
              />

              <Link
                to="/about"
                className="transition hover:text-white"
              >
                About Us
              </Link>

              <ChevronRight
                size={14}
                aria-hidden="true"
              />

              <span className="max-w-[180px] truncate text-white sm:max-w-none">
                {name || "Team Member"}
              </span>
            </nav>

            <div className="mt-7 grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-12">
              {/* Image */}

              <div className="mx-auto w-full max-w-md lg:mx-0">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={
                        name ||
                        "On a Trip team member"
                      }
                      className="aspect-[4/5] h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-navy-700 via-navy-800 to-orange-900/40">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white backdrop-blur sm:h-28 sm:w-28 sm:text-3xl">
                        {getInitials(name)}
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/70 to-transparent" />
                </div>
              </div>

              {/* Intro */}

              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300 sm:px-4 sm:py-2 sm:text-xs">
                  <Users
                    size={14}
                    aria-hidden="true"
                  />
                  On a Trip team
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300 sm:text-sm">
                  {designation ||
                    "Team member"}
                </p>

                <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {name || "Team Member"}
                </h1>

                {department && (
                  <p className="mt-2.5 text-base font-medium text-white/70 sm:mt-3 sm:text-lg">
                    {department}
                  </p>
                )}

                {shortDescription && (
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
                    {shortDescription}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
                  {experience && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      <BriefcaseBusiness
                        size={15}
                        aria-hidden="true"
                      />
                      {experience}
                    </span>
                  )}

                  {department && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      <Users
                        size={15}
                        aria-hidden="true"
                      />
                      {department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Profile Content                                                  */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
            {/* Main description */}

            <article>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600 sm:text-sm">
                About {name || "this team member"}
              </p>

              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">
                A member of the On a Trip team
              </h2>

              {fullDescription ? (
                <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
                  {fullDescription}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
                  More information about
                  this team member will be
                  added soon.
                </p>
              )}

              {/* Contact */}

              <div className="mt-6 sm:mt-7">
                <ContactActions
                  member={member}
                />
              </div>
            </article>

            {/* Sidebar */}

            <aside>
              <div className="rounded-[1.75rem] border border-border bg-surface p-5 sm:p-6">
                <h3 className="font-display text-xl font-semibold text-navy-900">
                  Profile
                </h3>

                <div className="mt-5 space-y-4">
                  {designation && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Designation
                      </p>

                      <p className="mt-1 text-sm font-semibold text-navy-800">
                        {designation}
                      </p>
                    </div>
                  )}

                  {department && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Department
                      </p>

                      <p className="mt-1 text-sm font-semibold text-navy-800">
                        {department}
                      </p>
                    </div>
                  )}

                  {experience && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Experience
                      </p>

                      <p className="mt-1 text-sm font-semibold text-navy-800">
                        {experience}
                      </p>
                    </div>
                  )}

                  {member?.email && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Email
                      </p>

                      <a
                        href={`mailto:${member.email}`}
                        className="mt-1 block break-all text-sm font-semibold text-navy-800 transition hover:text-orange-600"
                      >
                        {member.email}
                      </a>
                    </div>
                  )}

                  {member?.phone && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Phone
                      </p>

                      <a
                        href={`tel:${member.phone}`}
                        className="mt-1 block text-sm font-semibold text-navy-800 transition hover:text-orange-600"
                      >
                        {member.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <SocialLinks
                    member={member}
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Navigation CTA                                                   */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
          <div className="rounded-[2rem] bg-gradient-to-br from-navy-900 to-navy-700 px-5 py-8 sm:rounded-[2.25rem] sm:px-8 sm:py-10 lg:px-10 lg:py-11">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300 sm:text-sm">
                  Explore On a Trip
                </p>

                <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Discover the packages and
                  journeys behind our brand.
                </h2>

                {/* <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                  Meet the rest of our team
                  or explore the travel
                  experiences we create for
                  our travellers.
                </p> */}
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row lg:shrink-0">
                {/*
                <Link
                  to="/about/team"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-navy-900 transition hover:bg-slate-100"
                >
                  <ArrowLeft
                    size={17}
                    aria-hidden="true"
                  />
                  Meet the team
                </Link>
                */}

                <Link
                  to="/packages"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  Explore packages

                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FAQSection />

      <Footer />
    </>
  );
}