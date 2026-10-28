# @ttydiy/theme

Headless, framework-agnostic theme state: the choice in a cookie, the resolved theme on `<html>`. No flash, SSR-ready.

- **Cookie-first.** The choice lives in a cookie, so the server can render it and every tab shares it.
- **Set before the first paint.** A tiny inline script sets `<html>` from the visitor's cookie, even on static or cached pages.
- **One store, any framework.** `get`, `set` and `subscribe`.
- **More than light and dark.** Add independent themes, like contrast or density, side by side.

Using React? Install [@ttydiy/react-theme](https://www.npmjs.com/package/@ttydiy/react-theme) instead. It includes this package.

## Get started

### 1. Install

```sh
npm i @ttydiy/theme
```

### 2. Create a theme

```ts
// theme.ts
import { createTheme } from '@ttydiy/theme'

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

It renders the theme on `<html>` before the page paints, and again on every change. Put it first in `<head>` on every page:

```ts
import { themeScript } from '@ttydiy/theme'

const head = `<script>${themeScript(colorTheme)}</script>`
```

### 4. Style your themes

```css
:root { background: #fff; color: #0a0a0a; }
[data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
```

Using Tailwind, shadcn/ui or another CSS library? See [Styling](https://github.com/ttydiy/theme#styling).

### 5. Read and change the theme

```ts
colorTheme.get() // 'light' | 'dark' | 'system'
colorTheme.set('dark')
colorTheme.subscribe((theme) => {})
```

On the server:

```ts
colorTheme.parse(request.headers.get('cookie'))
```

## API

### `createTheme(options?)`

| Option | Default | |
|---|---|---|
| `themes` | `['light', 'dark']` | Themes besides `'system'` |
| `attribute` | `'data-theme'` | Attribute on `<html>`, or `'class'` |
| `cookie` | `'theme'` | Cookie name |
| `cookieAttributes` | `'path=/;max-age=31536000;samesite=lax'` | Replaces the default |

| Returns | |
|---|---|
| `get()` | The choice: a theme or `'system'` |
| `set(theme)` | Takes a theme, `'system'` or an updater |
| `subscribe(listener)` | Calls `listener` on every change, including from other tabs. Returns `unsubscribe`. |
| `parse(cookieHeader)` | Reads the choice from a `Cookie` header, on the server |
| `dehydrate(cookieHeader)` | The choice as state for a framework's hydration boundary |

### `themeScript(theme)`

The script, as a string. Every page needs it: it renders the first paint and every change after. Without it, `set` still saves the choice, but `<html>` doesn't change. Its output only changes with the options, so a strict Content Security Policy can allow it by hash.

[Docs](https://github.com/ttydiy/theme) · MIT
