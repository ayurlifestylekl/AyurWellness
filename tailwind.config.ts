import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Ayurvedic Wellness Centre brand palette — Forest Green + Deep Amber + Gold ──
        primary:        "#006B3C", // Deep Forest Green
        secondary:      "#75B843", // Fresh Leaf Green
        tertiary:       "#E4C384", // Soft Amber (name kept to avoid mass class rename)
        accent:         "#B8752A", // Deep Amber/Copper — main accent, highlighted words & links (name kept to avoid mass class rename)
        gold:           "#B58A3B", // Ayurvedic Gold — minor/premium decorative details only
        clay:           "#FFF9F2", // Warm Ivory
        dark:           "#12372D", // Deep Charcoal Green (name kept)
        charcoal:       "#12372D", // alias for new usage
        background:     "#FFF9F2", // Warm Ivory
        foreground:     "#12372D",
        ivory:          "#FFF9F2", // alias for new usage
        cream:          "#EDF4E7", // Soft Sage
        // ── blend tokens ──
        wine:           "#149447", // Ayurvedic Green
        "wine-deep":    "#006B3C", // Deep Forest Green
        "wine-900":     "#12372D", // Deep Charcoal Green
        blush:          "#FFF9F2", // non-white card (light zones)
        "sage-card":    "#EDF4E7", // non-white card (green zone)
        // ── tuned orphan tokens (names kept, hex harmonized to new palette) ──
        heroCream:      "#EDF4E7",
        nearBlackGreen: "#12372D",
        nocturne:       "#12372D",
        "nocturne-elev":"#12372D",
        // ── green ramp for the isolated apothecary band ──
        "forest-700":   "#75B843",
        "forest-800":   "#149447",
        "forest-900":   "#006B3C",
      },
      boxShadow: {
        'elevated':  '0 8px 30px -10px rgba(18,55,45,0.2), 0 2px 8px rgba(18,55,45,0.06)',
        'floating':  '0 24px 60px -20px rgba(18,55,45,0.35), 0 8px 20px rgba(18,55,45,0.1)',
        'luxe':      '0 32px 72px -24px rgba(18,55,45,0.4), 0 12px 28px rgba(18,55,45,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        'gold-glow': '0 18px 40px -18px rgba(181,138,59,0.85)',
      },
      fontFamily: {
        heading:    ["var(--font-montserrat)", "sans-serif"],
        body:       ["var(--font-lora)", "serif"],
        display:    ["var(--font-playfair)", "Georgia", "serif"],
        devanagari: ["var(--font-devanagari)", "Noto Serif Devanagari", "Devanagari MT", "serif"],
        fell:       ["var(--font-fell)", "Georgia", "serif"],
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        // Custom `prose-journal` modifier — applied on the article body wrapper.
        // Maps Tailwind Typography defaults onto the Kerala Ayurvedic brand
        // tokens (Deep Herbal Green, Turmeric Gold, Lora, Montserrat).
        journal: {
          css: {
            "--tw-prose-body":            theme("colors.dark"),
            "--tw-prose-headings":        theme("colors.primary"),
            "--tw-prose-lead":            theme("colors.dark"),
            "--tw-prose-links":           theme("colors.accent"),
            "--tw-prose-bold":            theme("colors.dark"),
            "--tw-prose-counters":        theme("colors.accent"),
            "--tw-prose-bullets":         theme("colors.accent"),
            "--tw-prose-hr":              "rgba(20, 148, 71,0.15)",
            "--tw-prose-quotes":          theme("colors.primary"),
            "--tw-prose-quote-borders":   theme("colors.accent"),
            "--tw-prose-captions":        "rgba(18, 55, 45,0.55)",
            "--tw-prose-code":            theme("colors.primary"),
            "--tw-prose-pre-code":        theme("colors.background"),
            "--tw-prose-pre-bg":          theme("colors.primary"),
            "--tw-prose-th-borders":      "rgba(20, 148, 71,0.2)",
            "--tw-prose-td-borders":      "rgba(20, 148, 71,0.1)",

            // Body
            color: "rgba(18, 55, 45,0.85)",
            fontFamily: theme("fontFamily.body").toString(),
            fontSize: "18px",
            lineHeight: "1.85",

            // Paragraphs
            p: {
              marginTop: "1.4em",
              marginBottom: "1.4em",
            },

            // Headings — Montserrat extrabold, tight tracking
            "h1, h2, h3, h4": {
              fontFamily: theme("fontFamily.heading").toString(),
              fontWeight: "800",
              letterSpacing: "-0.02em",
              color: theme("colors.primary"),
            },
            h2: {
              fontSize: "2em",
              marginTop: "2.2em",
              marginBottom: "0.8em",
              lineHeight: "1.15",
            },
            h3: {
              fontSize: "1.45em",
              marginTop: "1.8em",
              marginBottom: "0.6em",
              lineHeight: "1.25",
              fontWeight: "700",
            },

            // Links — Turmeric Gold underline
            a: {
              color: theme("colors.accent"),
              textDecoration: "underline",
              textDecorationThickness: "1px",
              textUnderlineOffset: "3px",
              fontWeight: "500",
              transition: "color 200ms ease-out",
            },
            "a:hover": {
              color: theme("colors.primary"),
            },

            // Strong
            strong: {
              color: theme("colors.dark"),
              fontWeight: "700",
            },

            // Italic — used heavily for editorial voice
            em: {
              fontStyle: "italic",
            },

            // Pull quotes (blockquote)
            blockquote: {
              fontFamily: theme("fontFamily.body").toString(),
              fontStyle: "italic",
              fontWeight: "400",
              fontSize: "1.55em",
              lineHeight: "1.45",
              color: theme("colors.primary"),
              borderLeftWidth: "3px",
              borderLeftColor: theme("colors.accent"),
              paddingLeft: "1.5em",
              marginTop: "2.2em",
              marginBottom: "2.2em",
              quotes: "none",
            },
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:last-of-type::after":   { content: "none" },

            // Lists
            "ul > li::marker": {
              color: theme("colors.accent"),
            },
            "ol > li::marker": {
              color: theme("colors.accent"),
              fontWeight: "700",
            },
            "ul, ol": {
              marginTop: "1.4em",
              marginBottom: "1.4em",
              paddingLeft: "1.4em",
            },
            "li": {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },

            // HR — gradient hairline
            hr: {
              borderTopWidth: "1px",
              marginTop: "3em",
              marginBottom: "3em",
            },

            // Images — defaults; the inline-image serializer wraps these
            // in a custom breakout figure.
            img: {
              borderRadius: "1rem",
              marginTop: "2em",
              marginBottom: "2em",
            },
            figure: {
              marginTop: "2em",
              marginBottom: "2em",
            },
            figcaption: {
              fontStyle: "italic",
              fontSize: "0.85em",
              textAlign: "center",
              marginTop: "0.75em",
              color: "rgba(18, 55, 45,0.55)",
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
export default config;
