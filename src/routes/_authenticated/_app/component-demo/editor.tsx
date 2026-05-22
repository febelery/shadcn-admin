import { createFileRoute } from '@tanstack/react-router'
import EditorDemo from '@/features/component-demo/editor-demo'

export const Route = createFileRoute(
  '/_authenticated/_app/component-demo/editor'
)({
  component: EditorDemo,
})
