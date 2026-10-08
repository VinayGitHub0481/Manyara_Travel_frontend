
import { Fragment, useLayoutEffect } from "react";
import { Globe, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaTelegramPlane,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { useSettings } from "../hooks/useSettings";

/*
 * Brand name: write it in Title Case in text and data.
 * For the capital-letter wordmark look use CSS
 * (`uppercase tracking-[0.2em]`), never type it in ALL CAPS.
 */
const BRAND_NAME = "Manyara Prive Vacations";

/*
 * Bar height per breakpoint. The Header reads --top-info-height.
 * Slimmer than before: a thin dark strip reads as more premium.
 */
const BAR_HEIGHT = { mobile: 40, tablet: 44, desktop: 46 };

/*
 * Platforms the admin can type into top_bar_social_N_name.
 * Matched by NAME or by URL host. Anything else gets a generic icon.
 */
const SOCIAL_PLATFORMS = [
  { label: "Instagram", Icon: FaInstagram, names: ["instagram"], hosts: ["instagram.com"] },
  { label: "Facebook", Icon: FaFacebookF, names: ["facebook"], hosts: ["facebook.com", "fb.com", "fb.me"] },
  { label: "YouTube", Icon: FaYoutube, names: ["youtube"], hosts: ["youtube.com", "youtu.be"] },
  { label: "X", Icon: FaTwitter, names: ["twitter"], exact: ["x"], hosts: ["twitter.com", "x.com"] },
  { label: "LinkedIn", Icon: FaLinkedinIn, names: ["linkedin"], hosts: ["linkedin.com"] },
  { label: "WhatsApp", Icon: FaWhatsapp, names: ["whatsapp"], hosts: ["wa.me", "whatsapp.com"] },
  { label: "Pinterest", Icon: FaPinterestP, names: ["pinterest"], hosts: ["pinterest.com", "pin.it"] },
  { label: "TikTok", Icon: FaTiktok, names: ["tiktok"], hosts: ["tiktok.com"] },
  { label: "Telegram", Icon: FaTelegramPlane, names: ["telegram"], hosts: ["t.me", "telegram.me"] },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/* Only allow safe link types coming from the admin settings. */
function safeUrl(url) {
  const value = clean(url);
  return /^(https?:\/\/|mailto:|tel:)/i.test(value) ? value : "";
}

function getSocialMeta(name, url) {
  const lowerName = name.toLowerCase();

  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    /* mailto: and tel: have no host */
  }

  const platform = SOCIAL_PLATFORMS.find(
    (p) =>
      p.names.some((key) => lowerName.includes(key)) ||
      p.exact?.includes(lowerName) ||
      p.hosts.some((h) => host === h || host.endsWith(`.${h}`))
  );

  if (platform) return { Icon: platform.Icon, label: platform.label };
  if (/^mailto:/i.test(url)) return { Icon: Mail, label: "Email" };
  if (/^tel:/i.test(url)) return { Icon: Phone, label: "Call us" };
  return { Icon: Globe, label: host || "Website" };
}

function getContent(settings) {
  const locations = [
    clean(settings?.top_bar_location_1),
    clean(settings?.top_bar_location_2),
  ].filter(Boolean);

  const socials = [1, 2,3,4]
    .map((n) => {
      const url = safeUrl(settings?.[`top_bar_social_${n}_url`]);
      if (!url) return null;

      const name = clean(settings?.[`top_bar_social_${n}_name`]);
      const { Icon, label } = getSocialMeta(name, url);

      return { name: name || label, url, Icon };
    })
    .filter(Boolean);

  const traveller = clean(settings?.top_bar_traveller_text);

  return {
    locations,
    socials,
    traveller,
    hasAny: locations.length > 0 || socials.length > 0 || Boolean(traveller),
  };
}

/*
 * Keeps --top-info-height in sync with the screen size while the bar is
 * visible or loading, and resets it to 0px otherwise.
 * useLayoutEffect runs before paint, so the Header never jumps.
 */
function useReserveTopBarSpace(active) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!active) {
      root.style.setProperty("--top-info-height", "0px");
      return undefined;
    }

    const tablet = window.matchMedia("(min-width: 768px)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const apply = () => {
      let height = BAR_HEIGHT.mobile;
      if (desktop.matches) height = BAR_HEIGHT.desktop;
      else if (tablet.matches) height = BAR_HEIGHT.tablet;
      root.style.setProperty("--top-info-height", `${height}px`);
    };

    apply();
    tablet.addEventListener("change", apply);
    desktop.addEventListener("change", apply);

    return () => {
      tablet.removeEventListener("change", apply);
      desktop.removeEventListener("change", apply);
      root.style.setProperty("--top-info-height", "0px");
    };
  }, [active]);
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

/*
 * The fixed bar. Deep ink background with a thin rose-to-gold line along
 * the bottom edge: it gives the bar a finished edge and ties it to the
 * brand colours without adding any extra content.
 */
function BarShell({ centered = false, children, ...rest }) {
  return (
    <div
      {...rest}
      style={{ height: "var(--top-info-height, 40px)" }}
      className="fixed inset-x-0 top-0 z-[60] w-full overflow-hidden bg-ink-900 text-white"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div
          className={`flex w-full min-w-0 items-center gap-3 sm:gap-5 lg:gap-8 ${
            centered ? "justify-center" : "justify-between"
          }`}
        >
          {children}
        </div>
      </div>

      {/* Bottom accent line */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
      />
    </div>
  );
}

function Bone({ className = "" }) {
  return <span className={`block animate-pulse rounded bg-white/10 ${className}`} />;
}

/* Shown only on the very first visit, before anything is cached. */
function SkeletonBar() {
  return (
    <BarShell role="status" aria-label={`Loading ${BRAND_NAME} top information`}>
      <Bone className="h-3 w-28" />
      <Bone className="hidden h-3 w-56 sm:block" />
      <Bone className="h-6 w-16 rounded-full" />
    </BarShell>
  );
}

/* Round icon buttons. Label shows from lg up, tooltip always. */
function SocialLinks({ items }) {
  if (items.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {items.map(({ name, url, Icon }) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          title={name}
          className="group inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 text-xs font-medium text-white/80 transition-colors duration-300 hover:border-gold/70 hover:bg-white/10 hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:h-8 sm:min-w-8 lg:px-3"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
          <span className="hidden max-w-[120px] truncate lg:inline">{name}</span>
        </a>
      ))}
    </div>
  );
}

function Locations({ items }) {
  if (items.length === 0) return null;

  return (
    <div className="hidden min-w-0 shrink items-center gap-3 text-xs text-white/80 sm:flex md:text-[13px]">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
      {items.map((location, index) => (
        <Fragment key={location}>
          {index > 0 && (
            <span aria-hidden="true" className="h-3 w-px shrink-0 bg-white/20" />
          )}
          <span
            title={location}
            className="min-w-0 max-w-[110px] truncate md:max-w-[200px] lg:max-w-[260px]"
          >
            {location}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/* The highlight message. It is the only gold-tinted text, so it stands out. */
function Traveller({ text, hasSiblings }) {
  if (!text) return null;

  return (
    <p
      title={text}
      className={`flex min-w-0 items-center gap-2 text-xs font-medium tracking-wide text-gold-light md:text-[13px] ${
        hasSiblings ? "flex-1 justify-start sm:justify-center" : "justify-center"
      }`}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
      <span className="truncate">{text}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function TopInfoBar() {
  const { settings, loading } = useSettings();
  const { locations, socials, traveller, hasAny } = getContent(settings);

  const show = Boolean(settings?.top_bar_enabled) && hasAny;

  /* Reserve space while loading and while visible; release it for
     error, admin-disabled, and "nothing to show". */
  useReserveTopBarSpace(loading || show);

  if (loading) return <SkeletonBar />;
  if (!show) return null;

  const groups =
    Number(socials.length > 0) +
    Number(locations.length > 0) +
    Number(Boolean(traveller));

  return (
    <BarShell
      role="region"
      aria-label={`${BRAND_NAME} contact and social links`}
      centered={groups === 1}
    >
      <Locations items={locations} />
      <Traveller text={traveller} hasSiblings={groups > 1} />
      <SocialLinks items={socials} />
    </BarShell>
  );
}






















