import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const token = (n: string) => `hsl(var(--${n}))`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        border: token("border"),
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.25rem" },
    },
  },
  plugins: [animate],
};
export default config;
