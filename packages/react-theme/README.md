# @ttydiy/react-theme

React bindings for [@ttydiy/theme](https://www.npmjs.com/package/@ttydiy/theme): the choice in a cookie, the resolved theme on `<html>`. No flash, SSR-ready, under 1 kB. Includes the core, so install only this package.

```sh
npm i @ttydiy/react-theme
```

## Setup

1. Create a theme:

   ```ts
   // theme.ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme()
   ```

2. Add the script first in `<head>` and `suppressHydrationWarning` to `<html>`. In Next.js, `app/layout.tsx`:

   ```tsx
   import { themeScript } from '@ttydiy/react-theme'
   import { colorTheme } from './theme'

   export default function RootLayout({ children }: LayoutProps<'/'>) {
     return (
       <html lang="en" suppressHydrationWarning>
         <head>
           <script>{themeScript(colorTheme)}</script>
         </head>
         <body>{children}</body>
       </html>
     )
   }
   ```

3. Read and set the theme in a client component:

   ```tsx
   'use client'

   import { useTheme } from '@ttydiy/react-theme'
   import { colorTheme } from './theme'

   export function ThemeToggle() {
     const [theme, setTheme] = useTheme(colorTheme)
     return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</button>
   }
   ```

4. Style the themes:

   ```css
   :root { background: #fff; }
   [data-theme='dark'] { background: #0a0a0a; }
   ```

   For CSS that styles `.dark`, such as shadcn/ui, use `createTheme({ attribute: 'class' })`.

Guides for [TanStack Start](https://github.com/ttydiy/theme#tanstack-start) and [Vite](https://github.com/ttydiy/theme#vite) are in the docs.

## API

Everything from [@ttydiy/theme](https://www.npmjs.com/package/@ttydiy/theme), plus:

### `useTheme(theme)`

Returns `[theme, setTheme]`.

### `<ThemeHydrationBoundary state>`

Provides the server's choice to `useTheme` during hydration, so server-rendered components show it from the first render. `state` comes from `theme.dehydrate(cookieHeader)`.

[Docs](https://github.com/ttydiy/theme) · MIT
