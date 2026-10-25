'use client'

import {
  createContext,
  createElement,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Theme } from '@ttydiy/theme'

const HydrationContext = createContext<Partial<Record<string, string>>>({})

/** The choice and its setter. Hydrates from `ThemeHydrationBoundary`, or as `'system'` without one. */
export function useTheme<TTheme extends string>(
  theme: Theme<TTheme>,
): [TTheme | 'system', Theme<TTheme>['set']] {
  const serverTheme = useContext(HydrationContext)[theme.options.cookie]
  // `dehydrate` already validated it.
  const getServerSnapshot = () => (serverTheme ?? 'system') as TTheme | 'system'
  return [
    useSyncExternalStore(theme.subscribe, theme.get, getServerSnapshot),
    theme.set,
  ]
}

export interface ThemeHydrationBoundaryProps {
  /** `colorTheme.dehydrate(cookieHeader)` from the request. */
  state: Partial<Record<string, string>>
  children?: ReactNode
}

export function ThemeHydrationBoundary({
  state,
  children,
}: ThemeHydrationBoundaryProps): ReactNode {
  return createElement(HydrationContext.Provider, { value: state }, children)
}
