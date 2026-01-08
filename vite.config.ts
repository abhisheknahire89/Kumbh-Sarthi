import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-icon.png'],
        manifest: {
          name: 'Kumbh Sarthi - Pilgrim Assistant',
          short_name: 'Kumbh Sarthi',
          description: 'AI-Powered Assistant for Kumbh Mela Nashik 2026',
          theme_color: '#FF9933',
          background_color: '#111827',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-icon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}']
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
