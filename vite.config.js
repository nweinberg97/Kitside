import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` + hash routing means the build works from any path,
// including GitHub Pages project sites (https://<user>.github.io/kitside/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
