import { createFileRoute } from '@tanstack/react-router'
import { FileUploadDemo } from '@/features/component-demo/file-upload'

export const Route = createFileRoute(
  '/_authenticated/_app/component-demo/file-upload'
)({
  component: FileUploadDemo,
})
