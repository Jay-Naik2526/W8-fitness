/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        w8: {
          red: "#D60000",   // Aggressive Gym Red
          dark: "#1A1A1A",  // Soft Black for cards
          black: "#050505", // Deep Black for backgrounds
        }
      },
    },
  },
  plugins: [],
}