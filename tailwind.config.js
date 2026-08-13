/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15130F",
        bg: "#FAFAF8",
        line: "#E7E2D9",
        muted: "#6E685F",
        accent: "#FF5A1F",
        accentDark: "#C43D0E",
      },
    },
  },
  plugins: [],
};
