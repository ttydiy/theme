# TanStack Start

Server-rendered: the script applies the saved choice before the first paint, and the server hydrates it into the UI.

```sh
# from the repo root
npm install
npm run build
npm run dev -w examples/tanstack-start
```

## Setup

1. Install the package: `npm i @ttydiy/react-theme`

2. Create the theme in [`src/theme.ts`](src/theme.ts):

   ```ts
   import { createTheme } from '@ttydiy/react-theme'

   export const colorTheme = createTheme()
   ```

3. In [`src/routes/__root.tsx`](src/routes/__root.tsx), add the script to the shell's `<head>` and `suppressHydrationWarning` to `<html>`:

   ```tsx
   <html lang="en" suppressHydrationWarning>
     <head>
       <ScriptOnce>{themeScript(colorTheme)}</ScriptOnce>
       <HeadContent />
     </head>
   ```

4. For routes with `ssr: true`, hydrate the request's choice in the same file:

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

5. Read and set the theme in a component, like [`src/theme-select.tsx`](src/theme-select.tsx):

   ```tsx
   const [theme, setTheme] = useTheme(colorTheme)
   ```

   Wrap a `<select>` in `<form autoComplete="off">`, or Safari restores its old value on Back.

6. Style the themes in [`src/styles.css`](src/styles.css):

   ```css
   :root { background: #fff; color: #0a0a0a; }
   [data-theme='dark'] { background: #0a0a0a; color: #fafafa; }
   ```
