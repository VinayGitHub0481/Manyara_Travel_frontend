

import { useEffect, useState } from "react";
import { PhoneCall, Plane, ArrowRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getSiteSettings } from "../api/content";

export default function ContactSection() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD SITE SETTINGS
  // ============================================================
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load contact settings:", error);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ============================================================
  // SETTINGS
  // ============================================================
  const phoneNumber = settings?.phone_number?.trim() || "";
  const whatsappNumber = settings?.whatsapp_number?.trim() || "";

  // ============================================================
  // CLEAN NUMBERS
  // ============================================================
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // URLS
  // ============================================================
  const phoneUrl = phoneDigits ? `tel:+${phoneDigits}` : "#";

  const whatsappMessage =
    "Hello On a Trip Holidays, I would like to know more about your travel packages.";

  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "#";

  return (
    <section
      id="contact"
      className="
        scroll-mt-20
        w-full
        bg-ivory
        py-14
        sm:py-16
        lg:py-20
      "
    >
      <div
        className="
          max-w-5xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div className="text-center">
          {/* ==================================================
              SECTION LABEL
          ================================================== */}
          <div
            className="
              inline-flex
              items-center
              gap-2
              text-accent
              font-semibold
              text-xs
              sm:text-sm
              uppercase
              tracking-wider
              mb-3
            "
          >
            <Plane
              className="w-4 h-4 sm:w-5 sm:h-5"
              aria-hidden="true"
            />

            Contact Us
          </div>

          {/* ==================================================
              HEADING
          ================================================== */}
          <h2
            className="
              font-display
              text-2xl
              sm:text-3xl
              md:text-4xl
              lg:text-5xl
              font-semibold
              text-navy
              leading-tight
            "
          >
            Ready to Plan Your Next Journey?
          </h2>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}
          <p
            className="
              max-w-2xl
              mx-auto
              mt-4
              text-sm
              sm:text-base
              md:text-lg
              text-navy/65
              leading-relaxed
            "
          >
            Have questions about a destination, package,
            or custom trip? Our travel experts are here to
            help you plan a memorable journey that fits
            your interests and budget.
          </p>

          {/* ==================================================
              CONTACT BUTTONS
          ================================================== */}
          <div
            className="
              mt-7
              sm:mt-8
              flex
              flex-col
              sm:flex-row
              items-center
              justify-center
              gap-3
              sm:gap-4
            "
          >

       {/* ==================================================
                WHATSAPP
            ================================================== */}
            {whatsappDigits && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with On a Trip Holidays on WhatsApp"
                className="
                  inline-flex
                  w-full
                  sm:w-auto
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#25D366]
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:scale-[1.02]
                  hover:bg-[#20bd5a]
                  sm:gap-2.5
                  sm:px-5
                  sm:py-2.5
                  sm:text-sm
                "
              >
                {/* WhatsApp Icon */}
                <span
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-[#25D366]
                    sm:h-8
                    sm:w-8
                  "
                >
                  <FaWhatsapp
                    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                    aria-hidden="true"
                  />
                </span>

                <span>WhatsApp</span>
              </a>
            )}

            {/* ==================================================
                            PHONE
                        ================================================== */}
            {phoneDigits && (
              <a
                href={phoneUrl}
                aria-label="Call On a Trip Holidays"
                className="
                  inline-flex
                  w-full
                  sm:w-auto
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-navy
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-ivory
                  shadow-sm
                  transition-all
                  duration-200
                  hover:scale-[1.02]
                  hover:bg-navy-light
                  sm:gap-2.5
                  sm:px-5
                  sm:py-2.5
                  sm:text-sm
                "
              >
                {/* Phone Icon */}
                <span
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-white/10
                    sm:h-8
                    sm:w-8
                  "
                >
                  <PhoneCall
                    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                    aria-hidden="true"
                  />
                </span>

                <span>Call Us</span>
              </a>
            )}

            {/* ==================================================
                            FULL CONTACT PAGE
                        ================================================== */}
            <Link
              to="/contact"
              className="
                inline-flex
                w-full
                sm:w-auto
                items-center
                justify-center
                gap-1.5
                rounded-full
                border
                border-navy/15
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-navy
                transition-all
                duration-200
                hover:scale-[1.02]
                hover:border-navy/30
                hover:bg-navy/5
                sm:gap-2
                sm:px-5
                sm:py-2.5
                sm:text-sm
              "
            >
              <span>More Contact Details</span>

              <ArrowRight
                className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
                aria-hidden="true"
              />
            </Link>

          </div>

          {/* ==================================================
              SUPPORTING TEXT
          ================================================== */}
          <p
            className="
              mt-5
              sm:mt-6
              text-xs
              sm:text-sm
              text-navy/45
            "
          >
            Available for travel enquiries, package details
            & trip planning
          </p>

          {!loading && (phoneDigits || whatsappDigits) && (
            <p
              className="
                mt-2
                text-xs
                text-navy/40
              "
            >
              We're happy to help you plan your next trip.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


















