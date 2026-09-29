/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  keyframes: {
  wiggle: {
    "0%, 100%": {
      transform: "rotate(0deg)",
    },
    "10%": {
      transform: "rotate(-12deg)",
    },
    "20%": {
      transform: "rotate(12deg)",
    },
    "30%": {
      transform: "rotate(-10deg)",
    },
    "40%": {
      transform: "rotate(10deg)",
    },
    "50%": {
      transform: "rotate(0deg)",
    },
  },
},

animation: {
  wiggle: "wiggle 1.8s ease-in-out infinite",
},

  theme: {
    extend: {
      // =====================================================
      // COLORS
      // =====================================================
      colors: {
        // ---------------------------------------------------
        // ONATRIP PRIMARY BRAND
        // ---------------------------------------------------
        primary: {
          DEFAULT: "#061B45",
          light: "#0B2559",
          dark: "#03112D",
        },

        // ---------------------------------------------------
        // ONATRIP ORANGE / CTA
        // ---------------------------------------------------
        accent: {
          DEFAULT: "#FF3B0B",
          light: "#FF5A2A",
          dark: "#E92F00",
        },

        // Restored - not in the new palette, but referenced 30x across
        // already-built components (Hero's icon accent, admin "Edit"
        // links, etc.). Same blue as navy.light/primary.light, just kept
        // under its own name so nothing calling text-secondary breaks.
        secondary: "#0B2559",

        // ---------------------------------------------------
        // NAVY PALETTE
        // ---------------------------------------------------
        navy: {
          50: "#F3F6FA",
          100: "#E5EBF4",
          200: "#CBD7E8",
          300: "#A6B8D1",
          400: "#7892B5",
          500: "#4D6B98",
          600: "#2E4D7D",
          700: "#0B2559",
          800: "#061B45",
          900: "#03112D",
          DEFAULT: "#061B45",
          light: "#0B2559",
          dark: "#03112D",
        },

        // ---------------------------------------------------
        // ORANGE PALETTE
        // ---------------------------------------------------
        orange: {
          50: "#FFF5F1",
          100: "#FFE6DE",
          200: "#FFC7B8",
          300: "#FFA28B",
          400: "#FF7957",
          500: "#FF5A2A",
          600: "#FF3B0B",
          700: "#E92F00",
          800: "#C92700",
          900: "#A82100",
          DEFAULT: "#FF3B0B",
          light: "#FF5A2A",
          dark: "#E92F00",
        },

        // ---------------------------------------------------
        // UI COLORS
        // ---------------------------------------------------
        background: "#FFFFFF",
        surface: "#F8FAFC",
        "surface-blue": "#F1F5FA",
        "surface-orange": "#FFF5F1",

        // Restored - a warm off-white used in 69 places (Header, Footer,
        // Hero text, index.css body background). Not in the new palette,
        // but not something the new palette replaces either - it's a
        // distinct off-white, not one of the navy/orange shades.
        ivory: "#FBF8F2",

        text: {
          DEFAULT: "#0F172A",
          dark: "#061B45",
        },

        muted: "#64748B",
        border: "#E2E8F0",

        // ---------------------------------------------------
        // STATES
        // ---------------------------------------------------
        "accent-hover": "#E92F00",
        "primary-hover": "#0B2559",

        // ---------------------------------------------------
        // LEGACY SUPPORT
        // ---------------------------------------------------
        red: {
          DEFAULT: "#FF3B0B",
          light: "#FF5A2A",
          dark: "#E92F00",
        },
      },

      // =====================================================
      // TYPOGRAPHY
      // =====================================================
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // =====================================================
      // BACKGROUND PATTERNS
      // =====================================================
      backgroundImage: {
        "ticket-dashes":
          "repeating-linear-gradient(to bottom, transparent 0, transparent 6px, #061B4533 6px, #061B4533 14px)",
        "navy-gradient":
          "linear-gradient(135deg, #03112D 0%, #061B45 50%, #0B2559 100%)",
        "orange-gradient":
          "linear-gradient(135deg, #E92F00 0%, #FF3B0B 50%, #FF5A2A 100%)",
        "brand-gradient":
          "linear-gradient(135deg, #061B45 0%, #0B2559 55%, #FF3B0B 100%)",
        "soft-blue-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #F1F5FA 100%)",
        "soft-orange-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #FFF5F1 100%)",
      },

      // =====================================================
      // BOX SHADOWS
      // =====================================================
      boxShadow: {
        "travel-card": "0 10px 30px rgba(6, 27, 69, 0.08)",
        "travel-hover": "0 18px 45px rgba(6, 27, 69, 0.14)",
        "brand": "0 10px 30px rgba(6, 27, 69, 0.16)",
        "orange": "0 10px 30px rgba(255, 59, 11, 0.20)",
        "navbar": "0 4px 20px rgba(6, 27, 69, 0.08)",
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
      // =====================================================
      transitionTimingFunction: {
        brand: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },

  plugins: [],
};







