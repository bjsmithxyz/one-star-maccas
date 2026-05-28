import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repoName = 'one-star-maccas'

function cspProductionPlugin() {
  return {
    name: 'csp-production',
    transformIndexHtml(html: string, ctx: { server?: unknown }) {
      if (ctx.server) return html
      return html.replace(/ ws:\/\/127\.0\.0\.1:\* ws:\/\/localhost:\*/g, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/',
  plugins: [react(), tailwindcss(), cspProductionPlugin()],
})
