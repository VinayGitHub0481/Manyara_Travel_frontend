

// src/components/Footer.jsx

import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { getSiteSettings } from "../api/content";

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD SITE SETTINGS
  // ============================================================
  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();

        if (mounted) {
          setSettings(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load site settings:", error);

        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // SETTINGS VALUES
  // ============================================================
  const phoneNumber = settings?.phone_number || "";
  const whatsappNumber = settings?.whatsapp_number || "";
  const companyAddress = settings?.company_address || "India";
  const addressUrl = settings?.address_url || "";

  // ============================================================
  // DYNAMIC SOCIAL LINKS
  // Managed from Admin → Website Settings
  // ============================================================
  const social1Name =
    settings?.top_bar_social_1_name?.trim() || "";

  const social1Url =
    settings?.top_bar_social_1_url?.trim() || "";

  const social2Name =
    settings?.top_bar_social_2_name?.trim() || "";

  const social2Url =
    settings?.top_bar_social_2_url?.trim() || "";

  // ============================================================
  // WHATSAPP NUMBER
  // Remove spaces, +, -, brackets, etc.
  // ============================================================
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // GOOGLE MAPS URL VALIDATION
  // ============================================================
  const isGoogleMapsUrl =
    addressUrl.startsWith("https://www.google.com/maps/") ||
    addressUrl.startsWith("https://maps.google.com/") ||
    addressUrl.startsWith("https://www.google.co.in/maps/");


  const FALLBACK_FACEBOOK_URL = "https://www.facebook.com/OnatripHolidays";

  // ============================================================
  // SOCIAL ICON
  // ============================================================
  const getSocialIcon = (name) => {
    const value = name?.toLowerCase();

    if (value?.includes("instagram")) {
      return FaInstagram;
    }

    if (value?.includes("youtube")) {
      return FaYoutube;
    }

    if (value?.includes("facebook")) {
      return FaFacebookF;
    }
     // Manual fallback
  if (fallback === "facebook") {
    return FaFacebookF;
  }

  if (fallback === "instagram") {
    return FaInstagram;
  }

  if (fallback === "youtube") {
    return FaYoutube;
  }

  return null;

  };

  // ============================================================
  // SOCIAL LINK

  // ============================================================
const SocialLink = ({ name, url, fallbackName, fallbackUrl }) => {
  const finalName = name?.trim() || fallbackName;
  const finalUrl = url?.trim() || fallbackUrl;

  if (!finalName || !finalUrl) {
    return null;
  }

  const Icon = getSocialIcon(finalName, finalUrl);

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={finalName}
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        border
        border-ivory/15
        transition-all
        hover:border-accent
        hover:bg-accent
        hover:text-white
      "
    >
      {Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <span className="text-xs font-semibold">
          {finalName.charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );
};

  // ============================================================
  // LOADING STATE
  // Keep footer structure stable while settings load.
  // ============================================================
  if (loading) {
    return (
      <footer className="bg-navy-dark text-ivory/70">
        <div
          className="
            mx-auto
            max-w-7xl
            px-4
            py-8
            sm:px-6
            sm:py-10
            lg:px-8
            lg:py-12
          "
        >
          <div
            className="
              grid
              grid-cols-1
              gap-8
              sm:grid-cols-2
              lg:grid-cols-4
              lg:gap-10
            "
          >
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  rounded-xl
                  bg-[#EEF1F5]
                  px-3
                  py-2
                  sm:px-4
                  sm:py-2.5
                "
              >
                <img
                  src="/images/logo.webp"
                  alt="On a Trip Holidays"
                  className="
                    h-auto
                    w-40
                    object-contain
                    sm:w-48
                    md:w-52
                  "
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
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>

            {/* Get in touch */}
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-40 max-w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            </div>
          </div>

          {/* Loading second row */}
          <div
            className="
              mt-8
              border-t
              border-ivory/10
              pt-7
            "
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-52 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-44 animate-pulse rounded bg-white/10" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-72 max-w-full animate-pulse rounded bg-white/10" />
                <div className="h-40 w-full animate-pulse rounded-xl bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading copyright */}
        <div className="border-t border-ivory/10">
          <div
            className="
              mx-auto
              max-w-7xl
              px-4
              py-4
              sm:px-6
              lg:px-8
            "
          >
            <div className="h-3 w-52 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </footer>
    );
  }

  // ============================================================
  // FOOTER
  // ============================================================
  return (
    <footer className="bg-navy-dark text-ivory/70">

      {/* ======================================================
          MAIN FOOTER
      ======================================================= */}
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-8
          sm:px-6
          sm:py-10
          lg:px-8
          lg:py-12
        "
      >

        {/* ====================================================
            FIRST ROW

            Mobile:
            1 column

            Tablet:
            2 columns

            Desktop:
            4 columns
        ==================================================== */}
        <div
          className="
            grid
            grid-cols-1
            gap-8
            sm:grid-cols-2
            lg:grid-cols-4
            lg:gap-10
          "
        >

          {/* ==================================================
              BRAND
          ================================================== */}
          <div className="sm:col-span-2 lg:col-span-1">

            {/* Logo */}
            <div
              className="
                mb-3
                inline-flex
                items-center
                rounded-xl
                border
                border-white/20
                bg-[#EEF1F5]
                px-3
                py-2
                shadow-[0_6px_20px_rgba(0,0,0,0.18)]
                sm:px-4
                sm:py-2.5
              "
            >
              <img
                src="/images/logo.webp"
                alt="On a Trip Holidays"
                className="
                  h-auto
                  w-40
                  object-contain
                  opacity-90
                  brightness-[0.92]
                  contrast-[1.04]
                  sm:w-48
                  md:w-52
                "
              />
            </div>

            {/* Description */}
            <p className="max-w-sm text-sm leading-6">
              Honest travel packages, planned by people
              who've actually been there.
            </p>

            {/* Social Media */}
            <div className="mt-4 flex items-center gap-2.5">
              <SocialLink
                name={social1Name}
                url={social1Url}
                fallback="instagram"
              />


              <SocialLink
                name={social2Name}
                url={social2Url}
                fallback="youtube"
              />

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
                  to="/packages"
                  className="transition-colors hover:text-accent"
                >
                  Packages
                </Link>
              </li>

              <li>
                <Link
                  to="/destinations"
                  className="transition-colors hover:text-accent"
                >
                  Most Visited
                </Link>
              </li>

              <li>
                <Link
                  to="/batches"
                  className="transition-colors hover:text-accent"
                >
                  Batches
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
                  Blog
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

              <li>
                <Link
                  to="/#faqs"
                  className="transition-colors hover:text-accent"
                >
                  FAQs
                </Link>
              </li>

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
              <li className="flex min-w-0 items-start gap-2">

                <Mail
                  className="
                    mt-0.5
                    h-5
                    w-5
                    shrink-0
                    text-accent
                  "
                  aria-hidden="true"
                />

                <a
                  href="mailto:Travel@onatripholiday.com"
                  className="
                    break-all
                    transition-colors
                    hover:text-accent
                  "
                >
                  Travel@onatripholiday.com
                </a>

              </li>


              {/* Phone */}
              {phoneNumber && (
                <li className="flex min-w-0 items-start gap-2">

                  <Phone
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                      text-accent
                    "
                    aria-hidden="true"
                  />

                  <a
                    href={`tel:${phoneNumber}`}
                    className="
                      break-all
                      transition-colors
                      hover:text-accent
                    "
                  >
                    {phoneNumber}
                  </a>

                </li>
              )}


              {/* WhatsApp */}
              {whatsappDigits && (
                <li className="flex items-center gap-2">

                  <FaWhatsapp
                    className="
                      h-5
                      w-5
                      shrink-0
                      text-accent
                    "
                    aria-hidden="true"
                  />

                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      transition-colors
                      hover:text-accent
                    "
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

            Desktop:

            Company Policies | Google Maps

            Mobile:

            Company Policies
            ↓
            Google Maps
        ======================================================= */}
        <div
          className="
            mt-8
            border-t
            border-ivory/10
            pt-7
            sm:mt-10
            sm:pt-8
          "
        >

          <div
            className="
              grid
              grid-cols-1
              gap-8
              lg:grid-cols-2
              lg:gap-10
            "
          >

            {/* ==================================================
                COMPANY POLICIES
            ================================================== */}
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


            {/* ==================================================
                GOOGLE MAPS
            ================================================== */}
            {isGoogleMapsUrl && (
              <div>

                {/* Map Header */}
                <div
                  className="
                    mb-3
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                  "
                >

                  <div className="min-w-0">

                    <p
                      className="
                        text-base
                        font-semibold
                        text-ivory
                        sm:text-lg
                      "
                    >
                      Find Us
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-xl
                        text-xs
                        leading-5
                        text-ivory/50
                        sm:text-sm
                      "
                    >
                      Visit our location or open it directly
                      in Google Maps.
                    </p>

                  </div>


                  <a
                    href={addressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex
                      w-fit
                      shrink-0
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      border
                      border-ivory/15
                      px-3
                      py-2
                      text-xs
                      text-ivory
                      transition-all
                      hover:border-accent
                      hover:bg-accent
                      sm:text-sm
                    "
                  >
                    <MapPin className="h-4 w-4" />

                    Open in Google Maps
                  </a>

                </div>


                {/* Responsive Map */}
                <div
                  className="
                    w-full
                    overflow-hidden
                    rounded-xl
                    border
                    border-ivory/10
                    bg-white/5
                    shadow-[0_8px_30px_rgba(0,0,0,0.20)]
                    sm:rounded-2xl
                  "
                >

                  <iframe
                    src={addressUrl}
                    title="On a Trip Holidays Location"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="
                      block
                      h-52
                      w-full
                      border-0
                      sm:h-60
                      md:h-64
                      lg:h-120
                      xl:h-70
                    "
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

        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-1.5
            px-4
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-2
            sm:px-6
            sm:py-5
            lg:px-8
          "
        >

          <p className="text-xs text-ivory/50">
            © {new Date().getFullYear()} On a Trip Holidays.
            All rights reserved.
          </p>

          <p className="text-xs text-ivory/40">
            Travel. Explore. Create memories.
          </p>

        </div>

      </div>

    </footer>
  );
}















