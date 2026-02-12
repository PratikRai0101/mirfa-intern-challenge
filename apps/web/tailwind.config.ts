import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#111111",
        "background-light": "#ffffff",
        "background-dark": "#121212",
        "surface-light": "#fafafa",
        "surface-dark": "#1e1e1e",
        "code-bg-light": "#f5f5f5",
        "code-bg-dark": "#1a1a1a",
        "border-light": "#e5e7eb",
        "border-dark": "#333333",
        "text-main-light": "#111827",
        "text-main-dark": "#f3f4f6",
        "text-muted-light": "#6b7280",
        "text-muted-dark": "#9ca3af"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        DEFAULT: "0.25rem"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")]
}

export default config
