import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O portfólio (index.html) e o jogo MANDATO (mandato/index.html) são páginas independentes.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mandato: resolve(__dirname, 'mandato/index.html'),
      },
    },
  },
})
