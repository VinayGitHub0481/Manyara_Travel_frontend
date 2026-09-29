

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Users,
  Star,
  Headphones,
  ArrowRight,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { getAbout } from "../api/content";

export default function AboutSection() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAbout = async () => {
      try {
        setLoading(true);

        const data = await getAbout();

        if (mounted) {
          setAboutData(data || null);
        }
      } catch (error) {
        console.error("Failed to load About section:", error);

        if (mounted) {
          setAboutData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAbout();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     NORMALIZE BACKEND RESPONSE
  ======================================================= */

  const about = aboutData?.about || null;

  const leadership = useMemo(
    () =>
      Array.isArray(aboutData?.leadership)
        ? aboutData.leadership.filter(
            (person) => person?.is_active !== false
          )
        : [],
    [aboutData?.leadership]
  );

  const team = useMemo(
    () =>
      Array.isArray(aboutData?.team)
        ? aboutData.team.filter(
            (member) =>
              member?.is_active !== false &&
              member?.show_public_profile !== false
          )
        : [],
    [aboutData?.team]
  );

  /* =======================================================
     DYNAMIC CONTENT
  ======================================================= */

  const companyName =
    about?.company_name || "On a Trip Holidays";

  const title =
    about?.story_title ||
    about?.hero_title ||
    "Travel planned with care.";

  const description =
    about?.story_content ||
    about?.hero_description ||
    "We create thoughtfully planned travel experiences designed around the people, places and moments that matter.";

  /* =======================================================
     DYNAMIC STATS
     Only show statistics that are actually available
     from the About API.
  ======================================================= */

  const stats = useMemo(() => {
    const items = [];

    if (about?.founded_year) {
      items.push({
        icon: CalendarDays,
        value: about.founded_year,
        label: "Year founded",
      });
    }

    if (Number(about?.years_experience) > 0) {
      items.push({
        icon: Compass,
        value: `${about.years_experience}+`,
        label: "Years of experience",
      });
    }

    if (team.length > 0) {
      items.push({
        icon: Users,
        value: team.length,
        label: team.length === 1 ? "Team member" : "Team members",
      });
    }

    if (leadership.length > 0) {
      items.push({
        icon: Star,
        value: leadership.length,
        label:
          leadership.length === 1
            ? "Leadership member"
            : "Leadership members",
      });
    }

    return items;
  }, [
    about?.founded_year,
    about?.years_experience,
    team.length,
    leadership.length,
  ]);

  return (
    <section
      id="about"
      className="bg-surface py-16 sm:py-20"
      aria-labelledby="home-about-title"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-12 lg:px-8">
        {/* ===================================================
            CONTENT
        =================================================== */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-hover">
            Who we are
          </p>

          <h2
            id="home-about-title"
            className="mb-4 mt-2 font-display text-2xl font-semibold text-navy sm:mb-5 sm:text-3xl md:text-4xl"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2
                  className="h-5 w-5 animate-spin text-accent"
                  aria-hidden="true"
                />

                <span>Loading {companyName}...</span>
              </span>
            ) : (
              title
            )}
          </h2>

          <p className="mb-6 whitespace-pre-line leading-relaxed text-navy/70">
            {description}
          </p>

          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            Learn more about us

            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ===================================================
            DYNAMIC STATS
        =================================================== */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"
              >
                <div className="mb-3 h-5 w-5 rounded bg-navy/10" />

                <div className="h-8 w-20 rounded bg-navy/10" />

                <div className="mt-2 h-4 w-28 rounded bg-navy/10" />
              </div>
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map(
              ({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-navy/10 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-md sm:p-6"
                >
                  <Icon
                    className="mb-2 h-5 w-5 text-accent"
                    aria-hidden="true"
                  />

                  <p className="font-display text-2xl font-semibold text-navy sm:text-3xl">
                    {value}
                  </p>

                  <p className="mt-1 text-sm text-navy/60">
                    {label}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-navy/10 bg-white p-6">
            <p className="text-sm leading-relaxed text-navy/60">
              Learn more about {companyName} and our travel
              experiences.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}





















