/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // Busca en la raíz
    "./modules/**/*.{js,ts,jsx,tsx}", // Busca en tus carpetas
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aquí puedes agregar colores personalizados si tu diseño los usa
      }
    },
  },
  plugins: [],
}