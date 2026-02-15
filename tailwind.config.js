/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./case-studies/**/*.html",
    "./components/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Syne"', 'sans-serif'],
        'body': ['"Inter Tight"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#F5F0EB',
        ink: '#141211',
        muted: '#6B6560',
        faint: '#A69F98',
        border: '#D6CEC6',
        accent: '#C2410C',
      },
      fontSize: {
        'hero': ['clamp(3rem, 8vw, 7.5rem)', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '800' }],
        'section': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};