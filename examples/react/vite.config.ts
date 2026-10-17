import react from '@vitejs/plugin-react'
import { themeScript } from '@ttydiy/react-theme'
import { defineConfig } from 'vite'
import { colorTheme } from './src/theme.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Applies the saved choice to <html> before the first paint.
      name: 'theme-script',
      transformIndexHtml: () => [
        {
          tag: 'script',
          children: themeScript(colorTheme),
          injectTo: 'head-prepend',
        },
      ],
    },
  ],
})
