import { createFileRoute } from '@tanstack/react-router'
import { FileUploadDemo } from '@/features/components-demo/file-upload'

export const Route = createFileRoute('/_authenticated/components-demo/file-upload')({
  component: FileUploadDemo,
})
