import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { act, createElement as h, type ReactNode } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import {
  createTheme,
  ThemeHydrationBoundary,
  useTheme,
  type Theme,
} from '@ttydiy/react-theme'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const root = document.documentElement
let reactRoot: Root | undefined

// Each test gets a fresh theme, since a theme remembers the choice it read.
const colorTheme = () => createTheme({ themes: ['light', 'dark', 'sepia'] })

// Renders the theme's current value.
const ThemeName = <TTheme extends string>(theme: Theme<TTheme>) =>
  h(function Name() {
    return h('span', null, useTheme(theme)[0])
  })

// Server-render `app`, hydrate it, and capture hydration errors.
async function hydrate(app: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  document.body.append(container)
  const onRecoverableError = mock.fn()
  await act(async () => {
    reactRoot = hydrateRoot(container, app, { onRecoverableError })
  })
  return { container, onRecoverableError }
}

afterEach(() => {
  act(() => reactRoot?.unmount())
  document.body.innerHTML = ''
  root.removeAttribute('data-theme')
  root.removeAttribute('style')
  document.cookie = 'theme=;path=/;max-age=0'
  document.cookie = 'contrast=;path=/;max-age=0'
})

test('hydrates the server value without a mismatch', async () => {
  document.cookie = 'theme=sepia;path=/'
  const theme = colorTheme()
  const state = theme.dehydrate(document.cookie) // on the server: the request's Cookie header
  const app = h(ThemeHydrationBoundary, { state }, ThemeName(theme))
  const { container, onRecoverableError } = await hydrate(app)
  assert.equal(onRecoverableError.mock.callCount(), 0)
  assert.equal(container.textContent, 'sepia')
})

test("without a boundary, hydrates as 'system' and then updates", async () => {
  document.cookie = 'theme=dark;path=/'
  const app = ThemeName(colorTheme())
  const { container, onRecoverableError } = await hydrate(app)
  assert.equal(onRecoverableError.mock.callCount(), 0)
  assert.equal(container.textContent, 'dark')
})

test('re-renders on set and on changes from other tabs', async () => {
  const theme = colorTheme()
  const { container } = await hydrate(ThemeName(theme))
  await act(() => theme.set('sepia'))
  assert.equal(container.textContent, 'sepia')
  await act(() => {
    document.cookie = 'theme=light;path=/' // written by another tab
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
  })
  assert.equal(container.textContent, 'light')
})

test('one boundary hydrates several themes', async () => {
  document.cookie = 'theme=light;path=/'
  document.cookie = 'contrast=more;path=/'
  const theme = colorTheme()
  const contrast = createTheme({
    themes: ['more', 'less'],
    attribute: 'data-contrast',
    cookie: 'contrast',
  })
  const state = {
    ...theme.dehydrate(document.cookie),
    ...contrast.dehydrate(document.cookie),
  }
  function Both() {
    return h('span', null, `${useTheme(theme)[0]}/${useTheme(contrast)[0]}`)
  }
  const { container, onRecoverableError } = await hydrate(
    h(ThemeHydrationBoundary, { state }, h(Both)),
  )
  assert.equal(onRecoverableError.mock.callCount(), 0)
  assert.equal(container.textContent, 'light/more')
})

test("a boundary for one theme doesn't leak into another", () => {
  const contrast = createTheme({ themes: ['more', 'less'], cookie: 'contrast' })
  assert.equal(
    renderToString(
      h(
        ThemeHydrationBoundary,
        { state: { theme: 'more' } },
        ThemeName(contrast),
      ),
    ),
    '<span>system</span>',
  )
})
