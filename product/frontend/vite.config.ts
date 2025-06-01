import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    allowedHosts: ['localhost', 'lenient-sponge-readily.ngrok-free.app'],
    host: true,
    port: 9000,
  }
})
