# @ttydiy/react-theme

React bindings for [@ttydiy/theme](https://www.npmjs.com/package/@ttydiy/theme): the choice in a cookie, the resolved theme on `<html>`. No flash, SSR-ready, under 1 kB.

- **Cookie-first.** The choice lives in a cookie, so the server can render it and every tab shares it.
- **Set before the first paint.** A tiny inline script sets `<html>` from the visitor's cookie, even on static or cached pages.
- **More than light and dark.** Add independent themes, like contrast or density, side by side.

Includes the core, so install only this package.

## Get started

### 1. Install

```sh
npm i @ttydiy/react-theme
```

### 2. Create a theme

```ts
// theme.ts
import { createTheme } from '@ttydiy/react-theme'

export const colorTheme = createTheme()
```

Every option is optional, so pass only what you want to change. The main ones, at their defaults:

```ts
export const colorTheme = createTheme({
  themes: ['light', 'dark'], // plus 'system', which follows the OS
  attribute: 'data-theme', // or 'class', for class="dark"
  cookie: 'theme',
})
```

All options are in the [API](https://github.com/ttydiy/theme#createthemeoptions).

### 3. Add the script

It sets the theme on `<html>` before the page paints. Put it first in `<head>`. In Next.js:

```tsx
// app/layout.tsx
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

TanStack Start and Vite are in the [docs](https://github.com/ttydiy/theme#3-add-the-script).

### 4. Style your themes

```css
:root { background: #fff; color: #0a0a0a; }
[data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
```

Using Tailwind, shadcn/ui or another CSS library? See [Styling](https://github.com/ttydiy/theme#styling).

### 5. Add a toggle

```tsx
'use client'

import { useTheme } from '@ttydiy/react-theme'
import { colorTheme } from './theme'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme(colorTheme)
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</button>
}
```

To show the saved theme in server-rendered components too, see [Server rendering](https://github.com/ttydiy/theme#server-rendering).

## API

Everything from [@ttydiy/theme](https://github.com/ttydiy/theme#api), plus:

### `useTheme(theme)`

Returns `[theme, setTheme]`.

### `<ThemeHydrationBoundary state>`

Gives `useTheme` the server's choice while the page hydrates. `state` comes from `theme.dehydrate(cookieHeader)`.

[Docs](https://github.com/ttydiy/theme) · MIT
