import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 49', 'safari >= 10', 'edge >= 15', 'firefox >= 45', 'not dead'],
      renderModernChunks: true,
    }),
  ],
  build: {
    cssTarget: 'chrome60',
  },
})

