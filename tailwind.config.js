/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15130F",
        bg: "#F5EFE0",
        line: "#E4DCC5",
        muted: "#6E685F",
        accent: "#E8A93B",
        accentDark: "#B8791E",
      },
    },
  },
  plugins: [],
};
