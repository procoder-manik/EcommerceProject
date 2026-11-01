import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#F4EFE8", deep: "#EBE4D9", edge: "#DDD4C6" },
        ink: { DEFAULT: "#16130F", soft: "#47423A", mute: "#7A7367" },
        clay: { DEFAULT: "#A3432A", deep: "#7F3320", wash: "#EBD3C9" },
        moss: { DEFAULT: "#3E4A38", wash: "#D6DCCB" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.045em" },
      transitionTimingFunction: { out: "cubic-bezier(0.16, 1, 0.3, 1)" },
    },
  },
  plugins: [],
};

export default config;
