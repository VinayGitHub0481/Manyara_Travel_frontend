



import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  Users,
  UserRound,
} from "lucide-react";

import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import { getTeamMembers } from "../../api/content";

/* ============================================================
   HELPERS
   ============================================================ */

const getSafeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const cleanText = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const getImageUrl = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    return image.trim() || null;
  }

  if (typeof image === "object" && image.url) {
    return image.url;
  }

  return null;
};

const getDisplayOrder = (member) => {
  const value = Number(member?.display_order);

  return Number.isFinite(value)
    ? value
    : Number.MAX_SAFE_INTEGER;
};

const getExperienceText = (years) => {
  const value = Number(years);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return `${value}+ ${value === 1 ? "year" : "years"} experience`;
};

const getInitials = (name) => {
  const value = cleanText(name);

  if (!value) return "OH";

  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getSafeUrl = (value) => {
  const text = cleanText(value);

  if (!text) return null;

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return null;
};

/* ============================================================
   IMAGE
   ============================================================ */

function TeamMemberImage({ member, className = "" }) {
  const name = cleanText(member?.name) || "On a Trip Team";
  const imageUrl = getImageUrl(member?.image);

  return (
    <div
      className={`
        relative
        w-full
        aspect-[4/3]
        overflow-hidden
        bg-surface-blue
        ${className}
      `}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} — ${cleanText(member?.designation)}`}
          className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-[1.03]
          "
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-surface-blue
            to-surface
          "
        >
          <div
            className="
              w-20
              h-20
              sm:w-24
              sm:h-24
              rounded-full
              bg-navy
              text-ivory
              flex
              items-center
              justify-center
              font-display
              text-2xl
              sm:text-3xl
              font-semibold
            "
          >
            {getInitials(name)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CONTACT ROW
   ============================================================ */

function ContactActions({ member }) {
  const email = cleanText(member?.email);
  const phone = cleanText(member?.phone);
  const whatsapp = cleanText(member?.whatsapp);

  if (!email && !phone && !whatsapp) {
    return null;
  }

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        gap-2
        pt-4
        border-t
        border-navy/10
      "
    >
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label={`Email ${member?.name || "team member"}`}
          onClick={(event) => event.stopPropagation()}
          className="
            inline-flex
            items-center
            justify-center
            w-9
            h-9
            rounded-full
            bg-surface-orange
            text-accent
            hover:bg-accent
            hover:text-white
            transition-colors
          "
        >
          <Mail
            className="w-4 h-4"
            aria-hidden="true"
          />
        </a>
      )}

      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label={`Call ${member?.name || "team member"}`}
          onClick={(event) => event.stopPropagation()}
          className="
            inline-flex
            items-center
            justify-center
            w-9
            h-9
            rounded-full
            bg-surface-blue
            text-navy
            hover:bg-navy
            hover:text-white
            transition-colors
          "
        >
          <Phone
            className="w-4 h-4"
            aria-hidden="true"
          />
        </a>
      )}

      {whatsapp && (
        <a
          href={
            /^https?:\/\//i.test(whatsapp)
              ? whatsapp
              : `https://wa.me/${whatsapp.replace(/[^\d+]/g, "")}`
          }
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${member?.name || "team member"}`}
          onClick={(event) => event.stopPropagation()}
          className="
            inline-flex
            items-center
            justify-center
            w-9
            h-9
            rounded-full
            bg-surface-orange
            text-accent
            hover:bg-accent
            hover:text-white
            transition-colors
          "
        >
          <MessageCircle
            className="w-4 h-4"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  );
}

/* ============================================================
   TEAM CARD
   ============================================================ */

function TeamCard({ member }) {
  const name = cleanText(member?.name) || "Team Member";

  const designation =
    cleanText(member?.designation) || "OnaTrip Holiday";

  const department = cleanText(member?.department);

  const description =
    cleanText(member?.short_description) ||
    cleanText(member?.full_description);

  const experienceText = getExperienceText(
    member?.experience_years
  );

  const showProfile =
    member?.show_public_profile === true &&
    Boolean(cleanText(member?.slug));

  const cardContent = (
    <article
      className={`
        group
        h-full
        overflow-hidden
        rounded-3xl
        bg-white
        border
        border-navy/10
        shadow-sm
        ${
          showProfile
            ? "hover:-translate-y-1 hover:shadow-travel-hover transition-all duration-300"
            : ""
        }
      `}
    >
      <TeamMemberImage member={member} />

      <div className="p-5 sm:p-6">
        {/* Name */}

        <h2
          className="
            font-display
            text-xl
            sm:text-2xl
            font-semibold
            text-navy
            leading-tight
            break-words
          "
        >
          {name}
        </h2>

        {/* Designation */}

        <p
          className="
            text-accent
            text-sm
            sm:text-base
            font-semibold
            mt-1.5
          "
        >
          {designation}
        </p>

        {/* Department */}

        {department && (
          <div
            className="
              inline-flex
              items-center
              gap-1.5
              mt-3
              text-xs
              sm:text-sm
              text-navy/55
            "
          >
            <BriefcaseBusiness
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            />

            <span>{department}</span>
          </div>
        )}

        {/* Description */}

        {description && (
          <p
            className="
              mt-4
              text-sm
              sm:text-base
              text-navy/65
              leading-6
              sm:leading-7
              line-clamp-3
            "
          >
            {description}
          </p>
        )}

        {/* Experience */}

        {experienceText && (
          <div className="mt-4">
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-surface-blue
                text-navy
                px-3
                py-1.5
                text-xs
                sm:text-sm
                font-medium
              "
            >
              <CheckCircle2
                className="w-3.5 h-3.5 text-accent shrink-0"
                aria-hidden="true"
              />

              {experienceText}
            </span>
          </div>
        )}

        {/* Contact */}

        <div className="mt-5">
          <ContactActions member={member} />
        </div>

        {/* Public profile link */}

        {showProfile && (
          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              gap-3
              text-sm
              font-semibold
              text-navy
            "
          >
            <span className="group-hover:text-accent transition-colors">
              View full profile
            </span>

            <span
              className="
                inline-flex
                items-center
                justify-center
                w-8
                h-8
                rounded-full
                bg-surface-orange
                text-accent
                group-hover:bg-accent
                group-hover:text-white
                transition-colors
                shrink-0
              "
            >
              <ArrowRight
                className="w-4 h-4"
                aria-hidden="true"
              />
            </span>
          </div>
        )}
      </div>
    </article>
  );

  if (!showProfile) {
    return cardContent;
  }

  return (
    <Link
      to={`/about/team/${member.slug}`}
      className="
        block
        h-full
        rounded-3xl
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-accent
        focus-visible:ring-offset-4
      "
      aria-label={`View full profile of ${name}`}
    >
      {cardContent}
    </Link>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* ==========================================================
     FETCH TEAM
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadTeam = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getTeamMembers();

        if (!mounted) return;

        /*
         * API normally returns an array.
         * This fallback also handles { items: [] } safely.
         */
        const teamData = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        const sortedMembers = [...teamData].sort(
          (a, b) =>
            getDisplayOrder(a) - getDisplayOrder(b) ||
            Number(a?.id || 0) - Number(b?.id || 0)
        );

        setMembers(sortedMembers);
      } catch (error) {
        console.error("Failed to load team members:", error);

        if (!mounted) return;

        setMembers([]);

        if (error?.response?.status === 404) {
          setErrorMessage("The team information is not available.");
        } else {
          setErrorMessage(
            "Unable to load our team right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTeam();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     SEO
     ========================================================== */

  const seoDescription =
    "Meet the people behind OnaTrip Holiday. Discover our travel team, their roles, experience, and commitment to creating thoughtfully planned journeys.";

  const jsonLd = useMemo(() => {
    const itemList = members
      .filter((member) => cleanText(member?.name))
      .map((member, index) => {
        const memberName = cleanText(member.name);

        const item = {
          "@type": "ListItem",
          position: index + 1,
          name: memberName,
        };

        if (
          member?.show_public_profile === true &&
          cleanText(member?.slug)
        ) {
          item.url = `${SITE_URL}/about/team/${member.slug}`;
        }

        return item;
      });

    return [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Our Team | OnaTrip Holiday",
        description: seoDescription,
        url: `${SITE_URL}/about/team`,
      },

      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "OnaTrip Holiday Team",
        itemListElement: itemList,
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
          {
            "@type": "ListItem",
            position: 3,
            name: "Our Team",
            item: `${SITE_URL}/about/team`,
          },
        ],
      },
    ];
  }, [members, seoDescription]);

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Seo
          title="Our Team"
          description={seoDescription}
          path="/about/team"
        />

        <main>
          <section className="bg-navy text-ivory">
            <div
              className="
                max-w-6xl
                mx-auto
                px-4 sm:px-6 lg:px-8
                py-14 sm:py-18 lg:py-20
              "
            >
              <div className="animate-pulse">
                <div className="h-4 w-28 bg-white/10 rounded mb-5" />

                <div className="h-10 sm:h-12 w-2/3 bg-white/10 rounded mb-4" />

                <div className="h-4 w-full max-w-2xl bg-white/10 rounded" />
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-5
                sm:gap-6
              "
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="
                    overflow-hidden
                    rounded-3xl
                    border
                    border-navy/10
                    animate-pulse
                  "
                >
                  <div className="aspect-[4/3] bg-navy/10" />

                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="h-6 w-2/3 bg-navy/10 rounded" />
                    <div className="h-4 w-1/2 bg-navy/10 rounded" />
                    <div className="h-4 w-full bg-navy/10 rounded" />
                    <div className="h-4 w-4/5 bg-navy/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     ERROR
     ========================================================== */

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Seo
          title="Our Team"
          description={seoDescription}
          path="/about/team"
        />

        <main className="min-h-[65vh]">
          <section className="bg-navy text-ivory">
            <div
              className="
                max-w-6xl
                mx-auto
                px-4 sm:px-6 lg:px-8
                py-14 sm:py-18 lg:py-20
              "
            >
              <p className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.16em]">
                Our team
              </p>

              <h1
                className="
                  font-display
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-semibold
                  mt-2
                "
              >
                Meet the people behind OnaTrip
              </h1>
            </div>
          </section>

          <section
            className="
              max-w-3xl
              mx-auto
              px-4 sm:px-6 lg:px-8
              py-16
              text-center
            "
          >
            <div
              className="
                mx-auto
                w-16 h-16
                rounded-full
                bg-surface-orange
                text-accent
                flex
                items-center
                justify-center
                mb-6
              "
            >
              <Users
                className="w-7 h-7"
                aria-hidden="true"
              />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy">
              Team information unavailable
            </h2>

            <p className="mt-3 text-sm sm:text-base text-navy/60 leading-relaxed">
              {errorMessage}
            </p>

            <Link
              to="/about"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                mt-7
                bg-navy
                hover:bg-primary-hover
                text-ivory
                font-semibold
                px-6
                py-3.5
                rounded-full
                transition-colors
              "
            >
              <ArrowLeft
                className="w-4 h-4"
                aria-hidden="true"
              />

              Back to About
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     EMPTY STATE
     ========================================================== */

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Seo
          title="Our Team"
          description={seoDescription}
          path="/about/team"
        />

        <main>
          <section className="bg-navy text-ivory">
            <div
              className="
                max-w-6xl
                mx-auto
                px-4 sm:px-6 lg:px-8
                py-14 sm:py-18 lg:py-20
              "
            >
              <Link
                to="/about"
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  text-ivory/60
                  hover:text-ivory
                  transition-colors
                  mb-8
                "
              >
                <ArrowLeft
                  className="w-4 h-4"
                  aria-hidden="true"
                />

                Back to About
              </Link>

              <p className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.16em]">
                Our team
              </p>

              <h1
                className="
                  font-display
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-semibold
                  mt-2
                "
              >
                Meet the people behind OnaTrip
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base text-ivory/65 leading-relaxed">
                Our team information will appear here as it is added and
                published by the OnaTrip Holiday administration team.
              </p>
            </div>
          </section>

          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <div
              className="
                mx-auto
                w-16 h-16
                rounded-full
                bg-surface-blue
                text-navy
                flex
                items-center
                justify-center
                mb-6
              "
            >
              <UserRound
                className="w-7 h-7"
                aria-hidden="true"
              />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy">
              Our team is coming soon
            </h2>

            <p className="mt-3 text-sm sm:text-base text-navy/60 leading-relaxed">
              We are preparing the team profiles. Please check back soon.
            </p>

            <Link
              to="/about"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                mt-7
                bg-accent
                hover:bg-accent-hover
                text-white
                font-semibold
                px-6
                py-3.5
                rounded-full
                transition-colors
              "
            >
              <ArrowLeft
                className="w-4 h-4"
                aria-hidden="true"
              />

              Back to About
            </Link>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /* ==========================================================
     MAIN
     ========================================================== */

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Seo
        title="Our Team"
        description={seoDescription}
        path="/about/team"
        jsonLd={jsonLd}
      />

      <main>
        {/* ====================================================
            HERO
            ==================================================== */}

        <section className="bg-navy text-ivory">
          <div
            className="
              max-w-6xl
              mx-auto
              px-4 sm:px-6 lg:px-8
              py-10
              sm:py-14
              lg:py-18
            "
          >
            {/* Breadcrumb */}

            <nav
              aria-label="Breadcrumb"
              className="
                flex
                flex-wrap
                items-center
                gap-x-2
                gap-y-1
                text-xs
                sm:text-sm
                text-ivory/50
                mb-8
              "
            >
              <Link
                to="/"
                className="hover:text-ivory transition-colors"
              >
                Home
              </Link>

              <ChevronRight
                className="w-3.5 h-3.5"
                aria-hidden="true"
              />

              <Link
                to="/about"
                className="hover:text-ivory transition-colors"
              >
                About Us
              </Link>

              <ChevronRight
                className="w-3.5 h-3.5"
                aria-hidden="true"
              />

              <span className="text-ivory/80">
                Our Team
              </span>
            </nav>

            <div className="max-w-3xl">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-2
                  text-xs
                  sm:text-sm
                  text-ivory/75
                "
              >
                <Users
                  className="w-4 h-4 text-accent"
                  aria-hidden="true"
                />

                <span>Meet our team</span>
              </div>

              <h1
                className="
                  font-display
                  text-3xl
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                  font-semibold
                  leading-[1.08]
                  mt-5
                "
              >
                The people behind your journeys.
              </h1>

              <p
                className="
                  mt-5
                  text-sm
                  sm:text-base
                  lg:text-lg
                  text-ivory/65
                  leading-relaxed
                  max-w-2xl
                "
              >
                Get to know the people who help turn travel ideas into
                thoughtfully planned OnaTrip Holiday experiences.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            TEAM GRID
            ==================================================== */}

        <section
          className="
            max-w-6xl
            mx-auto
            px-4 sm:px-6 lg:px-8
            py-12
            sm:py-16
            lg:py-20
          "
        >
          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-end
              sm:justify-between
              gap-4
              mb-8
              sm:mb-10
            "
          >
            <div>
              <p className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.16em]">
                Our people
              </p>

              <h2
                className="
                  font-display
                  text-2xl
                  sm:text-3xl
                  lg:text-4xl
                  font-semibold
                  text-navy
                  mt-2
                "
              >
                Meet the team
              </h2>
            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                text-navy/55
              "
            >
              <Users
                className="w-4 h-4 text-accent"
                aria-hidden="true"
              />

              <span>
                {members.length}{" "}
                {members.length === 1 ? "team member" : "team members"}
              </span>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-5
              sm:gap-6
              lg:gap-7
            "
          >
            {members.map((member) => (
              <TeamCard
                key={member?.id || member?.slug}
                member={member}
              />
            ))}
          </div>
        </section>

        {/* ====================================================
            ABOUT CTA
            ==================================================== */}

        <section className="bg-surface py-14 sm:py-18 lg:py-20">
          <div
            className="
              max-w-4xl
              mx-auto
              px-4 sm:px-6 lg:px-8
              text-center
            "
          >
            <p className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-[0.16em]">
              OnaTrip Holiday
            </p>

            <h2
              className="
                font-display
                text-2xl
                sm:text-3xl
                lg:text-4xl
                font-semibold
                text-navy
                mt-2
              "
            >
              Want to know more about us?
            </h2>

            <p
              className="
                mt-4
                text-sm
                sm:text-base
                text-navy/60
                leading-relaxed
                max-w-xl
                mx-auto
              "
            >
              Learn about our story, values, leadership, and the people
              who make OnaTrip Holiday what it is.
            </p>

            <div
              className="
                mt-7
                flex
                flex-col
                sm:flex-row
                items-stretch
                sm:items-center
                justify-center
                gap-3
              "
            >
              <Link
                to="/about"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-navy
                  hover:bg-primary-hover
                  text-ivory
                  font-semibold
                  px-6
                  py-3.5
                  rounded-full
                  transition-colors
                "
              >
                <ArrowLeft
                  className="w-4 h-4"
                  aria-hidden="true"
                />

                About OnaTrip
              </Link>

              <Link
                to="/packages"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-accent
                  hover:bg-accent-hover
                  text-white
                  font-semibold
                  px-6
                  py-3.5
                  rounded-full
                  transition-colors
                "
              >
                Explore Packages

                <ArrowRight
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}