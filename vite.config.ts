import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' para que el build funcione cargado desde file:// en Electron o Tauri
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
