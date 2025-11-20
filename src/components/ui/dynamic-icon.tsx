import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface DynamicIconProps extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const formattedName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  const LucideIcon = (Icons as any)[formattedName]

  if (!LucideIcon) {
    return null
  }

  return <LucideIcon {...props} />
}
