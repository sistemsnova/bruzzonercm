import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/bruzzonercm/', // Asegúrate que este sea el nombre exacto de tu repo en GitHub
  resolve: {
    alias: {
      // Ahora @ apunta a la carpeta src, que es donde está tu código
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600, // Para evitar el aviso de archivos grandes
  }
})