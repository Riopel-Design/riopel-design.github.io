/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",                // root HTML files like index.html
    "./components/**/*.html", // nav.html, hero.html, etc.
    "./js/**/*.js"             // optional but future-proof if you add Tailwind classes via JS
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
