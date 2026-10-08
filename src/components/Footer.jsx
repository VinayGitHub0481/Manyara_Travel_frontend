

import { Link } from "react-router-dom";

import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaWhatsapp,
  FaTwitter
} from "react-icons/fa";

import { useSettings } from "../hooks/useSettings";


const SOCIAL_SLOTS = [1, 2, 3, 4];

const DEFAULT_SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/manyaraprivevacations" },
  { name: "Facebook", url: "https://www.facebook.com/manyaraprivevacations" },
  { name: "YouTube", url: "https://www.youtube.com/@manyaraprivevacations" },
];

const getSocialIcon = (name = "", url = "") => {
  const value = `${name} ${url}`.toLowerCase();

  if (value.includes("instagram")) return FaInstagram;
  if (value.includes("facebook")) return FaFacebookF;
  if (value.includes("youtube") || value.includes("youtu.be")) return FaYoutube;
  if (
    value.includes("twitter") ||
    value.includes("x.com") ||
    name.toLowerCase().trim() === "x"
  ) {
    return FaTwitter;
  }
  return null;
};

function SocialLink({ name, url }) {
  const Icon = getSocialIcon(name, url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/15 transition-all hover:border-accent hover:bg-accent hover:text-white"
    >
      {Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <span className="text-xs font-semibold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );
}


// ============================================================
// FOOTER
// ============================================================

export default function Footer() {
  // Settings from the shared cache
  const { settings, loading } = useSettings();

  // ============================================================
  // SETTINGS VALUES
  // ============================================================

  const phoneNumber = settings?.phone_number || "";
  const whatsappNumber = settings?.whatsapp_number || "";
  const addressUrl = settings?.address_url || "";

  // ============================================================
  // SOCIAL LINKS (up to 4, from settings)
  // ============================================================

  const adminSocials = SOCIAL_SLOTS.map((n) => ({
    name: settings?.[`top_bar_social_${n}_name`]?.trim() || "",
    url: settings?.[`top_bar_social_${n}_url`]?.trim() || "",
  }))
    .filter((item) => /^https?:\/\//i.test(item.url))
    .map((item, index) => ({
      ...item,
      name: item.name || `Social ${index + 1}`,
    }));

  // Defaults only when the admin has not added any link
  const socials = adminSocials.length > 0 ? adminSocials : DEFAULT_SOCIALS;

  // ============================================================
  // WHATSAPP FORMAT
  // ============================================================

  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // GOOGLE MAP VALIDATION
  // ============================================================

  const isGoogleMapsUrl =
    addressUrl.startsWith("https://www.google.com/maps/") ||
    addressUrl.startsWith("https://maps.google.com/") ||
    addressUrl.startsWith("https://www.google.co.in/maps/");

  // ============================================================
  // LOADING SKELETON
  // ============================================================

  if (loading) {
    return (
      <footer className="bg-navy-dark text-ivory/70">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3 inline-flex items-center rounded-xl bg-[#EEF1F5] px-3 py-2 sm:px-4 sm:py-2.5">
                <img
                  src="/images/Manyara_2.webp"
                  alt="Manyara Prive Vacations"
                  className="h-auto w-40 object-contain sm:w-48 md:w-52"
                />
              </div>

              <div className="h-4 w-64 max-w-full animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-48 max-w-full animate-pulse rounded bg-white/10" />
            </div>

            {/* Explore */}
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>

            {/* Company */}
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-40 max-w-full animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // ============================================================
  // FOOTER
  // ============================================================

  return (
    <footer className="relative bg-navy-dark text-ivory/70">
      {/* ======================================================
          MAIN FOOTER
      ======================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* ==================================================
              BRAND
          ================================================== */}

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3 inline-flex items-center rounded-xl border border-white/20 bg-[#EEF1F5] px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.18)] sm:px-4 sm:py-2.5">
              <img
                src="/images/Manyara_2.webp"
                alt="Manyara Prive Vacations"
                className="h-auto w-40 object-contain opacity-90 brightness-[0.92] contrast-[1.04] sm:w-48 md:w-52"
              />
            </div>

            <p className="max-w-sm text-sm leading-6">
              Luxury journeys and curated vacations, crafted with
              comfort, elegance, and unforgettable experiences.
            </p>

            {/* Social links: whatever the admin set (1 to 4) */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {socials.map((item) => (
                <SocialLink
                  key={item.url}
                  name={item.name}
                  url={item.url}
                />
              ))}
            </div>
          </div>

          {/* ==================================================
              EXPLORE
          ================================================== */}

          <div>
            <p className="mb-3 text-sm font-semibold text-ivory">
              Explore
            </p>

            <ul className="space-y-2 text-sm">

              <li>
                <Link
                  to="/destinations"
                  className="transition-colors hover:text-accent"
                >
                  Destinations
                </Link>
              </li>

                 <li>
                <Link
                  to="/seasoned-destinations"
                  className="transition-colors hover:text-accent"
                >
                  Seasonal Views
                </Link>
              </li>

              <li>
                <Link
                  to="/packages"
                  className="transition-colors hover:text-accent"
                >
                  Packages
                </Link>
              </li>

              

           

              <li>
                <Link
                  to="/happy-moments"
                  className="transition-colors hover:text-accent"
                >
                  Happy Moments
                </Link>
              </li>

              <li>
                <Link
                  to="/blog"
                  className="transition-colors hover:text-accent"
                >
                  Travel Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* ==================================================
              COMPANY
          ================================================== */}

          <div>
            <p className="mb-3 text-sm font-semibold text-ivory">
              Company
            </p>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="transition-colors hover:text-accent"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="transition-colors hover:text-accent"
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  to="/reviews"
                  className="transition-colors hover:text-accent"
                >
                  Reviews
                </Link>
              </li>

              {/* <li>
                <Link
                  to="/#faqs"
                  className="transition-colors hover:text-accent"
                >
                  FAQs
                </Link>
              </li> */}
            </ul>
          </div>

          {/* ==================================================
              GET IN TOUCH
          ================================================== */}

          <div>
            <p className="mb-3 text-sm font-semibold text-ivory">
              Get in touch
            </p>

            <ul className="space-y-2.5 text-sm">
              {/* Email */}
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-accent" />

                <a
                  href="mailto:hello@manyaraprivevacations.com"
                  className="break-all transition-colors hover:text-accent"
                >
                  hello@manyaraprivevacations.com
                </a>
              </li>

              {/* Phone */}
              {phoneNumber && (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />

                  <a
                    href={`tel:${phoneNumber}`}
                    className="break-all transition-colors hover:text-accent"
                  >
                    {phoneNumber}
                  </a>
                </li>
              )}

              {/* WhatsApp */}
              {whatsappDigits && (
                <li className="flex items-center gap-2">
                  <FaWhatsapp className="h-5 w-5 shrink-0 text-accent" />

                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ======================================================
            SECOND ROW
        ======================================================= */}

        <div className="mt-8 border-t border-ivory/10 pt-7 sm:mt-10 sm:pt-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Policies */}
            <div>
              <p className="mb-3 text-sm font-semibold text-ivory">
                Company Policies
              </p>

              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/terms-and-conditions"
                    className="transition-colors hover:text-accent"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>

                <li>
                  <Link
                    to="/bookings"
                    className="transition-colors hover:text-accent"
                  >
                    Booking Policy
                  </Link>
                </li>

                <li>
                  <Link
                    to="/cancellation"
                    className="transition-colors hover:text-accent"
                  >
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Google Maps */}
            {isGoogleMapsUrl && (
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-ivory sm:text-lg">
                      Find Us
                    </p>

                    <p className="mt-1 text-xs leading-5 text-ivory/50 sm:text-sm">
                      Visit our location or open it directly in
                      Google Maps.
                    </p>
                  </div>

                  <a
                    href={addressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-ivory/15 px-3 py-2 text-xs text-ivory transition-all hover:border-accent hover:bg-accent sm:text-sm"
                  >
                    <MapPin className="h-4 w-4" />
                    Open Maps
                  </a>
                </div>

                <div className="overflow-hidden rounded-xl border border-ivory/10">
                  <iframe
                    src={addressUrl}
                    title="Manyara Prive Vacations Location"
                    loading="lazy"
                    className="block h-52 w-full border-0 sm:h-60 md:h-64 lg:h-72"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          COPYRIGHT
      ======================================================== */}

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-ivory/50">
            © {new Date().getFullYear()} Manyara Prive Vacations. All
            rights reserved.
          </p>

          <p className="text-xs text-ivory/40">
            Travel. Explore. Create memories.
          </p>
        </div>
      </div>
    </footer>
  );
}