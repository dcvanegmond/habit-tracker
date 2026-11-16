import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build works from any folder on the server.
  base: './',
  test: {
    environment: 'node',
  },
});
