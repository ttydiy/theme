import {
  HeadContent,
  ScriptOnce,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { ThemeHydrationBoundary, themeScript } from '@ttydiy/react-theme'
import { colorTheme } from '../theme'

import appCss from '../styles.css?url'

const getThemeState = createServerFn().handler(() =>
  colorTheme.dehydrate(getRequestHeader('cookie')),
)

export const Route = createRootRoute({
  loader: () => getThemeState(),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => <main>Not found</main>,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const state = Route.useLoaderData()
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeScript(colorTheme)}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        <ThemeHydrationBoundary state={state}>
          {children}
        </ThemeHydrationBoundary>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
