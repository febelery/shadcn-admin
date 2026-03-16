/**
 * 文件上传上下文
 */
import * as React from 'react'
import type { FileView, CardSize, FileValidation } from './types'
import type { UseFileUploadReturn } from './use-file-upload'

export type FileUploadContextValue = UseFileUploadReturn & {
  view: FileView
  cardSize: CardSize
  validation?: FileValidation
}

const FileUploadContext = React.createContext<FileUploadContextValue | undefined>(
  undefined,
)

export function useFileUploadContext(): FileUploadContextValue {
  const ctx = React.use(FileUploadContext)
  if (!ctx) {
    throw new Error(
      'useFileUploadContext 必须在 <FileUpload> 组件内部使用',
    )
  }
  return ctx
}

export function FileUploadProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: FileUploadContextValue
}) {
  return (
    <FileUploadContext value={value}>
      {children}
    </FileUploadContext>
  )
}
