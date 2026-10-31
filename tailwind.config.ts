import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#11183D", soft: "#52608A", mute: "#7D89AD" },
        brand: {
          50: "#F0EEFF", 100: "#DDD9FF", 200: "#BDB5FF", 300: "#9487FF", 400: "#7161F2",
          500: "#5543DC", 600: "#4433C4", 700: "#34259D", 800: "#25206C", 900: "#171A48",
        },
        saffron: { 50: "#FFF7E5", 100: "#FFE9AE", 500: "#F5AB27", 700: "#A8650A" },
        paper: "#F6F7FF",
        line: "#E4E7F5",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: { card: "0 8px 28px -16px rgba(30,35,90,.28)" },
    },
  },
  plugins: [],
};
export default config;
