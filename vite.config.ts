
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // This shims process.env so the Gemini SDK can find your key
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000
  }
});
