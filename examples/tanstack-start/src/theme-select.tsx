import { useTheme } from '@ttydiy/react-theme'
import { colorTheme } from './theme'

export function ThemeSelect() {
  const [theme, setTheme] = useTheme(colorTheme)
  return (
    // `autoComplete="off"` stops Safari restoring the old value on Back.
    <form autoComplete="off">
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as typeof theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </form>
  )
}
