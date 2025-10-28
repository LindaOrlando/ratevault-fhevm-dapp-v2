import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.light.primary,
        secondary: designTokens.colors.light.secondary,
        accent: designTokens.colors.light.accent,
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        DEFAULT: `${designTokens.transitions.duration}ms`,
      },
    },
  },
  plugins: [],
};

export default config;

