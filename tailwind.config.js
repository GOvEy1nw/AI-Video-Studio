/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./frontend/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // ── Semantic tokens via CSS variables ──
        // Change the variables in index.css :root to retheme
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)",
        },
        "app-bg": "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
        },
        // ── Override blue palette → #2B61FF brand scale ──
        // All blue-* classes use this scale; update these values to retheme
        blue: {
          50: "#eef3ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bafd",
          400: "#7394fb",
          500: "#2B61FF",
          600: "#1a50e0",
          700: "#1540b8",
          800: "#163090",
          900: "#162970",
          950: "#0f1a45",
        },
        // ── Legacy tokens (kept for compatibility) ──
        background: "#1a1a1a",
        foreground: "#ffffff",
        card: "#242424",
        "card-foreground": "#ffffff",
        border: "#333333",
        input: "#2a2a2a",
        primary: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#3f3f46",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};
