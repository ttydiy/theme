# ttydiy theme

Headless, framework-agnostic theme state: the choice in a cookie, the resolved theme on `<html>`. No flash, SSR-ready, under 1 kB.

- **Cookie-first.** The choice lives in a cookie, so the server can render it and every tab shares it.
- **Set before the first paint.** A tiny inline script sets `<html>` from the visitor's cookie, even on static or cached pages.
- **One store, any framework.** `get`, `set` and `subscribe`, with a React adapter of a few lines on top.
- **More than light and dark.** Add independent themes, like contrast or density, side by side.

## Get started

### 1. Install

```sh
npm i @ttydiy/react-theme  # React
npm i @ttydiy/theme        # any other framework, or none
```

### 2. Create a theme

```ts
// theme.ts
import { createTheme } from '@ttydiy/react-theme' // or '@ttydiy/theme'

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

All options are in the [API](#createthemeoptions).

### 3. Add the script

It sets the theme on `<html>` before the page paints. Put it first in `<head>`.

<details open>
<summary><b>Next.js</b></summary>

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

[Example](examples/nextjs), with shadcn/ui.

</details>

<details>
<summary><b>TanStack Start</b></summary>

```tsx
// src/routes/__root.tsx
import { ScriptOnce } from '@tanstack/react-router'
import { themeScript } from '@ttydiy/react-theme'
import { colorTheme } from '../theme'

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeScript(colorTheme)}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

To show the saved theme in server-rendered components too, see [Server rendering](#server-rendering).

[Example](examples/tanstack-start)

</details>

<details>
<summary><b>Vite</b></summary>

```ts
// vite.config.ts
import { themeScript } from '@ttydiy/react-theme'
import { colorTheme } from './src/theme.ts'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'theme-script',
      transformIndexHtml: () => [
        { tag: 'script', children: themeScript(colorTheme), injectTo: 'head-prepend' },
      ],
    },
  ],
})
```

[Example](examples/react)

</details>

<details>
<summary><b>Any other framework</b></summary>

`themeScript` returns the script as a string. Add it to your HTML however your framework renders `<head>`:

```ts
import { themeScript } from '@ttydiy/theme'

const head = `<script>${themeScript(colorTheme)}</script>`
```

</details>

### 4. Style your themes

```css
:root { background: #fff; color: #0a0a0a; }
[data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
```

Using Tailwind, shadcn/ui or another CSS library? See [Styling](#styling).

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

Without React:

```ts
colorTheme.get() // 'light' | 'dark' | 'system'
colorTheme.set('dark')
colorTheme.subscribe((theme) => {})
```

## How it works

One cookie holds the user's choice, and everything reads from it:

```
 setTheme('dark') ──► cookie ──► the server, on every request
                        │
                        ├──► other tabs
                        ▼
 the script, before the first paint ──► <html data-theme="dark" style="color-scheme: dark"> ──► your CSS
```

- **Cookie as the source of truth.** Most theme libraries use `localStorage`, which only the browser can read. A cookie also reaches the server, so the server, the script and every tab agree.
- **Script before the first paint.** A small blocking script in `<head>` applies the choice, so there's no flash of the wrong theme.
- **`<html>` as output only.** The library writes the theme and `color-scheme` there, and never reads them back.
- **`'system'` resolved in the browser.** It follows `prefers-color-scheme`, and updates live when the OS changes.
- **A framework-agnostic store.** `get`, `set` and `subscribe`, the contract React's `useSyncExternalStore` expects, so each framework adapter is a few lines.
- **Hydration without mismatches.** The server passes the request's choice to the client, so both render the same value.
- **Tabs in sync.** Through the `cookieStore` change event, or when a tab is shown again where that's unsupported.

## Styling

The library sets the theme on `<html>`, and any CSS can style it. Pick the attribute your CSS expects:

| Using | Option | Style |
|---|---|---|
| Plain CSS | Default | `[data-theme='dark'] { … }` |
| Tailwind | Default | Add the `dark:` variant below |
| shadcn/ui | `attribute: 'class'` | Nothing to add: its `globals.css` styles `.dark` |
| daisyUI | Default | Nothing to add: it reads `data-theme`. List your daisyUI themes in `themes`. |
| Radix Themes | `attribute: 'class'` | Nothing to add: it reads `.light` and `.dark` |

Tailwind's `dark:` variant, for `data-theme`:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

The script also sets `color-scheme`, so native controls, scrollbars and `light-dark()` follow the theme. Tailwind compiles `light-dark()` to a fallback that reads `color-scheme` from your CSS, so with Tailwind, also add:

```css
[data-theme='light'] { color-scheme: light; }
[data-theme='dark'] { color-scheme: dark; }
```

## Server rendering

The script gets the colors right in every setup. Server rendering only matters for components that show the theme itself, like a toggle that says "Dark".

On the server, `useTheme` doesn't know the cookie, so it returns `'system'`, then updates right after the page loads. To render the saved choice from the start, pass it from the server with `ThemeHydrationBoundary`. In TanStack Start:

```tsx
// src/routes/__root.tsx
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { ThemeHydrationBoundary } from '@ttydiy/react-theme'

const getThemeState = createServerFn().handler(() =>
  colorTheme.dehydrate(getRequestHeader('cookie')),
)

export const Route = createRootRoute({
  loader: () => getThemeState(),
  shellComponent: RootDocument,
})

// in RootDocument's <body>:
<ThemeHydrationBoundary state={Route.useLoaderData()}>{children}</ThemeHydrationBoundary>
```

| Setup | Script | `suppressHydrationWarning` | `ThemeHydrationBoundary` |
|---|---|---|---|
| Server-rendered (Next.js, Start `ssr: true`) | Yes | Yes | Optional |
| Client-rendered in a server shell (Start `ssr: false` or `'data-only'`) | Yes | Yes | No |
| Single-page app (Vite) | Yes | No | No |

Only use the boundary on pages rendered per request. On a page cached for everyone, it would show one visitor's choice to others until the page loads.

## Independent themes

Need more than light and dark, like a contrast or density setting? Create one theme per setting, each with its own attribute and cookie:

```ts
export const contrast = createTheme({
  themes: ['more', 'less'],
  attribute: 'data-contrast',
  cookie: 'contrast',
})
```

Add a script for each, and pass both to the boundary:

```tsx
<ThemeHydrationBoundary state={{ ...colorTheme.dehydrate(cookies), ...contrast.dehydrate(cookies) }}>
```

- Keep `light` and `dark` in one theme. Only that one sets `color-scheme`.
- For other settings, `'system'` removes the attribute or class, so your CSS default applies.
- Give each theme its own cookie and attribute. `attribute: 'class'` can be shared, as long as the theme names differ.

## API

### `createTheme(options?)`

| Option | Default | |
|---|---|---|
| `themes` | `['light', 'dark']` | Themes besides `'system'` |
| `attribute` | `'data-theme'` | Attribute on `<html>`, or `'class'` |
| `cookie` | `'theme'` | Cookie name |
| `cookieAttributes` | `'path=/;max-age=31536000;samesite=lax'` | Replaces the default. To share across subdomains: `'path=/;domain=.example.com;max-age=31536000;samesite=lax'` |

| Returns | |
|---|---|
| `get()` | The choice: a theme or `'system'` |
| `set(theme)` | Takes a theme, `'system'` or an updater |
| `subscribe(listener)` | Calls `listener` on every change, including from other tabs. Returns `unsubscribe`. |
| `parse(cookieHeader)` | Reads the choice from a `Cookie` header, on the server |
| `dehydrate(cookieHeader)` | The choice as state for `ThemeHydrationBoundary` |

### `themeScript(theme)`

The script, as a string. Its output only changes with the options, so a strict Content Security Policy can allow it by hash.

### `useTheme(theme)`

Returns `[theme, setTheme]`.

### `<ThemeHydrationBoundary state>`

Gives `useTheme` the server's choice while the page hydrates.

## Platform support

Browsers. The script and store need the DOM and cookies, so React Native isn't supported. Electron and Tauri are untested. `parse` and `dehydrate` work in any JavaScript runtime.

## License

MIT
