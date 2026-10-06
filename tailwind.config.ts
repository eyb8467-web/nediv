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
    },
  },
  plugins: [],
};
export default config;
