# React with Vite

Client-only: a Vite plugin inlines the theme script into `index.html`.

```sh
# from the repo root
npm install
npm run build
npm run dev -w examples/react
```

## Setup

1. Install the package: `npm i @ttydiy/react-theme`

2. Create the theme in [`src/theme.ts`](src/theme.ts):

   ```ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme()
   ```

3. In [`vite.config.ts`](vite.config.ts), inline the script first in `<head>`:

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

4. Read and set the theme in a component, like [`src/App.tsx`](src/App.tsx):

   ```tsx
   const [theme, setTheme] = useTheme(colorTheme)
   ```

5. Style the themes in [`src/index.css`](src/index.css):

   ```css
   :root { background: #fff; color: #0a0a0a; }
   [data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
   ```
