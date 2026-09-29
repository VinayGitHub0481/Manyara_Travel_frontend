
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const MAIN_NAV_ITEMS = [
  { to: "/admin/dashboard/blogs", label: "Blogs" },
  { to: "/admin/dashboard/packages", label: "Packages" },
  { to: "/admin/dashboard/most-visited", label: "Most Visited" },
  { to: "/admin/dashboard/happy-moments", label: "Happy Moments" },
  { to: "/admin/dashboard/testimonials", label: "Testimonials" },
  { to: "/admin/dashboard/faqs", label: "FAQs" },
  { to: "/admin/dashboard/enquiries", label: "Enquiries" },
  { to: "/admin/dashboard/batches" , label :"Batches"},
  { to: "/admin/dashboard/policies", label: "Policies"}
];

const ABOUT_ITEMS = [
  {
    to: "/admin/dashboard/about",
    label: "About Management",
    end: true,
  },
  {
    to: "/admin/dashboard/about/leadership",
    label: "Leadership",
  },
  {
    to: "/admin/dashboard/about/team",
    label: "Team",
  },
  {
    to: "/admin/dashboard/about/milestones",
    label: "Milestones",
  },
  {
    to: "/admin/dashboard/about/values",
    label: "Values",
  },
];

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();

  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAboutRoute = location.pathname.startsWith(
    "/admin/dashboard/about"
  );

  const [aboutOpen, setAboutOpen] = useState(isAboutRoute);

  const navLinkClass = ({ isActive }) =>
    `
      flex items-center
      px-3 py-2.5
      rounded-lg
      text-sm font-medium
      whitespace-nowrap
      transition-colors
      ${
        isActive
          ? "bg-accent text-navy"
          : "text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
      }
    `;

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-ivory flex flex-col md:flex-row overflow-x-hidden">
      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}
      <header className="md:hidden sticky top-0 z-50 bg-navy text-ivory border-b border-ivory/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-display text-lg font-semibold">
              On a <span className="text-accent">Trip</span>
            </p>

            <p className="text-[11px] text-ivory/50">
              Admin panel
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="
              p-2
              rounded-lg
              text-ivory/80
              hover:bg-ivory/10
              transition-colors
            "
            aria-label="Toggle admin menu"
          >
            {mobileMenuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed
          md:static
          inset-x-0
          top-[61px]
          md:top-0
          bottom-0
          z-40

          w-full
          md:w-60
          md:shrink-0

          bg-navy
          text-ivory

          flex
          flex-col

          transform
          transition-transform
          duration-200

          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* =================================================
            LOGO
        ================================================== */}
        <div
          className="
            hidden
            md:block
            px-5
            py-6
            border-b
            border-ivory/10
          "
        >
          <p className="font-display text-lg font-semibold">
            On a <span className="text-accent">Trip</span>
          </p>

          <p className="text-xs text-ivory/50 mt-1">
            Admin panel
          </p>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}
        <nav
          className="
            flex-1
            flex
            flex-col
            gap-1

            px-3
            py-4

            overflow-y-auto

            scrollbar-thin
          "
        >
          {/* Main navigation */}
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}

          {/* =================================================
              ABOUT SECTION
          ================================================== */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setAboutOpen((prev) => !prev)}
              className={`
                w-full
                flex
                items-center
                justify-between

                px-3
                py-2.5

                rounded-lg

                text-sm
                font-medium

                transition-colors

                ${
                  isAboutRoute
                    ? "bg-ivory/10 text-ivory"
                    : "text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
                }
              `}
            >
              <span>About</span>

              {aboutOpen ? (
                <ChevronDown size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </button>

            {aboutOpen && (
              <div className="mt-1 ml-2 pl-3 border-l border-ivory/10 space-y-1">
                {ABOUT_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `
                        flex
                        items-center

                        px-3
                        py-2

                        rounded-md

                        text-xs
                        font-medium

                        transition-colors

                        ${
                          isActive
                            ? "bg-accent text-navy"
                            : "text-ivory/60 hover:bg-ivory/10 hover:text-ivory"
                        }
                      `
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              ADMIN ONLY
          ================================================== */}
          {isAdmin && (
            <NavLink
              to="/admin/dashboard/creators"
              onClick={closeMobileMenu}
              className={navLinkClass}
            >
              Manage Creators
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin/dashboard/settings"
              onClick={closeMobileMenu}
              className={navLinkClass}
            >
              Settings
            </NavLink>
          )}
        </nav>

        {/* =================================================
            USER SECTION
        ================================================== */}
        <div
          className="
            hidden
            md:block

            px-5
            py-4

            border-t
            border-ivory/10
          "
        >
          <p className="text-xs text-ivory/50">
            Signed in as
          </p>

          <p className="text-sm font-medium truncate mt-0.5">
            {user?.name}
          </p>

          <p className="text-xs text-accent capitalize mt-0.5">
            {user?.role}
          </p>

          <button
            type="button"
            onClick={logout}
            className="
              mt-3
              flex
              items-center
              gap-2

              text-xs
              font-semibold

              text-ivory/60
              hover:text-ivory

              transition-colors
            "
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="
            fixed
            inset-0
            z-30
            bg-black/40
            md:hidden
          "
        />
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main
        className="
          flex-1
          min-w-0
          w-full

          p-4
          sm:p-5
          md:p-6
          lg:p-8

          overflow-x-hidden
        "
      >
        <Outlet />
      </main>
    </div>
  );
}






