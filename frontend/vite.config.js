import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer .jsx over .js so App.jsx / main.jsx take priority over old .js versions
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
  },
});
