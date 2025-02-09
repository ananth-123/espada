import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Roboto", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // AtkinsRéalis brand colors
        brand: {
          primary: "#0063A3",
          "primary-dark": "#004B7A",
          "primary-light": "#3D8DBC",
          secondary: "#00B2A9",
          "secondary-dark": "#008680",
          "secondary-light": "#33C5BE",
          accent: "#FFB81C",
          "accent-dark": "#CC9316",
          "accent-light": "#FFCA4F",
        },
        // Text colors
        text: {
          primary: "#1A1A1A",
          secondary: "#4D4D4D",
          tertiary: "#666666",
        },
        tremor: {
          brand: {
            faint: "#eff6ff",
            muted: "#bfdbfe",
            subtle: "#60a5fa",
            DEFAULT: "#0063A3",
            emphasis: "#004B7A",
            inverted: "#ffffff",
          },
          background: {
            muted: "#f9fafb",
            subtle: "#f3f4f6",
            DEFAULT: "#ffffff",
            emphasis: "#374151",
          },
          border: {
            DEFAULT: "#e5e7eb",
          },
          ring: {
            DEFAULT: "#e5e7eb",
          },
          content: {
            subtle: "#9ca3af",
            DEFAULT: "#4D4D4D",
            emphasis: "#1A1A1A",
            strong: "#111827",
            inverted: "#ffffff",
          },
        },
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-|text-|border-|ring-|from-|to-|fill-)(brand|text)-(primary|secondary|tertiary|accent)(-(dark|light))?/,
    },
    {
      pattern:
        /^(bg-|text-|border-|ring-|from-|to-|fill-)(success|warning|error|info)/,
    },
  ],
  plugins: [require("@headlessui/tailwindcss")],
};

export default config;
