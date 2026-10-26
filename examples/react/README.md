# React with Vite

A single-page app. A Vite plugin puts the script into `index.html`.

```sh
# from the repo root
npm install
npm run build
npm run dev -w examples/react
```

## Setup

1. Install: `npm i @ttydiy/react-theme`

2. Create a theme in [`src/theme.ts`](src/theme.ts):

   ```ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme()
   ```

3. Add the script first in `<head>`, in [`vite.config.ts`](vite.config.ts):

   ```ts
   plugins: [
     react(),
     {
       name: 'theme-script',
       transformIndexHtml: () => [
         { tag: 'script', children: themeScript(colorTheme), injectTo: 'head-prepend' },
       ],
     },
   ],
   ```

4. Style your themes in [`src/index.css`](src/index.css):

   ```css
   :root { background: #fff; color: #0a0a0a; }
   [data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
   ```

5. Add a toggle, like [`src/App.tsx`](src/App.tsx):

   ```tsx
   const [theme, setTheme] = useTheme(colorTheme)
   ```
