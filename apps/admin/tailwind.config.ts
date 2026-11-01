import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FBF1ED",
          100: "#F5DDD3",
          200: "#EBC0AE",
          300: "#DE9A80",
          400: "#CC6F4D",
          500: "#B9552F",
          600: "#A3432A",
          700: "#843421",
          800: "#6A2B1D",
          900: "#4F2218",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
