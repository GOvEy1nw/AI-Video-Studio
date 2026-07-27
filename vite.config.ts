import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        async onstart(options) {
          if (process.env.ELECTRON_DEBUG) {
            // --inspect and --remote-debugging-port must come before '.' (the app path)
            await options.startup(['--inspect=9229', '--remote-debugging-port=9222', '.', '--no-sandbox'])
          } else {
            await options.startup()
          }
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            rolldownOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.js'
            },
            rolldownOptions: {
              output: {
                format: 'cjs'  // Preload must be CommonJS
              }
            }
          }
        }
      }
    ])
  ],
  optimizeDeps: {
    entries: ['index.html']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend')
    }
  },
  base: './',  // Use relative paths for Electron file:// protocol
  build: {
    outDir: 'dist'
  }
})
