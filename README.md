# ttydiy theme

Headless, framework-agnostic theme state.

## Architecture

- **Headless.** The core has no UI, no styles and no framework code. You render the controls and write the CSS.
- **Cookie as the source of truth.** The user's choice, a theme or `'system'`, is stored in a cookie. The server reads it on every request, and all tabs share it.
- **Pre-paint script, no FOUC.** A blocking inline script in `<head>` applies the choice to `<html>` before the browser paints, so there's no flash of the wrong theme.
- **DOM as output.** `<html>` carries the resolved theme as an attribute or class, plus `color-scheme`. CSS reads it, and the library never reads it back as state.
- **`'system'` resolved in the browser.** It resolves to `light` or `dark` from `prefers-color-scheme`, and follows OS changes live.
- **Framework-agnostic store.** `get`, `set` and `subscribe`, the contract `useSyncExternalStore` expects. Adapters are thin bindings.
- **Hydration-safe.** The server dehydrates the request's choice, and `ThemeHydrationBoundary` hydrates it, so server and client render the same value.
- **Cross-tab sync.** Through the `cookieStore` change event, or when a tab is shown again where it's unsupported.

```
 set('dark') ──► cookie ──► server, on every request
                   │
                   ├──► other tabs ──► store ──► subscribers
                   ▼
 inline script, before first paint ──► <html data-theme="dark" style="color-scheme: dark"> ──► your CSS
```

## Installation

```sh
npm i @ttydiy/theme        # vanilla JS
npm i @ttydiy/react-theme  # React, includes the core
```

## Setup

Create a theme:

```ts
// theme.ts
import { createTheme } from '@ttydiy/theme'

export const colorTheme = createTheme()
```

Inline the script first in `<head>`:

```ts
import { themeScript } from '@ttydiy/theme'

const head = `<script>${themeScript(colorTheme)}</script>`
```

Style the themes:

```css
:root { background: #fff; }
[data-theme='dark'] { background: #0a0a0a; }
```

Read and change the theme:

```ts
colorTheme.get() // 'light' | 'dark' | 'system'
colorTheme.set('dark')
colorTheme.subscribe((theme) => {})
```

## React

Import everything from `@ttydiy/react-theme`. The guides below use `colorTheme` from [Setup](#setup).

```tsx
import { useTheme } from '@ttydiy/react-theme'

function ThemeToggle() {
  const [theme, setTheme] = useTheme(colorTheme)
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</button>
}
```

### Next.js

1. In `app/layout.tsx`, add the script to `<head>` and `suppressHydrationWarning` to `<html>`:

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

2. Call `useTheme` in a client component (`'use client'`).

[Example](examples/nextjs), with shadcn/ui.

### TanStack Start

1. In `src/routes/__root.tsx`, add the script to the shell's `<head>` and `suppressHydrationWarning` to `<html>`:

   ```tsx
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

2. For routes with `ssr: true`, hydrate the request's choice, so server-rendered components show it from the first render:

   ```tsx
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

3. Call `useTheme` in any component.

[Example](examples/tanstack-start)

### Vite

1. In `vite.config.ts`, inline the script into `index.html`:

   ```ts
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

2. Call `useTheme` in any component. No `suppressHydrationWarning` needed: nothing is hydrated.

[Example](examples/react)

### Rendering modes

The script is needed in every mode. Only server-rendered components need the boundary.

| Mode | Script | `suppressHydrationWarning` | `ThemeHydrationBoundary` |
|---|---|---|---|
| Server-rendered (Next.js, Start `ssr: true`) | ✓ | ✓ | Optional: without it, `useTheme` shows `'system'` for one frame |
| Client-rendered in a server shell (Start `ssr: false` or `'data-only'`, Next.js `dynamic(…, { ssr: false })`) | ✓ | ✓ | Not needed |
| Single-page app (Vite) | ✓ | Not needed | Not needed |

Use the boundary only on pages rendered per request. Its state is part of the HTML, so a page cached for everyone would show one visitor's choice to others until hydration. Colors are unaffected either way: the script reads the visitor's own cookie.

## Styling

Style `[data-theme='dark']`, or set `attribute: 'class'` for CSS that styles `.dark`, such as shadcn/ui.

Tailwind's `dark:` variant:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

`light-dark()` follows the `color-scheme` the script sets. Tailwind compiles `light-dark()` to a fallback that reads `color-scheme` from CSS, so with Tailwind also add:

```css
[data-theme='light'] { color-scheme: light; }
[data-theme='dark'] { color-scheme: dark; }
```

## API

### `createTheme(options?)`

| Option | Default | |
|---|---|---|
| `themes` | `['light', 'dark']` | Themes besides `'system'` |
| `attribute` | `'data-theme'` | Attribute on `<html>`, or `'class'` |
| `cookie` | `'theme'` | Cookie name |
| `cookieAttributes` | `'path=/;max-age=31536000;samesite=lax'` | Add `;domain=.example.com` to share across subdomains |

| Returns | |
|---|---|
| `get()` | The choice: a theme or `'system'` |
| `set(theme)` | Takes a theme, `'system'` or an updater |
| `subscribe(listener)` | Returns `unsubscribe`. Fires for other tabs too. |
| `parse(cookieHeader)` | The choice, on the server |
| `dehydrate(cookieHeader)` | State for `ThemeHydrationBoundary`. Spread several themes into one object. |

### `themeScript(theme)`

The inline script, as a string. Its output is fixed per config, so a strict CSP can allow it by hash.

### `useTheme(theme)`

Returns `[theme, setTheme]`.

### `<ThemeHydrationBoundary state>`

Provides the server's choice to `useTheme` during hydration.

## License

MIT
