import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    allowedHosts: [
      '3e5f-2405-201-5c1b-2050-e539-12d8-4a24-9dfc.ngrok-free.app'
    ]
  }
});