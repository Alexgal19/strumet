import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ===== DESIGN SYSTEM 2.0 - SHADOWS =====
      boxShadow: {
        // Legacy shadows (zachowane dla kompatybilności)
        "clay-md":
          "4px 4px 8px hsl(var(--primary) / 0.1), -4px -4px 8px hsl(0 0% 100% / 0.8)",
        "clay-md-inset":
          "inset 4px 4px 8px hsl(var(--primary) / 0.1), inset -4px -4px 8px hsl(0 0% 100% / 0.8)",
        grapefruit: "0 4px 14px 0 hsl(var(--grapefruit) / 0.2)",
        "soft-xl":
          "0 10px 30px -10px hsl(var(--shadow-color) / 0.2), 0 4px 6px -4px hsl(var(--shadow-color) / 0.1)",

        // New Design System 2.0 shadows
        "elevation-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elevation-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "elevation-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "elevation-xl":
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "elevation-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",

        // Glow effects
        "glow-primary": "0 0 20px hsl(var(--primary-500) / 0.3)",
        "glow-accent": "0 0 20px hsl(var(--accent-500) / 0.3)",

        // Focus ring
        "focus-ring": "0 0 0 3px hsl(var(--primary-500) / 0.5)",
      },

      // ===== DESIGN SYSTEM 2.0 - TYPOGRAPHY =====
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "serif"],
        mono: ["Geist Mono", "monospace"],
      },

      // Fluid typography
      fontSize: {
        xs: [
          "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
          { lineHeight: "1.5" },
        ],
        sm: ["clamp(0.875rem, 0.8rem + 0.375vw, 1rem)", { lineHeight: "1.5" }],
        base: ["clamp(1rem, 0.9rem + 0.5vw, 1.125rem)", { lineHeight: "1.5" }],
        lg: ["clamp(1.125rem, 1rem + 0.625vw, 1.25rem)", { lineHeight: "1.5" }],
        xl: ["clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)", { lineHeight: "1.3" }],
        "2xl": ["clamp(1.5rem, 1.3rem + 1vw, 2rem)", { lineHeight: "1.3" }],
        "3xl": [
          "clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)",
          { lineHeight: "1.2" },
        ],
        "4xl": ["clamp(2.25rem, 1.9rem + 1.75vw, 3rem)", { lineHeight: "1.2" }],
        "5xl": ["clamp(3rem, 2.5rem + 2.5vw, 4rem)", { lineHeight: "1.1" }],
      },

      // ===== DESIGN SYSTEM 2.0 - COLORS =====
      colors: {
        // Legacy colors (zachowane)
        grapefruit: "hsl(var(--grapefruit))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // shadcn/ui semantic colors (zachowane)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // ===== NEW DESIGN SYSTEM 2.0 COLORS =====
        // Primary - Vibrant gradient blue-purple
        "primary-v2": {
          50: "hsl(250, 100%, 97%)",
          100: "hsl(250, 95%, 93%)",
          200: "hsl(250, 90%, 85%)",
          300: "hsl(250, 85%, 75%)",
          400: "hsl(250, 80%, 65%)",
          500: "hsl(250, 75%, 55%)",
          600: "hsl(250, 70%, 45%)",
          700: "hsl(250, 65%, 35%)",
          800: "hsl(250, 60%, 25%)",
          900: "hsl(250, 55%, 15%)",
          DEFAULT: "hsl(250, 75%, 55%)",
        },

        // Accent - Electric cyan
        "accent-v2": {
          50: "hsl(190, 100%, 97%)",
          100: "hsl(190, 95%, 90%)",
          200: "hsl(190, 90%, 80%)",
          300: "hsl(190, 85%, 70%)",
          400: "hsl(190, 80%, 60%)",
          500: "hsl(190, 75%, 50%)",
          600: "hsl(190, 70%, 40%)",
          700: "hsl(190, 65%, 30%)",
          800: "hsl(190, 60%, 20%)",
          900: "hsl(190, 55%, 10%)",
          DEFAULT: "hsl(190, 75%, 50%)",
        },

        // Success - Fresh green
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          light: "hsl(142, 76%, 46%)",
          dark: "hsl(142, 76%, 26%)",
        },

        // Warning - Warm amber
        warning: {
          DEFAULT: "hsl(38, 92%, 50%)",
          light: "hsl(38, 92%, 60%)",
          dark: "hsl(38, 92%, 40%)",
        },

        // Backgrounds (Dark Mode)
        "background-v2": {
          primary: "hsl(240, 10%, 8%)",
          secondary: "hsl(240, 8%, 12%)",
          tertiary: "hsl(240, 6%, 16%)",
          overlay: "hsl(240, 10%, 8% / 0.8)",
        },

        // Foreground
        "foreground-v2": {
          primary: "hsl(0, 0%, 98%)",
          secondary: "hsl(0, 0%, 70%)",
          tertiary: "hsl(0, 0%, 50%)",
          disabled: "hsl(0, 0%, 30%)",
        },

        // Borders & Dividers
        "border-v2": {
          subtle: "hsl(240, 6%, 20%)",
          DEFAULT: "hsl(240, 6%, 25%)",
          strong: "hsl(240, 6%, 30%)",
        },
      },

      // ===== DESIGN SYSTEM 2.0 - BORDER RADIUS =====
      borderRadius: {
        // Legacy (zachowane)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",

        // New Design System 2.0
        none: "0",
        "sm-v2": "0.375rem",
        default: "0.5rem",
        "md-v2": "0.75rem",
        "lg-v2": "1rem",
        "xl-v2": "1.5rem",
        "2xl-v2": "2rem",
        full: "9999px",
      },

      // ===== DESIGN SYSTEM 2.0 - SPACING (8pt grid) =====
      spacing: {
        "0.5": "0.125rem", // 2px
        "18": "4.5rem", // 72px
        "88": "22rem", // 352px
        "100": "25rem", // 400px
        "112": "28rem", // 448px
        "128": "32rem", // 512px
      },

      // ===== DESIGN SYSTEM 2.0 - ANIMATIONS =====
      keyframes: {
        // Legacy (zachowane)
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },

        // New Design System 2.0
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        // Legacy (zachowane)
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-in-up": "fade-in-up 0.3s ease-in-out",

        // New Design System 2.0
        shimmer: "shimmer 2s linear infinite",
        "slide-in-right": "slide-in-from-right 0.3s ease-out",
        "slide-in-bottom": "slide-in-from-bottom 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      // ===== DESIGN SYSTEM 2.0 - TRANSITIONS =====
      transitionDuration: {
        "0": "0ms",
        "75": "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
        "700": "700ms",
        "1000": "1000ms",
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
