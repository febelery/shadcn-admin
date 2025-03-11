export interface FileItem {
    uid: string
    name: string
    size: number
    type: string
    status: 'uploading' | 'done' | 'error'
    url?: string
    file?: File
    response?: any
    error?: any
  }