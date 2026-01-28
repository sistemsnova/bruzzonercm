<<<<<<< HEAD
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix: Define __dirname as it is not automatically available in ES modules environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    // Inyecta variables de entorno al proceso global de forma segura
    'process.env': process.env
  }
});
=======
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
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
