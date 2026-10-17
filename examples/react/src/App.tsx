import { useTheme } from '@ttydiy/react-theme'
import { colorTheme } from './theme'

function App() {
  const [theme, setTheme] = useTheme(colorTheme)
  return (
    <main>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as typeof theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <p>Hello world!</p>
    </main>
  )
}

export default App
