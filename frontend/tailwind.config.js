/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          800: "#343a40",
          900: "#212529",
        },
      },
    },
  },
  plugins: [],
};