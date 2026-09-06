import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Deploy at root level
  build: {
    outDir: 'dist',
  }
})
