/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wheat: '#f4d03f',
        wood: '#2d5016',
        brick: '#c0392b',
        ore: '#7f8c8d',
        sheep: '#a8e6cf',
        desert: '#f5deb3',
        ocean: '#3498db',
      },
    },
  },
  plugins: [],
}
