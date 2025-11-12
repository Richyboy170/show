import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        party: {
          coral: "#FF6B6B",
          salmon: "#FFA07A",
          teal: "#4ECDC4",
          mint: "#95E1D3",
          gold: "#FFD166",
          peach: "#FFBE76",
        },
      },
      boxShadow: {
        'party': '0 10px 25px -5px rgba(255, 107, 107, 0.1), 0 8px 10px -6px rgba(78, 205, 196, 0.1)',
        'party-hover': '0 20px 35px -5px rgba(255, 107, 107, 0.2), 0 15px 20px -6px rgba(78, 205, 196, 0.2)',
      },
      fontFamily: {
        cursive: ['cursive'],
      },
    },
  },
  plugins: [],
};
export default config;
