import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import syncHandler from './api/sync.js'

function kingoSyncDevPlugin() {
  return {
    name: 'kingo-sync-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/sync', (req, res) => {
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(obj))
        }
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            req.body = body
            syncHandler(req, res)
          })
        } else {
          syncHandler(req, res)
        }
      })
    }
  }
}

export default defineConfig(({ command }) => ({
  plugins: [vue(), kingoSyncDevPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    preserveSymlinks: command === 'build',
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
