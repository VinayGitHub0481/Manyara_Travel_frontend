



import { useEffect, useState } from "react";
import {
  Mail,
  PhoneCall,
  MapPin,
  MessageCircle,
  Plane,
  ExternalLink,
  ArrowRight,
  Send,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";

import { getSiteSettings } from "../api/content";
import Footer from "../components/Footer";
import FAQSection from "../components/FAQSection";
import EnquiryForm from "./EnquiryForm";

const COMPANY_NAME = "On a Trip Holidays";
const COMPANY_EMAIL = "Travel@onatripholiday.com";

const WHATSAPP_MESSAGE =
  "Hello On a Trip Holidays, I would like to know more about your travel packages.";

const DEFAULT_ADDRESS = "India";

const EMPTY_SETTINGS = {
  phone_number: "",
  whatsapp_number: "",
  company_address: DEFAULT_ADDRESS,
  address_url: "",
};

const Contact = () => {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(false);

  // ============================================================
  // LOAD SITE SETTINGS
  // ============================================================
  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();

        if (!mounted) return;

        setSettings({
          phone_number: data?.phone_number || "",
          whatsapp_number: data?.whatsapp_number || "",
          company_address:
            data?.company_address || DEFAULT_ADDRESS,
          address_url: data?.address_url || "",
        });
      } catch (error) {
        console.error("Failed to load contact settings:", error);

        if (mounted) {
          setSettings(EMPTY_SETTINGS);
        }
      } finally {
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
  // SETTINGS
  // ============================================================
  const phoneNumber = settings?.phone_number?.trim() || "";
  const whatsappNumber =
    settings?.whatsapp_number?.trim() || "";

  const companyAddress =
    settings?.company_address?.trim() || DEFAULT_ADDRESS;

  const addressUrl = settings?.address_url?.trim() || "";

  // ============================================================
  // CLEAN PHONE / WHATSAPP NUMBERS
  // ============================================================
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  // ============================================================
  // CONTACT URLS
  // ============================================================
  const phoneHref = phoneDigits
    ? `tel:+${phoneDigits}`
    : "#";

  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        WHATSAPP_MESSAGE
      )}`
    : "#";

  const emailHref = `mailto:${COMPANY_EMAIL}`;

  // ============================================================
  // GOOGLE MAPS URL CHECK
  // ============================================================
  const isGoogleMapsUrl =
    addressUrl.startsWith(
      "https://www.google.com/maps/"
    ) ||
    addressUrl.startsWith(
      "https://maps.google.com/"
    ) ||
    addressUrl.startsWith(
      "https://www.google.co.in/maps/"
    );

  return (
    <div className="min-h-screen bg-white text-[#061B45]">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#061B45]">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

          <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-[#FF3B0B]/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-8
              sm:gap-10
              lg:gap-14
              items-center
              py-8
              sm:py-10
              lg:py-12
            "
          >
            {/* ==================================================
                LEFT — HERO CONTENT
            ================================================== */}
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                  px-3
                  py-1.5
                  sm:px-4
                  sm:py-2
                  mb-4
                  sm:mb-5
                "
              >
                <MessageCircle
                  className="w-4 h-4 text-white"
                  aria-hidden="true"
                />

                <span className="text-xs sm:text-sm font-medium text-white/90">
                  We&apos;re here to help
                </span>
              </div>

              <h1
                className="
                  font-display
                  text-4xl
                  sm:text-5xl
                  lg:text-6xl
                  font-semibold
                  tracking-tight
                  text-white
                  leading-tight
                "
              >
                Let&apos;s plan your

                <span className="block text-[#FF3B0B]">
                  next journey.
                </span>
              </h1>

              <p
                className="
                  mt-4
                  sm:mt-5
                  max-w-xl
                  text-base
                  sm:text-lg
                  leading-7
                  sm:leading-8
                  text-white/75
                "
              >
                Have a question about a package, destination,
                booking, or custom trip? Get in touch with{" "}
                {COMPANY_NAME} and our team will be happy to
                help you.
              </p>
            </div>

            {/* ==================================================
                RIGHT — CONTACT DETAILS
            ================================================== */}
            <div className="lg:pl-6">
              <div
                className="
                  rounded-2xl
                  bg-white
                  p-5
                  sm:p-6
                  lg:p-7
                  shadow-2xl
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-[#FF3B0B]
                    mb-5
                  "
                >
                  Contact us
                </p>

                {loading ? (
                  /* ==================================================
                      LOADING SKELETON
                  ================================================== */
                  <div className="space-y-5">
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* ==================================================
                        PHONE
                    ================================================== */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="
                          flex-shrink-0
                          flex
                          items-center
                          justify-center
                          w-10
                          h-10
                          sm:w-11
                          sm:h-11
                          rounded-full
                          bg-[#061B45]/5
                        "
                      >
                        <PhoneCall
                          className="w-5 h-5 text-[#061B45]"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wide
                            text-[#061B45]/45
                          "
                        >
                          Phone
                        </p>

                        {phoneNumber ? (
                          <a
                            href={phoneHref}
                            className="
                              mt-1
                              inline-flex
                              items-center
                              gap-2
                              text-base
                              sm:text-lg
                              font-medium
                              text-[#061B45]
                              hover:text-[#FF3B0B]
                              transition-colors
                              break-words
                            "
                          >
                            {phoneNumber}
                          </a>
                        ) : (
                          <p className="mt-1 text-[#061B45]/45">
                            Contact number unavailable
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ==================================================
                        WHATSAPP
                    ================================================== */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="
                          flex-shrink-0
                          flex
                          items-center
                          justify-center
                          w-10
                          h-10
                          sm:w-11
                          sm:h-11
                          rounded-full
                          bg-[#25D366]/10
                        "
                      >
                        <FaWhatsapp
                          className="
                            w-5
                            h-5
                            sm:w-6
                            sm:h-6
                            text-[#25D366]
                          "
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wide
                            text-[#061B45]/45
                          "
                        >
                          WhatsApp
                        </p>

                        {whatsappDigits ? (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              mt-1
                              inline-flex
                              items-center
                              gap-2
                              text-base
                              sm:text-lg
                              font-medium
                              text-[#25D366]
                              hover:text-[#1da851]
                              transition-colors
                              break-words
                            "
                          >
                            {whatsappNumber}
                          </a>
                        ) : (
                          <p className="mt-1 text-[#061B45]/45">
                            WhatsApp unavailable
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ==================================================
                        EMAIL
                    ================================================== */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="
                          flex-shrink-0
                          flex
                          items-center
                          justify-center
                          w-10
                          h-10
                          sm:w-11
                          sm:h-11
                          rounded-full
                          bg-[#061B45]/5
                        "
                      >
                        <Mail
                          className="w-5 h-5 text-[#061B45]"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wide
                            text-[#061B45]/45
                          "
                        >
                          Email
                        </p>

                        <a
                          href={emailHref}
                          className="
                            mt-1
                            inline-block
                            text-base
                            sm:text-lg
                            font-medium
                            text-[#061B45]
                            hover:text-[#FF3B0B]
                            transition-colors
                            break-words
                          "
                        >
                          {COMPANY_EMAIL}
                        </a>
                      </div>
                    </div>

                    {/* ==================================================
                        ADDRESS
                    ================================================== */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="
                          flex-shrink-0
                          flex
                          items-center
                          justify-center
                          w-10
                          h-10
                          sm:w-11
                          sm:h-11
                          rounded-full
                          bg-[#061B45]/5
                        "
                      >
                        <MapPin
                          className="w-5 h-5 text-[#061B45]"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 pt-0.5">
                        <p
                          className="
                            text-xs
                            font-medium
                            uppercase
                            tracking-wide
                            text-[#061B45]/45
                          "
                        >
                          Address
                        </p>

                        <p
                          className="
                            mt-1
                            text-base
                            sm:text-lg
                            font-medium
                            text-[#061B45]
                            leading-6
                            sm:leading-7
                            break-words
                          "
                        >
                          {companyAddress}
                        </p>

                        {isGoogleMapsUrl && (
                          <a
                            href={addressUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              mt-2
                              text-sm
                              font-semibold
                              text-[#FF3B0B]
                              hover:text-[#061B45]
                              transition-colors
                            "
                          >
                            View on Google Maps

                            <ExternalLink
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SIMPLE CTA
      ========================================================== */}
      <section className="py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              sm:rounded-3xl
              bg-[#F8F9FB]
              border
              border-black/5
              px-5
              py-8
              sm:px-8
              sm:py-10
              lg:px-10
            "
          >
            <div
              className="
                relative
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-6
              "
            >
              <div className="max-w-2xl">
                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-11
                    h-11
                    rounded-xl
                    bg-[#061B45]/5
                    mb-4
                  "
                >
                  <Plane
                    className="w-5 h-5 text-[#061B45]"
                    aria-hidden="true"
                  />
                </div>

                <h2
                  className="
                    font-display
                    text-3xl
                    sm:text-4xl
                    font-semibold
                    text-[#061B45]
                  "
                >
                  Ready to plan your next trip?
                </h2>

                <p
                  className="
                    mt-3
                    text-base
                    sm:text-lg
                    leading-7
                    sm:leading-8
                    text-[#061B45]/65
                  "
                >
                  Explore our travel packages and find the journey
                  that feels right for you.
                </p>
              </div>

              <div
                className="
                  w-full
                  lg:w-auto
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                  sm:gap-4
                "
              >
                {/* ==================================================
                    ENQUIRE NOW
                ================================================== */}
                <button
                  type="button"
                  onClick={() => setEnquiry(true)}
                  className="
                    w-full
                    sm:w-auto
                    min-h-[50px]
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#061B45]
                    hover:bg-[#0B2559]
                    active:bg-[#03112D]
                    text-white
                    px-5
                    sm:px-6
                    py-3.5
                    text-sm
                    sm:text-base
                    font-bold
                    transition-all
                    duration-200
                    shadow-md
                    hover:shadow-lg
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#061B45]/30
                    focus:ring-offset-2
                  "
                >
                  <Send
                    size={18}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />

                  Enquire Now
                </button>

                {/* ==================================================
                    VIEW PACKAGES
                ================================================== */}
                <Link
                  to="/packages"
                  className="
                    w-full
                    sm:w-auto
                    min-h-[50px]
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#FF3B0B]
                    hover:bg-[#E92F00]
                    active:bg-[#D92800]
                    text-white
                    px-5
                    sm:px-6
                    py-3.5
                    text-sm
                    sm:text-base
                    font-semibold
                    transition-all
                    duration-200
                    shadow-md
                    hover:shadow-lg
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#FF3B0B]/30
                    focus:ring-offset-2
                  "
                >
                  View Packages

                  <ArrowRight
                    className="w-5 h-5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ENQUIRY MODAL
      ========================================================== */}
      {enquiry && (
        <EnquiryForm
          onClose={() => setEnquiry(false)}
        />
      )}

      {/* =========================================================
          FAQ
      ========================================================== */}
      <FAQSection />

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <Footer />
    </div>
  );
};

export default Contact;

