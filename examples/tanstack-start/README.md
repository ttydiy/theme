# TanStack Start

Server-rendered. The script sets the saved theme before the first paint, and the server passes it to the UI.

```sh
# from the repo root
npm install
npm run build
npm run dev -w examples/tanstack-start
```

## Setup

1. Install: `npm i @ttydiy/react-theme`

2. Create a theme in [`src/theme.ts`](src/theme.ts):

   ```ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme()
   ```

3. Add the script to the shell's `<head>` in [`src/routes/__root.tsx`](src/routes/__root.tsx), and `suppressHydrationWarning` to `<html>`:

   ```tsx
   <html lang="en" suppressHydrationWarning>
     <head>
       <ScriptOnce>{themeScript(colorTheme)}</ScriptOnce>
       <HeadContent />
     </head>
   ```

4. Pass the saved theme from the server, in the same file, for routes with `ssr: true`:

   ```tsx
   const getThemeState = createServerFn().handler(() =>
     colorTheme.dehydrate(getRequestHeader('cookie')),
   )

   export const Route = createRootRoute({
     loader: () => getThemeState(),
     // ...
   })

   // in RootDocument's <body>:
   <ThemeHydrationBoundary state={Route.useLoaderData()}>{children}</ThemeHydrationBoundary>
   ```

5. Style your themes in [`src/styles.css`](src/styles.css):

   ```css
   :root { background: #fff; color: #0a0a0a; }
   [data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
   ```

6. Add a toggle, like [`src/theme-select.tsx`](src/theme-select.tsx):

   ```tsx
   const [theme, setTheme] = useTheme(colorTheme)
   ```

   Wrap a `<select>` in `<form autoComplete="off">`, or Safari restores its old value on Back.
