# Next.js

Static pages with shadcn/ui: an inline script applies the saved theme before the first paint.

```sh
# from the repo root
npm install
npm run build
npm run dev -w examples/nextjs
```

## Setup

1. Install the package: `npm i @ttydiy/react-theme`

2. Create the theme in [`src/app/theme.ts`](src/app/theme.ts). shadcn/ui styles `.dark`, so use the class:

   ```ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme({ attribute: 'class' })
   ```

3. In [`src/app/layout.tsx`](src/app/layout.tsx), add `suppressHydrationWarning` to `<html>` and the script to `<head>`:

   ```tsx
   <html lang="en" suppressHydrationWarning>
     <head>
       <script>{themeScript(colorTheme)}</script>
     </head>
   ```

4. Read and set the theme in a client component, like [`src/app/theme-select.tsx`](src/app/theme-select.tsx):

   ```tsx
   const [theme, setTheme] = useTheme(colorTheme)
   ```