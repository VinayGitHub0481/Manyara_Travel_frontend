
/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

// Neutral scale (was navy). 800 = heading colour, 700 = body colour.
const ink = {
  50: "#FAF8F9",
  100: "#F3F0F2",
  200: "#E4DEE2",
  300: "#CFC7CC",
  400: "#A39CA3",
  500: "#7C767E",
  600: "#6B666E",
  700: "#4A4A52",
  800: "#2F2A33",
  900: "#1F1B22",
  DEFAULT: "#2F2A33",
  light: "#4A4A52",
  dark: "#1F1B22",
};

// Accent / CTA scale (was orange). 600 = accessible CTA, 500 = logo bright pink.
// 50-200 are lighter than v1.
const rose = {
  50: "#FBF6F8",
  100: "#FEEAF2",
  200: "#FCD6E4",
  300: "#FAAAC6",
  400: "#F2588F",
  500: "#E8286F",
  600: "#D41F62",
  700: "#C01257",
  800: "#A10D48",
  900: "#7E0A38",
  DEFAULT: "#D41F62",
  light: "#F2588F",
  dark: "#C01257",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      // =====================================================
      // COLORS
      // =====================================================
      colors: {
        // ---------------------------------------------------
        // PRIMARY BRAND (logo "M" and wordmark raspberry)
        // Use for the main button, prices, links, key icons.
        // ---------------------------------------------------
        primary: {
          DEFAULT: "#C8135E",
          light: "#F2588F",
          lighter: "#FCEBF2",
          dark: "#A10D48",
        },

        champagne: {
          DEFAULT: "#E8D2B4",
          light: "#F7EBDB"
        },

        // ---------------------------------------------------
        // ACCENT / CTA
        // DEFAULT is #D41F62 so white button text passes AA (5.0:1).
        // The bright logo pink (#E8286F) is under "bright" and should
        // be used for icons, dividers, bullets and large text only.
        // ---------------------------------------------------
        accent: {
          DEFAULT: "#D41F62",
          bright: "#E8286F",
          light: "#FFD0DF",
          dark: "#C01257",
        },

        // ---------------------------------------------------
        // SECONDARY (mid petal rose)
        // Not AA on white for small text - use for icons, pills,
        // soft buttons. For small text links use `text-link`.
        // ---------------------------------------------------
        secondary: {
          DEFAULT: "#F2588F",
          light: "#FAD0E0",
          lighter: "#FFF2F6",
        },

        // ---------------------------------------------------
        // LEGACY SCALES (same class names, new palette)
        // ---------------------------------------------------
        navy: ink,
        ink,
        orange: rose,
        rose,

        // ---------------------------------------------------
        // BACKGROUNDS - three near-white fills + one blush
        // ---------------------------------------------------
        background: "#FFFFFF", // page
        surface: "#FBF6F8", // section bands, sidebars
        "surface-strong": "#F3F0F2", // chips, hover fills, skeletons
        card: "#FFFFFF", // cards, dropdowns, modals
        "surface-soft": "#FEF4F8", // blush: accent bands, hover, form band
        "surface-alt": "#FCF9FA", // alternate section
        "surface-blue": "#FCF9FA", // legacy name -> alternate section
        "surface-orange": "#FEF4F8", // legacy name -> blush
        input: "#FFFFFF",
        footer: "#F7F3F5",

        // Legacy name, now plain white.
        // Also used as light text on photo heroes.
        ivory: "#FFFFFF",

        // ---------------------------------------------------
        // TEXT
        // ---------------------------------------------------
        text: {
          DEFAULT: "#4A4A52", // body
          dark: "#2F2A33", // headings
          display: "#AB1050", // serif display headings
          secondary: "#6B6770",
        },
        muted: "#6E6973",
        placeholder: "#8F8A94",
        link: {
          DEFAULT: "#B3124E",
          hover: "#8E0B3B",
        },

        // ---------------------------------------------------
        // LINES
        // divider       -> card edges, section rules (very light)
        // border        -> form fields, outline buttons
        // border-strong -> hover / emphasised outlines
        // ---------------------------------------------------
        divider: "#EAE5E8",
        border: "#DCD5DA",
        "border-strong": "#C3BCC1",

        // ---------------------------------------------------
        // STATES
        // ---------------------------------------------------
        "accent-hover": "#C01257",
        "primary-hover": "#A80F4A",

        // ---------------------------------------------------
        // SEMANTIC (soft, rose-compatible)
        // DEFAULT = icons, borders, large UI
        // text    = small message text on the matching bg (>=5.8:1)
        // usage: bg-success-bg text-success-text border-success/30
        // ---------------------------------------------------
        success: { DEFAULT: "#2F8F6B", bg: "#EDF7F2", text: "#1F6B4F" },
        warning: { DEFAULT: "#A8690F", bg: "#FFF7E6", text: "#7A4A06" },
        error: { DEFAULT: "#C73A2E", bg: "#FEF1EF", text: "#A82A20" },
        info: { DEFAULT: "#3F78A8", bg: "#EFF5FB", text: "#2B5F8A" },

        // ---------------------------------------------------
        // LEGACY SUPPORT
        // ---------------------------------------------------
        red: {
          DEFAULT: "#D41F62",
          light: "#F2588F",
          dark: "#C01257",
        },
      },

      // =====================================================
      // TYPOGRAPHY
      // Display serif echoes the flared serif of the wordmark.
      // Load in index.html:
      //   Cormorant Garamond (500,600,700) + Inter (400,500,600)
      // =====================================================
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // =====================================================
      // BACKGROUND PATTERNS
      // Large-area gradients are LIGHT (white -> faint blush), so
      // sections never turn heavy. Gradient direction follows the
      // logo: white -> blush -> petal.
      // =====================================================
      backgroundImage: {
        "ticket-dashes":
          "repeating-linear-gradient(to bottom, transparent 0, transparent 6px, #C8135E33 6px, #C8135E33 14px)",
        "navy-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #FEF6F9 55%, #FCEBF2 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #FFF8FB 0%, #FEEAF2 55%, #FCDDE9 100%)",
        "petal-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #FEF4F8 55%, #FCE9F0 100%)",
        "soft-blue-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #FCF9FA 100%)",
        "soft-orange-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #FEF4F8 100%)",
        // Strong gradient: buttons, badges and small highlights ONLY (never full sections)
        "orange-gradient":
          "linear-gradient(135deg, #C01257 0%, #D41F62 50%, #E8286F 100%)",
      },

      // =====================================================
      // BOX SHADOWS - neutral, low opacity, one real "lift"
      // travel-card  : resting card (barely there)
      // travel-hover : hovered card, dropdowns, popups
      // brand/orange : glow under a primary button only
      // =====================================================
      boxShadow: {
        "travel-card":
          "0 1px 2px rgba(47, 42, 51, 0.04), 0 4px 14px rgba(47, 42, 51, 0.04)",
        "travel-hover": "0 8px 26px rgba(47, 42, 51, 0.10)",
        brand: "0 6px 18px rgba(200, 19, 94, 0.20)",
        orange: "0 6px 18px rgba(232, 40, 111, 0.20)",
        navbar: "0 1px 3px rgba(47, 42, 51, 0.06)",
      },

      // =====================================================
      // BORDER RADIUS
      // =====================================================
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // =====================================================
      // ANIMATIONS
      // (inside theme.extend - at the top level of the config
      //  Tailwind ignores keyframes/animation)
      // =====================================================
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(-12deg)" },
          "20%": { transform: "rotate(12deg)" },
          "30%": { transform: "rotate(-10deg)" },
          "40%": { transform: "rotate(10deg)" },
          "50%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 1.8s ease-in-out infinite",
      },

      transitionTimingFunction: {
        brand: "cubic-bezier(0.4, 0, 0.2, 1)",
        soft: "cubic-bezier(0.22, 1, 0.36, 1)", // add this
      },
    },
  },

  plugins: [],
};
