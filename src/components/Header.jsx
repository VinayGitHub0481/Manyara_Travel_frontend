

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Packages", href: "/packages" },
  { label: "Most Visited", href: "/destinations" },
  { label: "Batches", href: "/batches" },
  { label: "Happy Moments", href: "/happy-moments" },
  { label: "Reviews", href: "/reviews" },
  { label: "Blogs", href: "/blog" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Header({ onPlanTrip }) {
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ============================================================
  // HOME
  // ============================================================

  const handleHome = () => {
    setOpen(false);

    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.history.replaceState(null, "", "/");
    } else {
      navigate("/");
    }
  };

  // ============================================================
  // SECTION NAVIGATION
  // ============================================================

  const handleSectionNavigation = (sectionId) => {
    setOpen(false);

    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);

      if (element) {
        /*
         * Header height is now responsive.
         *
         * Instead of using hard-coded 100/110 values,
         * calculate the actual fixed header position + height.
         */
        const rootStyles = getComputedStyle(document.documentElement);

        const topInfoHeight =
          parseInt(
            rootStyles.getPropertyValue("--top-info-height"),
            10
          ) || 0;

        let headerHeight = 58;

        if (window.innerWidth >= 1024) {
          headerHeight = 66;
        } else if (window.innerWidth >= 640) {
          headerHeight = 62;
        }

        const headerOffset =
          topInfoHeight + headerHeight + 12;

        const elementPosition =
          element.getBoundingClientRect().top +
          window.scrollY;

        window.scrollTo({
          top: Math.max(
            0,
            elementPosition - headerOffset
          ),
          behavior: "smooth",
        });

        window.history.replaceState(
          null,
          "",
          `/#${sectionId}`
        );
      }

      return;
    }

    navigate(`/#${sectionId}`);
  };

  // ============================================================
  // PLAN A TRIP
  // ============================================================

  const handlePlanTrip = () => {
    setOpen(false);
    onPlanTrip?.();
  };

  // ============================================================
  // NAV LINK RENDERER
  // ============================================================

  const renderNavLink = (link, mobile = false) => {
    const commonClass = mobile
      ? `
          block
          w-full
          border-b
          border-navy/5
          py-2.5
          text-left
          text-sm
          font-medium
          text-navy/80
          transition-colors
          hover:text-navy
        `
      : `
          whitespace-nowrap
          text-[13px]
          font-medium
          text-navy/70
          transition-colors
          hover:text-navy
        `;

    // ----------------------------------------------------------
    // HOME
    // ----------------------------------------------------------

    if (link.href === "/") {
      return (
        <button
          key={link.label}
          type="button"
          onClick={handleHome}
          className={commonClass}
        >
          {link.label}
        </button>
      );
    }

    // ----------------------------------------------------------
    // SECTION
    // ----------------------------------------------------------

    if (link.section) {
      return (
        <button
          key={link.label}
          type="button"
          onClick={() =>
            handleSectionNavigation(link.section)
          }
          className={commonClass}
        >
          {link.label}
        </button>
      );
    }

    // ----------------------------------------------------------
    // NORMAL ROUTE
    // ----------------------------------------------------------

    return (
      <Link
        key={link.href}
        to={link.href}
        onClick={() => setOpen(false)}
        className={commonClass}
      >
        {link.label}
      </Link>
    );
  };

  // ============================================================
  // HEADER
  // ============================================================

  return (
    <header
      className="
        fixed
        inset-x-0
        z-50
        w-full
        border-b
        border-navy/10
        bg-ivory
        transition-[top]
        duration-200
      "
      style={{
        /*
         * IMPORTANT
         *
         * TopInfoBar controls --top-info-height.
         *
         * Enabled:
         *   mobile  = 52px
         *   tablet  = 58px
         *   desktop = 62px
         *
         * Disabled:
         *   = 0px
         *
         * Therefore the Header automatically moves to
         * the very top when the TopInfoBar is disabled.
         */
        top: "var(--top-info-height, 0px)",
      }}
    >
      {/* ======================================================
          MAIN HEADER
          ======================================================= */}

      <div
        className="
          mx-auto
          flex
          w-full
          max-w-7xl
          min-w-0
          items-center
          justify-between
          gap-3
          px-3
          sm:px-5
          md:px-6
          lg:px-8
          h-[58px]
          sm:h-[62px]
          lg:h-[66px]
        "
      >
        {/* ====================================================
            LOGO
            ==================================================== */}

        <button
          type="button"
          onClick={handleHome}
          className="
            flex
            min-w-0
            shrink-0
            items-center
          "
          aria-label="On a Trip Holidays Home"
        >
          <img
            src="/images/logo.webp"
            alt="On a Trip Holidays"
            className="
              block
              h-8
              w-auto
              max-w-[125px]
              shrink-0
              object-contain
              sm:h-9
              sm:max-w-[145px]
              lg:h-10
              lg:max-w-[165px]
            "
          />
        </button>

        {/* ====================================================
            DESKTOP NAVIGATION
            ==================================================== */}

        <nav
          className="
            hidden
            min-w-0
            flex-1
            items-center
            justify-center
            gap-3
            lg:flex
            xl:gap-5
            2xl:gap-6
          "
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) =>
            renderNavLink(link)
          )}
        </nav>

        {/* ====================================================
            DESKTOP PLAN A TRIP
            ==================================================== */}

        <div className="hidden shrink-0 lg:block">
          <button
            type="button"
            onClick={handlePlanTrip}
            className="
              whitespace-nowrap
              rounded-full
              bg-navy
              px-4
              py-2
              text-[13px]
              font-semibold
              text-ivory
              transition-colors
              hover:bg-navy-light
            "
          >
            Plan a Trip
          </button>
        </div>

        {/* ====================================================
            TABLET / MOBILE ACTIONS
            ==================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-1.5
            lg:hidden
          "
        >
          {/* PLAN A TRIP */}

          <button
            type="button"
            onClick={handlePlanTrip}
            className="
              shrink-0
              whitespace-nowrap
              rounded-full
              bg-navy
              px-3
              py-1.5
              text-[11px]
              font-semibold
              text-ivory
              transition-colors
              hover:bg-navy-light
              sm:px-3.5
              sm:py-2
              sm:text-xs
            "
          >
            Plan a Trip
          </button>

          {/* MENU */}

          <button
            type="button"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-navy
              transition-colors
              hover:bg-navy/5
            "
            onClick={() =>
              setOpen((previous) => !previous)
            }
            aria-label={
              open
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={open}
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================
          MOBILE / TABLET NAVIGATION
          ======================================================= */}

      {open && (
        <nav
          className="
            w-full
            max-h-[calc(100vh-120px)]
            overflow-y-auto
            border-t
            border-navy/10
            bg-ivory
            px-4
            pb-3
            pt-1
            sm:px-6
            lg:hidden
          "
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) =>
            renderNavLink(link, true)
          )}
        </nav>
      )}
    </header>
  );
}




