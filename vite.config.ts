
import { defineConfig } from 'vite';

export default defineConfig({
  // This ensures that process.env.API_KEY is replaced with the real key 
  // from your Netlify environment variables during the build process.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild', // Using default esbuild to avoid terser dependency errors
  },
  server: {
    port: 3000
  }
});
