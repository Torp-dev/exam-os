/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cabinet Grotesk'", "'Outfit'", "system-ui", "sans-serif"],
        body: ["'Outfit'", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0A0A0B",
        paper: "#F7F6F2",
      },
      animation: {
        marquee: "marquee 28s linear infinite",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
