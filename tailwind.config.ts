import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7f5",
          100: "#dcece5",
          200: "#b9d9cb",
          300: "#8ec0ab",
          400: "#5f9f87",
          500: "#3f7f6a",
          600: "#2f6554",
          700: "#275144",
          800: "#214238",
          900: "#1c372f",
        },
        ink: "#1a2420",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.03), 0 4px 10px -2px rgb(26 36 32 / 0.06)",
        "card-hover": "0 2px 4px 0 rgb(0 0 0 / 0.04), 0 10px 20px -4px rgb(26 36 32 / 0.10)",
      },
      keyframes: {
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "modal-in": "modal-in 0.15s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
