import assert from 'node:assert/strict'
import { afterEach, describe, mock, test } from 'node:test'
import {
  createTheme,
  themeScript,
  type Theme,
  type ThemeOptions,
} from '@ttydiy/theme'

const root = document.documentElement
const show = () =>
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
const os = (scheme: 'light' | 'dark') => {
  const { happyDOM } = globalThis as unknown as {
    happyDOM: { settings: { device: { prefersColorScheme: string } } }
  }
  happyDOM.settings.device.prefersColorScheme = scheme
}

afterEach(() => {
  os('light')
  root.removeAttribute('data-theme')
  root.removeAttribute('class')
  root.removeAttribute('style')
  document.cookie = 'theme=;path=/;max-age=0'
  document.cookie = 'mode=;path=/;max-age=0'
})

// Shared by `parse` and `themeScript`, which must agree.
const cookies = [
  ['theme=dark', 'dark'],
  ['ref=a&theme=light; theme=dark', 'dark'],
  ['theme=light; theme=dark', 'light'],
  ['xtheme=dark', 'system'],
  ['theme=evil', 'system'],
  ['theme', 'system'],
  ['', 'system'],
] as const

describe('parse', () => {
  const theme = createTheme()

  for (const [input, expected] of [...cookies, [null, 'system'] as const]) {
    test(`${JSON.stringify(input)} → ${expected}`, () => {
      assert.equal(theme.parse(input), expected)
    })
  }

  test('dehydrate keys the choice by cookie name', () => {
    assert.deepEqual(theme.dehydrate('theme=dark'), { theme: 'dark' })
    assert.deepEqual(theme.dehydrate('theme=evil'), { theme: 'system' })
  })
})

describe('get / set', () => {
  test('get reads the cookie', () => {
    document.cookie = 'theme=dark;path=/'
    assert.equal(createTheme().get(), 'dark')
  })

  test('set saves the choice and shows it on <html>', () => {
    const theme = createTheme()
    theme.set('dark')
    assert.equal(theme.get(), 'dark')
    assert.equal(theme.parse(document.cookie), 'dark')
    assert.equal(root.getAttribute('data-theme'), 'dark')
    assert.equal(root.style.colorScheme, 'dark')
  })

  test("'system' clears the cookie and shows the OS theme", () => {
    os('dark')
    const theme = createTheme()
    theme.set('light')
    theme.set('system')
    assert.equal(theme.get(), 'system')
    assert.equal(theme.parse(document.cookie), 'system')
    assert.equal(root.getAttribute('data-theme'), 'dark')
    assert.equal(root.style.colorScheme, 'dark')
  })

  test('set takes an updater', () => {
    const theme = createTheme()
    theme.set('light')
    theme.set((current) => (current === 'dark' ? 'light' : 'dark'))
    assert.equal(theme.get(), 'dark')
  })

  test('class mode swaps the theme class, keeping others', () => {
    const theme = createTheme({ attribute: 'class' })
    root.classList.add('app')
    theme.set('dark')
    assert.equal(root.className, 'app dark')
    theme.set('light')
    assert.equal(root.className, 'app light')
  })

  test('custom themes leave color-scheme to CSS', () => {
    const theme = createTheme({ themes: ['light', 'dark', 'sepia'] })
    theme.set('dark')
    theme.set('sepia')
    assert.equal(root.getAttribute('data-theme'), 'sepia')
    assert.equal(root.style.colorScheme, '')
  })

  test('custom attribute and cookie', () => {
    const theme = createTheme({ attribute: 'data-mode', cookie: 'mode' })
    theme.set('light')
    assert.equal(root.getAttribute('data-mode'), 'light')
    assert.equal(theme.parse(document.cookie), 'light')
    theme.set('system')
    root.removeAttribute('data-mode')
  })
})

describe('subscribe', () => {
  test('notifies on set until unsubscribed', () => {
    const theme = createTheme()
    const listener = mock.fn()
    const unsubscribe = theme.subscribe(listener)
    theme.set('dark')
    unsubscribe()
    theme.set('light')
    assert.deepEqual(
      listener.mock.calls.map((call) => call.arguments),
      [['dark']],
    )
  })

  for (const [when, event] of [
    ['the tab is shown again', show],
    [
      'restored from the back/forward cache',
      () => dispatchEvent(new Event('pageshow')),
    ],
  ] as const) {
    test(`applies changes from other tabs when ${when}`, () => {
      const theme = createTheme()
      const listener = mock.fn()
      theme.subscribe(listener)
      document.cookie = 'theme=dark;path=/' // written by another tab
      event()
      assert.equal(theme.get(), 'dark')
      assert.equal(root.getAttribute('data-theme'), 'dark')
      assert.deepEqual(listener.mock.calls[0]?.arguments, ['dark'])
    })
  }

  test('ignores tab shows without a change', () => {
    const theme = createTheme()
    const listener = mock.fn()
    theme.subscribe(listener)
    show()
    assert.equal(listener.mock.callCount(), 0)
  })

  test('each unsubscribe stops only its own listener', () => {
    const theme = createTheme()
    const a = mock.fn()
    const b = mock.fn()
    const unsubscribeA = theme.subscribe(a)
    theme.subscribe(b)
    unsubscribeA()
    theme.set('dark')
    assert.equal(a.mock.callCount(), 0)
    assert.equal(b.mock.callCount(), 1)
  })

  test('stops listening to other tabs after the last unsubscribe', () => {
    const theme = createTheme()
    const unsubscribeA = theme.subscribe(() => {})
    const unsubscribeB = theme.subscribe(() => {})
    unsubscribeA()
    unsubscribeA() // calling twice is harmless
    document.cookie = 'theme=dark;path=/'
    show()
    assert.equal(theme.get(), 'dark')
    unsubscribeB()
    document.cookie = 'theme=light;path=/'
    show()
    assert.equal(theme.get(), 'dark')
  })
})

describe('themeScript', () => {
  const run = (
    theme: Pick<Theme<string>, 'options'>,
    cookie: string,
    className?: string,
  ) => {
    const html = document.createElement('html')
    if (className) html.className = className
    new Function('document', themeScript(theme))({
      cookie,
      documentElement: html,
    })
    return html
  }

  for (const [cookie, expected] of cookies) {
    test(`agrees with parse for ${JSON.stringify(cookie)}`, () => {
      const html = run(createTheme(), cookie)
      const shown = expected === 'system' ? 'light' : expected // the OS is light
      assert.equal(html.getAttribute('data-theme'), shown)
      assert.equal(html.style.colorScheme, shown)
    })
  }

  test("resolves 'system' from the OS", () => {
    os('dark')
    assert.equal(run(createTheme(), '').getAttribute('data-theme'), 'dark')
  })

  test('class mode', () => {
    const html = run(createTheme({ attribute: 'class' }), 'theme=dark')
    assert.equal(html.className, 'dark')
  })

  test('custom themes leave color-scheme to CSS', () => {
    const html = run(createTheme({ themes: ['light', 'sepia'] }), 'theme=sepia')
    assert.equal(html.getAttribute('data-theme'), 'sepia')
    assert.equal(html.style.colorScheme, '')
  })

  for (const [name, options, cookie] of [
    ['a saved theme', {}, 'theme=dark'],
    ["'system'", {}, ''],
    ['class mode', { attribute: 'class' }, 'theme=dark'],
    ['custom themes', { themes: ['light', 'sepia'] }, 'theme=sepia'],
    ['a custom cookie', { cookie: 'mode' }, 'mode=dark'],
  ] as const satisfies ReadonlyArray<
    readonly [string, ThemeOptions<string>, string]
  >) {
    test(`shows what the store shows for ${name}`, () => {
      os('dark')
      if (cookie) document.cookie = `${cookie};path=/`
      root.className = 'app'
      const theme = createTheme(options)
      theme.set(theme.get())
      const html = run(theme, cookie, 'app')
      const attributes = (element: Element) =>
        Object.fromEntries(
          element
            .getAttributeNames()
            .map((attribute) => [attribute, element.getAttribute(attribute)]),
        )
      assert.deepEqual(attributes(html), attributes(root))
    })
  }

  test('escapes </script> in options', () => {
    assert.doesNotMatch(
      themeScript(createTheme({ cookie: '</script>' })),
      /<\/script>/,
    )
  })

  test('never throws, even when cookies are unreadable', () => {
    assert.doesNotThrow(() =>
      new Function('document', themeScript(createTheme()))({}),
    )
  })
})

test('createTheme is safe on the server', () => {
  assert.equal(createTheme().parse('theme=dark'), 'dark')
})
