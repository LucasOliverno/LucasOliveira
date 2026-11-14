import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O portfólio (index.html) e o jogo MANDATO (mandato/index.html) são páginas independentes.
export default defineConfig({
  plugins: [react()],
  // MANDATO online: em desenvolvimento o WebSocket vai para o servidor do jogo (npm run server, porta 8787)
  server: { proxy: { '/mandato/ws': { target: 'ws://localhost:8787', ws: true } } },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mandato: resolve(__dirname, 'mandato/index.html'),
      },
    },
  },
})
