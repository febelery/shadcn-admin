import { createFileRoute } from '@tanstack/react-router'
import EditorDemo from '@/features/components-demo/editor-demo'

export const Route = createFileRoute('/_authenticated/components-demo/editor')({
  component: EditorDemo,
})
