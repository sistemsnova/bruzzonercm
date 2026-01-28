import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para que __dirname funcione en entornos modernos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  // IMPORTANTE: Cambia 'bruzzonercm' por el nombre de tu repositorio si es distinto.
  // Esto es vital para que las imágenes y rutas carguen en GitHub Pages.
  base: '/bruzzonercm/', 

  resolve: {
    alias: {
      // El símbolo '@' ahora apuntará siempre a tu carpeta 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    chunkSizeWarningLimit: 2000, // Aumentamos el límite para evitar avisos de archivos grandes
    outDir: 'dist',
  },

  // Esto ayuda a Gemini y Firebase a manejar variables de entorno
  define: {
    'process.env': {}
  }
});