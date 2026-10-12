import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0', // Accept connections from all network interfaces including mobile phones on Wi-Fi
    port: 5173,
    strictPort: false,
    cors: true,
  },
})
