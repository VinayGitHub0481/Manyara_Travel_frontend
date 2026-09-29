

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import api from "../api/axios";

const TOP_BAR_HEIGHT = {
  mobile: 52,
  tablet: 58,
  desktop: 62,
};

function setTopBarHeight(enabled) {
  if (typeof document === "undefined") return;

  if (!enabled) {
    document.documentElement.style.setProperty(
      "--top-info-height",
      "0px"
    );
    return;
  }

  /*
   * CSS variable contains the responsive height.
   * We use CSS media queries below to select the correct
   * value for the current screen size.
   */
  document.documentElement.style.setProperty(
    "--top-info-height",
    `${TOP_BAR_HEIGHT.mobile}px`
  );
}

export default function TopInfoBar() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .get("/settings")
      .then((res) => {
        if (!mounted) return;

        const data = res?.data;

        setSettings(data);
        setLoading(false);

        /*
         * IMPORTANT:
         * If admin has disabled the top bar, immediately remove
         * its reserved space.
         */
        setTopBarHeight(Boolean(data?.top_bar_enabled));
      })
      .catch((error) => {
        console.error("Failed to load top bar settings:", error);

        if (!mounted) return;

        setError(true);
        setLoading(false);

        /*
         * If settings cannot be loaded, do not leave empty space.
         */
        setTopBarHeight(false);
      });

    return () => {
      mounted = false;

      /*
       * Cleanup when component unmounts.
       */
      setTopBarHeight(false);
    };
  }, []);

  /*
   * Keep the CSS variable responsive.
   *
   * When the top bar is enabled:
   * mobile  = 52px
   * tablet  = 58px
   * desktop = 62px
   *
   * When disabled:
   * all sizes = 0px
   */
  useEffect(() => {
    if (!settings?.top_bar_enabled) return;

    const updateHeight = () => {
      if (typeof window === "undefined") return;

      if (window.matchMedia("(min-width: 1024px)").matches) {
        document.documentElement.style.setProperty(
          "--top-info-height",
          "62px"
        );
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        document.documentElement.style.setProperty(
          "--top-info-height",
          "58px"
        );
      } else {
        document.documentElement.style.setProperty(
          "--top-info-height",
          "52px"
        );
      }
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [settings?.top_bar_enabled]);

  /*
   * ------------------------------------------------------------
   * ERROR
   * ------------------------------------------------------------
   */
  if (error) {
    return null;
  }

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   *
   * During the initial request we temporarily reserve the
   * top-bar height so the Header does not jump.
   * ------------------------------------------------------------
   */
  if (loading) {
    return (
      <>
        <style>
          {`
            :root {
              --top-info-height: 52px;
            }

            @media (min-width: 768px) {
              :root {
                --top-info-height: 58px;
              }
            }

            @media (min-width: 1024px) {
              :root {
                --top-info-height: 62px;
              }
            }
          `}
        </style>

        <div
          className="
            fixed
            left-0
            right-0
            top-0
            z-[60]
            h-[52px]
            w-full
            overflow-hidden
            border-b
            border-white/10
            bg-[#03112D]
            text-white
            md:h-[58px]
            lg:h-[62px]
          "
          aria-label="Loading top information"
          role="status"
        >
          <div
            className="
              mx-auto
              flex
              h-full
              w-full
              max-w-7xl
              items-center
              px-3
              sm:px-5
              md:px-6
              lg:px-8
            "
          >
            <div
              className="
                flex
                w-full
                min-w-0
                items-center
                justify-between
                gap-2
                sm:gap-4
                md:gap-5
                lg:gap-7
              "
            >
              {/* LEFT */}
              <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
                <span
                  className="
                    h-3
                    w-12
                    animate-pulse
                    rounded
                    bg-white/15
                    sm:w-14
                  "
                />

                <span
                  className="
                    hidden
                    h-3
                    w-12
                    animate-pulse
                    rounded
                    bg-white/15
                    sm:block
                    sm:w-14
                  "
                />
              </div>

              {/* CENTER */}
              <div
                className="
                  hidden
                  min-w-0
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  sm:flex
                "
              >
                <span
                  className="
                    h-3
                    w-3
                    animate-pulse
                    rounded-full
                    bg-white/15
                  "
                />

                <span
                  className="
                    h-3
                    w-20
                    animate-pulse
                    rounded
                    bg-white/15
                    sm:w-28
                    md:w-36
                  "
                />

                <span
                  className="
                    h-3
                    w-20
                    animate-pulse
                    rounded
                    bg-white/15
                    sm:w-20
                    md:w-28
                  "
                />
              </div>

              {/* RIGHT */}
              <div className="flex min-w-0 shrink justify-end">
                <span
                  className="
                    h-3
                    w-20
                    animate-pulse
                    rounded
                    bg-white/15
                    sm:w-28
                    md:w-36
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /*
   * ------------------------------------------------------------
   * ADMIN DISABLED
   * ------------------------------------------------------------
   *
   * Most important part:
   *
   * The component renders nothing AND the CSS variable has
   * already been changed to 0px.
   *
   * Therefore Header moves completely to the top.
   * ------------------------------------------------------------
   */
  if (!settings?.top_bar_enabled) {
    return null;
  }

  const location1 = settings?.top_bar_location_1?.trim();
  const location2 = settings?.top_bar_location_2?.trim();

  const travellerText =
    settings?.top_bar_traveller_text?.trim();

  const social1Name =
    settings?.top_bar_social_1_name?.trim();

  const social1Url =
    settings?.top_bar_social_1_url?.trim();

  const social2Name =
    settings?.top_bar_social_2_name?.trim();

  const social2Url =
    settings?.top_bar_social_2_url?.trim();

  /*
   * ------------------------------------------------------------
   * SOCIAL ICON
   * ------------------------------------------------------------
   */
  const getSocialIcon = (name) => {
    const value = name?.toLowerCase();

    if (value?.includes("instagram")) {
      return FaInstagram;
    }

    if (value?.includes("youtube")) {
      return FaYoutube;
    }

    return null;
  };

  /*
   * ------------------------------------------------------------
   * SOCIAL LINK
   * ------------------------------------------------------------
   */
  const SocialLink = ({ name, url }) => {
    if (!name || !url) {
      return null;
    }

    const Icon = getSocialIcon(name);

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex
          shrink-0
          items-center
          gap-1
          whitespace-nowrap
          text-[10px]
          font-medium
          text-white/80
          transition-colors
          hover:text-white
          sm:gap-1.5
          sm:text-xs
        "
        aria-label={name}
      >
        {Icon && (
          <Icon
            className="
              h-3
              w-3
              shrink-0
              sm:h-3.5
              sm:w-3.5
            "
            aria-hidden="true"
          />
        )}

        <span>{name}</span>
      </a>
    );
  };

  const hasLocations = Boolean(location1 || location2);

  const hasSocials = Boolean(
    (social1Name && social1Url) ||
      (social2Name && social2Url)
  );

  const hasTraveller = Boolean(travellerText);

  /*
   * Nothing to display.
   */
  if (!hasLocations && !hasSocials && !hasTraveller) {
    setTopBarHeight(false);
    return null;
  }

  /*
   * ------------------------------------------------------------
   * ENABLED TOP BAR
   * ------------------------------------------------------------
   */
  return (
    <div
      className="
        fixed
        left-0
        right-0
        top-0
        z-[60]
        h-[52px]
        w-full
        overflow-hidden
        border-b
        border-white/10
        bg-[#03112D]
        text-white
        md:h-[58px]
        lg:h-[62px]
      "
    >
      <div
        className="
          mx-auto
          flex
          h-full
          w-full
          max-w-7xl
          items-center
          px-3
          sm:px-5
          md:px-6
          lg:px-8
        "
      >
        <div
          className="
            flex
            w-full
            min-w-0
            items-center
            justify-between
            gap-2
            sm:gap-4
            md:gap-5
            lg:gap-7
          "
        >
          {/* ==================================================
              LEFT — SOCIAL LINKS
              ================================================== */}
          {hasSocials && (
            <div
              className="
                flex
                shrink-0
                items-center
                gap-2.5
                sm:gap-4
              "
            >
              <SocialLink
                name={social1Name}
                url={social1Url}
              />

              <SocialLink
                name={social2Name}
                url={social2Url}
              />
            </div>
          )}

          {/* ==================================================
              CENTER — LOCATIONS
              ================================================== */}
          {hasLocations && (
            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                justify-center
                gap-1.5
                overflow-hidden
                text-[10px]
                text-white/80
                sm:gap-2
                sm:text-xs
                md:text-sm
              "
            >
              <MapPin
                className="
                  hidden
                  h-3
                  w-3
                  shrink-0
                  text-[#FF3B0B]
                  sm:inline
                "
                aria-hidden="true"
              />

              {location1 && (
                <span
                  className="
                    hidden
                    max-w-[90px]
                    truncate
                    sm:inline
                    md:max-w-none
                  "
                >
                  {location1}
                </span>
              )}

              {location1 && location2 && (
                <span
                  className="
                    hidden
                    shrink-0
                    text-white/40
                    sm:inline
                  "
                >
                  •
                </span>
              )}

              {location2 && (
                <span
                  className="
                    hidden
                    max-w-[150px]
                    truncate
                    sm:inline
                    md:max-w-none
                  "
                >
                  {location2}
                </span>
              )}
            </div>
          )}

          {/* ==================================================
              RIGHT — TRAVELLER TEXT
              ================================================== */}
          {hasTraveller && (
            <div
              className="
                min-w-0
                max-w-[150px]
                shrink
                truncate
                text-left
                text-[10px]
                font-medium
                text-white/90
                sm:max-w-[200px]
                sm:text-right
                md:max-w-none
                md:text-sm
              "
              title={travellerText}
            >
              {travellerText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






















