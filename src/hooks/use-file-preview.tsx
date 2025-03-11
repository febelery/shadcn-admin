import { useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { FileType, isFileType } from '@/lib/file'
import { AudioPreview } from '@/components/file/audio-preview'
import { ImagePreview } from '@/components/file/image-preview'
import { PDFPreview } from '@/components/file/pdf-preview'
import { FileItem } from '@/components/file/types'
import { VideoPreview } from '@/components/file/video-preview'

// 预览应用组件
const PreviewApp = ({
  file,
  onClose,
}: {
  file: FileItem
  onClose: () => void
}) => {
  // 添加动画样式
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  if (!file || !file.url) return null

  // 根据文件类型选择预览组件
  if (isFileType(file, FileType.IMAGE)) {
    return <ImagePreview file={file} onClose={onClose} />
  } else if (isFileType(file, FileType.VIDEO)) {
    return <VideoPreview file={file} onClose={onClose} />
  } else if (isFileType(file, FileType.AUDIO)) {
    return <AudioPreview file={file} onClose={onClose} />
  } else if (isFileType(file, FileType.PDF)) {
    return <PDFPreview file={file} onClose={onClose} />
  } else {
    window.open(file.url, '_blank')
  }

  return null
}

/**
 * 文件预览钩子函数
 * @returns 预览函数，可用于onClick事件处理器
 */
export const useFilePreview = () => {
  return useCallback((file: FileItem) => {
    if (!file || !file.url) {
      toast.error('无效的文件')
      return
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = createRoot(container)

    const closePreview = () => {
      root.unmount()

      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
    }

    root.render(<PreviewApp file={file} onClose={closePreview} />)
  }, [])
}
