import { createFileRoute } from '@tanstack/react-router'
import { ThemeSelect } from '../theme-select'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main>
      <ThemeSelect />
      <p>Hello world!</p>
    </main>
  )
}
