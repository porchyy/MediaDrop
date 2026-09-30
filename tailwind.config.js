/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['"Courier New"', 'Courier', 'monospace'],
        thai: ['"IBM Plex Sans Thai"', 'sans-serif'],
      },
      colors: {
        p5: {
          black: '#080808',
          surface: '#121212',
          card: '#181818',
          red: '#E20B17',
          darkred: '#8E0710',
          white: '#F4F1E8',
          gray: '#A7A7A7',
        },
      },
    },
  },
  plugins: [],
}
