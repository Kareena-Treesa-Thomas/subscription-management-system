import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0F2A2E", soft: "#3E5559", mute: "#6B8083" },
        brand: {
          50: "#EAF6F2", 100: "#CFEBE3", 200: "#9FD6C8", 300: "#68BBA8",
          400: "#33A18B", 500: "#0E7C66", 600: "#0B6553", 700: "#094F42", 800: "#073D33", 900: "#052B24",
        },
        saffron: { 50: "#FEF6E7", 100: "#FCE7C0", 500: "#F2A33A", 700: "#A8650A" },
        paper: "#F6F8F7",
        line: "#DDE5E2",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(15,42,46,.06), 0 8px 24px -12px rgba(15,42,46,.18)" },
    },
  },
  plugins: [],
};
export default config;
