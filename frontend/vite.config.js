import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O portfólio (index.html), o MANDATO (mandato/index.html) e o GARIMPO (garimpo/index.html) são páginas independentes.
export default defineConfig({
  plugins: [react()],
  // Jogos online: em desenvolvimento os WebSockets vão para o servidor dos jogos (npm run server, porta 8787)
  server: { proxy: { '/mandato/ws': { target: 'ws://localhost:8787', ws: true }, '/garimpo/ws': { target: 'ws://localhost:8787', ws: true } } },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mandato: resolve(__dirname, 'mandato/index.html'),
        garimpo: resolve(__dirname, 'garimpo/index.html'),
      },
    },
  },
})
