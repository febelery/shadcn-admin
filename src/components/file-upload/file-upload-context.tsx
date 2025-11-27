/**
 * 文件上传上下文
 */
import * as React from 'react'
import type { FileUploadProps } from '@/types/file-upload'
import type { useFileUpload } from './use-file-upload'

export type FileUploadContextValue = ReturnType<typeof useFileUpload> &
  Pick<FileUploadProps, 'view' | 'cardSize' | 'validation'>

const FileUploadContext = React.createContext<
  FileUploadContextValue | undefined
>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export function useFileUploadContext() {
  const context = React.useContext(FileUploadContext)
  if (!context) {
    throw new Error('useFileUploadContext must be used within FileUpload')
  }
  return context
}

export function FileUploadProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: FileUploadContextValue
}) {
  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  )
}
