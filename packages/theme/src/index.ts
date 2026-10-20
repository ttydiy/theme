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
  /** The user's choice. `<html>` shows it resolved: `'system'` becomes the OS's `'light'` or `'dark'`. */
  get: () => TTheme | 'system'
  /** Saves the choice to the cookie and shows it, resolved, on `<html>`. */
  set: (
    value:
      TTheme | 'system' | ((theme: TTheme | 'system') => TTheme | 'system'),
  ) => void
  /** Fires on `set` and on changes from other tabs. */
  subscribe: (listener: (theme: TTheme | 'system') => void) => () => void
  /** The choice in a `Cookie` header or `document.cookie`. */
  parse: (cookies?: string | null) => TTheme | 'system'
  /** The request's choice, for `ThemeHydrationBoundary`. */
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

  // `systemTheme` and `apply` are mirrored by `themeScript`; the tests keep them in sync.
  const systemTheme = () =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const apply = (theme: string) => {
    const root = document.documentElement
    const resolved = theme === 'system' ? systemTheme() : theme
    if (attribute === 'class') {
      root.classList.remove(...themes)
      root.classList.add(resolved)
    } else root.setAttribute(attribute, resolved)
    root.style.colorScheme =
      resolved === 'dark' || resolved === 'light' ? resolved : ''
  }

  const listeners = new Set<(theme: string) => void>()
  let choice: string | undefined

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
    apply(theme)
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
        // Other tabs' changes arrive through `cookieStore` where it exists, otherwise when this tab is shown again.
        const store = (globalThis as { cookieStore?: EventTarget }).cookieStore
        store?.addEventListener('change', resync)
        addEventListener('visibilitychange', resync)
        addEventListener('pageshow', resync)
      }
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    parse,
    dehydrate: (cookies) => ({ [cookie]: parse(cookies) }),
  }
}

/** Inline first in `<head>`. Applies the saved choice to `<html>` before the first paint, and follows the OS while it's `'system'`. */
export function themeScript({
  options: { themes, attribute, cookie },
}: Pick<Theme<string>, 'options'>): string {
  const config = JSON.stringify([themes, attribute, cookie]).replace(
    /</g,
    '\\u003c',
  )
  const write =
    attribute === 'class'
      ? 'd.classList.remove(...t),d.classList.add(v)'
      : 'd.setAttribute(a,v)'
  return `try{let[t,a,c]=${config},d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)'),f=()=>{let v=m.matches?'dark':'light';for(let p of document.cookie.split(';')){let[n,x]=p.trim().split('=');if(n==c){t.includes(x)&&(v=x);break}}${write};d.style.colorScheme=v=='dark'||v=='light'?v:''};f();m.onchange=f}catch{}`
}
