import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A2540",
          800: "#123A5C",
          700: "#1A4A73",
          100: "#E8EEF4",
        },
        brand: {
          red: "#C12216",
          crimson: "#E60F3E",
          yellow: "#F8DC2F",
          gold: "#FFDB34",
        },
        profit: "#147A3F",
        loss: "#C12216",
        warn: "#C9A227",
        paper: "#F3F5F7",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,37,64,0.06), 0 8px 24px rgba(10,37,64,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
