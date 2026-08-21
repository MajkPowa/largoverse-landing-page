import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { sites } from '@openai/sites-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sites(),
    cloudflare({
      viteEnvironment: { name: 'server' },
      config: {
        name: 'largoverse',
        main: './worker/index.ts',
        compatibility_date: '2026-05-22',
        assets: { not_found_handling: 'single-page-application' },
      },
    }),
  ],
  base: './',
  server: { port: Number(process.env.PORT) || 5173 },
})
