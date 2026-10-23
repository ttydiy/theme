# @ttydiy/theme

Headless, framework-agnostic theme state: the choice in a cookie, the resolved theme on `<html>`. No flash, SSR-ready, under 1 kB.

For React, install [@ttydiy/react-theme](https://www.npmjs.com/package/@ttydiy/react-theme) instead. It includes the core.

```sh
npm i @ttydiy/theme
```

## Setup

Create a theme:

```ts
// theme.ts
import { createTheme } from '@ttydiy/theme'

export const colorTheme = createTheme()
```

Inline the script first in `<head>`, so the theme is applied before the first paint:

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

Read the choice on the server:

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
| `subscribe(listener)` | Returns `unsubscribe`. Fires for other tabs too. |
| `parse(cookieHeader)` | The choice, on the server |
| `dehydrate(cookieHeader)` | State for a framework's hydration boundary |

### `themeScript(theme)`

The inline script, as a string. Its output is fixed per config, so a strict CSP can allow it by hash.

[Docs](https://github.com/ttydiy/theme) · MIT
