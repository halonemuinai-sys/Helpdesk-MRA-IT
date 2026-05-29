/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fc',
          100: '#e8ecf8',
          200: '#ccd5f0',
          300: '#a1b3e4',
          400: '#6f8ad4',
          500: '#4662c1', // Vibrant slate blue
          600: '#374ea8',
          700: '#2d3f8c',
          800: '#293774',
          900: '#253162',
          950: '#161c3b',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.4)',
          dark: 'rgba(26, 27, 38, 0.5)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
