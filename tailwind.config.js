const typography = require("@tailwindcss/typography");
import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        custom5BC0DE: "#5BC0DE",
        custom1DB24E: "#1DB24E",
        custom337AB7: "#337AB7",
        custom286090: "#286090",
        custom025D2F: "#025D2F",
        custom007339: "#007339",
        customD8FAD4: "#D8FAD4",
        customEBF5F3: "#EBF5F3",
        customE6E6E6: "#E6E6E6",
        customD7F9D3: "#D7F9D3",
        custom33A037: "#33A037",
        custom5CB85C: "#5CB85C",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui(),
    typography, // ✅ ADD THIS
  ],
};