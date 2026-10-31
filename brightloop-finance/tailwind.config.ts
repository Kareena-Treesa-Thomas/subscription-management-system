import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14213D", soft: "#4A5878", faint: "#7B88A3" },
        canvas: "#F2F4F8",
        line: "#DFE4EC",
        brand: { DEFAULT: "#0E8F7E", dark: "#0A6B5E", tint: "#E3F4F1" },
        danger: { DEFAULT: "#B73232", tint: "#FBEAEA" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
