import { Button } from '@/components/ui/button'
import { ThemeSelect } from './theme-select'

export default function Home() {
  return (
    <main className="flex flex-col items-start gap-4 p-8">
      <ThemeSelect />
      <Button>Hello world!</Button>
    </main>
  )
}
