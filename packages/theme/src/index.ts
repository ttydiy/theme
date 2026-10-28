export interface ThemeOptions<TTheme extends string> {
  /** Themes besides the built-in `'system'`. Defaults to `['light', 'dark']`. */
  themes?: ReadonlyArray<TTheme>
  /** `'class'`, or an attribute on `<html>`. Defaults to `'data-theme'`. */
  attribute?: 'class' | `data-${string}`
  /** Cookie name. Defaults to `'theme'`. */
  cookie?: string
  /** Defaults to `'path=/;max-age=31536000;samesite=lax'`. To share across subdomains: `'path=/;domain=.example.com;max-age=31536000;samesite=lax'`. */
  cookieAttributes?: string
}

export interface Theme<TTheme extends string> {
  readonly options: Required<ThemeOptions<TTheme>>
  /** The user's choice. `<html>` shows it resolved: `'system'` becomes the OS's `'light'` or `'dark'`, or none if that isn't one of `themes`. */
  get: () => TTheme | 'system'
  /** Saves the choice to the cookie, and has `themeScript` show it, resolved, on `<html>`. */
  set: (
    value:
      TTheme | 'system' | ((theme: TTheme | 'system') => TTheme | 'system'),
  ) => void
  /** Fires on `set` and on changes from other tabs. */
  subscribe: (listener: (theme: TTheme | 'system') => void) => () => void
  /** The choice in a `Cookie` header or `document.cookie`. */
  parse: (cookies?: string | null) => TTheme | 'system'
  /** The request's choice, for a framework's hydration boundary. */
  dehydrate: (cookies?: string | null) => Record<string, TTheme | 'system'>
}

export function createTheme<const TTheme extends string = 'light' | 'dark'>(
  options?: ThemeOptions<TTheme>,
): Theme<TTheme>
export function createTheme({
  themes = ['light', 'dark'],
  attribute = 'data-theme',
  cookie = 'theme',
  cookieAttributes = 'path=/;max-age=31536000;samesite=lax',
}: ThemeOptions<string> = {}): Theme<string> {
  const parse = (cookies?: string | null) => {
    for (const pair of cookies?.split(';') ?? []) {
      const [key, value] = pair.trim().split('=')
      if (key === cookie)
        return themes.find((theme) => theme === value) ?? 'system'
    }
    return 'system'
  }

  // `themeScript` renders on `<html>`. Without it, the choice is still saved.
  const render = (theme: string) =>
    (globalThis as unknown as Record<string, (theme: string) => void>)[
      `ttydiy:${cookie}`
    ]?.(theme)

  const listeners = new Set<(theme: string) => void>()
  let choice: string | undefined
  let sync: AbortController | undefined

  // `document.cookie` throws in sandboxed iframes.
  const readCookie = () => {
    try {
      return parse(document.cookie)
    } catch {
      return undefined
    }
  }

  const get = () => (choice ??= readCookie() ?? 'system')

  const update = (theme: string) => {
    choice = theme
    render(theme)
    for (const listener of listeners) listener(theme)
  }

  const resync = () => {
    const theme = readCookie()
    if (theme && theme !== get()) update(theme)
  }

  return {
    options: { themes, attribute, cookie, cookieAttributes },
    get,
    set(value) {
      const theme = typeof value === 'function' ? value(get()) : value
      try {
        document.cookie =
          theme === 'system'
            ? `${cookie}=;${cookieAttributes};max-age=0`
            : `${cookie}=${theme};${cookieAttributes}`
      } catch {} // sandboxed iframes
      update(theme)
    },
    subscribe(listener) {
      get() // The baseline other tabs are compared against.
      if (!listeners.size) {
        // Other tabs' changes arrive through `cookieStore`. A page restored from the back/forward cache missed them, so it rechecks.
        const options = { signal: (sync = new AbortController()).signal }
        const store = (globalThis as { cookieStore?: EventTarget }).cookieStore
        store?.addEventListener('change', resync, options)
        addEventListener('pageshow', resync, options)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (!listeners.size) sync?.abort()
      }
    },
    parse,
    dehydrate: (cookies) => ({ [cookie]: parse(cookies) }),
  }
}

/** Inline first in `<head>`. Renders the saved choice on `<html>` before the first paint, then every change, and follows the OS while it's `'system'`. */
export function themeScript({
  options: { themes, attribute, cookie },
}: Pick<Theme<string>, 'options'>): string {
  const config = JSON.stringify([themes, attribute, cookie]).replace(
    /</g,
    '\\u003c',
  )
  const write =
    attribute === 'class'
      ? 'for(let x of t)d.classList.toggle(x,x==v)'
      : 'v?d.setAttribute(a,v):d.removeAttribute(a)'
  const colorScheme = setsColorScheme(themes)
    ? ";d.style.colorScheme=v=='dark'||v=='light'?v:''"
    : ''
  // `f` renders a choice, or the saved one. The store calls it through `window['ttydiy:' + cookie]`.
  return `try{let[t,a,c]=${config},d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),f=o=>{let s=m.matches?'dark':'light',v=t.includes(s)?s:'';if(!o)for(let p of document.cookie.split(';')){let[n,x]=p.trim().split('=');if(n==c){o=x;break}}t.includes(o)&&(v=o);${write}${colorScheme}};f();m.onchange=()=>f();window['ttydiy:'+c]=f}catch{}`
}

// Only themes with `light` or `dark` set `color-scheme`, so other themes, like contrast, can sit beside them.
const setsColorScheme = (themes: ReadonlyArray<string>) =>
  themes.includes('light') || themes.includes('dark')
