import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle as IconAlertCircle,
  X as IconX,
  File as IconFile,
  Loader as IconLoader,
  Image as IconImage,
  Video as IconVideo,
  Upload as IconUpload,
  Shield as IconShield,
  Music as IconMusic,
  FileText as IconFileText,
  FileType as IconPdf,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import {
  FileType,
  getFileType,
  formatFileSize,
  isFileType,
  getAcceptFromFileTypes,
} from '@/lib/file'
import { cn, getMimeTypeFromUrl } from '@/lib/utils'
import { useFilePreview } from '@/hooks/use-file-preview'
import { useQiniuUpload } from '@/hooks/use-qiniu-upload'
import { FileItem } from './types'

// 文件类型图标组件
const FileTypeIcon = ({
  file,
  size = 24,
}: {
  file: FileItem
  size?: number
}) => {
  if (!file.url) {
    return <IconShield size={size} className='text-red-500' />
  }

  const fileType = getFileType(file)

  switch (fileType) {
    case FileType.IMAGE:
      return <IconImage size={size} className='text-background' />
    case FileType.VIDEO:
      return <IconVideo size={size} className='text-background' />
    case FileType.AUDIO:
      return <IconMusic size={size} className='text-background' />
    case FileType.DOCUMENT:
      return <IconFileText size={size} className='text-background' />
    case FileType.PDF:
      return <IconPdf size={size} className='text-background' />
    default:
      return (
        <IconFile
          size={size}
          className={size > 20 ? 'text-white' : 'text-background'}
        />
      )
  }
}

export const FileUpload = ({
  onChange,
  value = [],
  maxCount = 3,
  acceptTypes: fileTypes,
  multiple = true,
  listType = 'list',
  className,
  maxSize = 200 * 1024 * 1024, // 默认 200MB
}: {
  onChange?: (urls: string[]) => void
  value?: string[] | null
  maxCount?: number
  acceptTypes?: FileType[]
  multiple?: boolean
  listType?: 'card' | 'list'
  className?: string
  maxSize?: number
}) => {
  const [fileList, setFileList] = useState<FileItem[]>([])
  const { uploadToQiniu } = useQiniuUpload()
  const previewFile = useFilePreview()

  // 当 value 变化时更新 fileList
  useEffect(() => {
    if (value && value.length > 0) {
      // 转换 URL 为 FileItem 对象以便显示
      const initialFiles: FileItem[] = value.map((url, index) => ({
        uid: `existing-${index}-${Date.now()}`,
        name: url.split('/').pop() || `文件 ${index + 1}`,
        size: 0,
        type: getMimeTypeFromUrl(url),
        status: 'done',
        url: url,
      }))

      setFileList(initialFiles)
    } else {
      setFileList([])
    }
  }, [value]) // 添加 value 作为依赖项，确保 value 变化时更新

  // 获取当前已完成上传的文件URL列表
  const getCurrentUrls = useCallback(() => {
    return fileList
      .filter((file) => file.status === 'done' && file.url)
      .map((file) => file.url as string)
  }, [fileList])

  // 文件上传处理
  const handleUpload = useCallback(
    async (file: File) => {
      const uid = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 检查文件大小是否超出限制
      if (file.size > maxSize) {
        const newFile: FileItem = {
          uid,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          error: `限制最大${formatFileSize(maxSize)}`,
          file,
        }

        setFileList((prev) => [...prev, newFile])
        return
      }

      const newFile: FileItem = {
        uid,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        file,
      }

      // 添加到列表，显示上传中状态
      setFileList((prev) => [...prev, newFile])

      try {
        // 上传到七牛云
        const response: any = await uploadToQiniu(file)

        // 更新状态为完成
        setFileList((prev) => {
          const updated = prev.map((item) =>
            item.uid === uid
              ? {
                  ...item,
                  status: 'done' as const,
                  url: response.path,
                  response,
                }
              : item
          )

          // 同步更新到父组件
          const urls = updated
            .filter((f) => f.status === 'done' && f.url)
            .map((f) => f.url as string)

          // 调度到下一个事件循环，确保状态已更新
          setTimeout(() => onChange?.(urls), 0)

          return updated
        })
      } catch (error) {
        // 更新状态为失败
        setFileList((prev) => {
          const updated = prev.map((item) =>
            item.uid === uid
              ? { ...item, status: 'error' as const, error }
              : item
          )

          // 同步通知父组件排除失败的文件
          setTimeout(() => onChange?.(getCurrentUrls()), 0)

          return updated
        })
      }
    },
    [uploadToQiniu, onChange, getCurrentUrls, maxSize]
  )

  // 移除文件处理
  const handleRemove = useCallback(
    (uid: string) => {
      setFileList((prev) => {
        const updated = prev.filter((file) => file.uid !== uid)

        // 同步通知父组件
        const urls = updated
          .filter((file) => file.status === 'done' && file.url)
          .map((file) => file.url as string)

        setTimeout(() => onChange?.(urls), 0)

        return updated
      })
    },
    [onChange]
  )

  // 拖放处理
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // 确保不超过最大数量限制
      const filesToUpload = acceptedFiles.slice(0, maxCount - fileList.length)
      filesToUpload.forEach((file) => handleUpload(file))
    },
    [fileList.length, maxCount, handleUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes ? { [getAcceptFromFileTypes(fileTypes)]: [] } : undefined,
    multiple,
    disabled: fileList.length >= maxCount,
  })

  // 改进错误处理
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error
    if (error?.message && typeof error.message === 'string')
      return error.message
    return '未知错误'
  }

  // 卡片模式文件预览项
  const CardFileItem = useCallback(
    ({ file }: { file: FileItem }) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className='group relative aspect-square overflow-hidden rounded-lg border'
      >
        {file.status === 'done' && (
          <div
            className='h-full w-full cursor-pointer'
            onClick={() => previewFile(file)}
          >
            {isFileType(file, FileType.IMAGE) && file.url ? (
              <div className='bg-muted/20 relative h-full w-full'>
                <img
                  src={file.url}
                  alt={file.name}
                  className='h-full w-full object-cover'
                />
                <div className='bg-foreground/5 absolute inset-0 flex items-center justify-center'>
                  <FileTypeIcon file={file} />
                </div>
              </div>
            ) : isFileType(file, FileType.VIDEO) && file.url ? (
              <div className='bg-muted/20 relative h-full w-full'>
                <img
                  src={file.url + '?vframe/png/offset/0'}
                  alt={file.name}
                  className='h-full w-full object-cover'
                />
                <div className='bg-foreground/5 absolute inset-0 flex items-center justify-center'>
                  <FileTypeIcon file={file} />
                </div>
              </div>
            ) : (
              <div className='bg-muted/10 flex h-full w-full items-center justify-center'>
                <div className='bg-foreground/30 absolute inset-0 flex items-center justify-center'>
                  <FileTypeIcon file={file} />
                </div>
              </div>
            )}

            <div className='absolute right-0 bottom-0 left-0 truncate bg-black/50 px-2 py-0.5 text-center text-xs text-white backdrop-blur-sm'>
              {file.name}
            </div>
          </div>
        )}

        {file.status === 'uploading' && (
          <div className='flex h-full w-full flex-col items-center justify-center border border-dashed'>
            <IconLoader className='text-primary mb-2 h-4 w-4 animate-spin' />
            <div className='mt-2 text-sm'>上传中</div>
          </div>
        )}

        {file.status === 'error' && (
          <div className='bg-background flex h-full w-full flex-col items-center justify-center'>
            <IconAlertCircle className='text-destructive mb-2 h-8 w-8' />
            <div className='text-destructive/80 max-w-full px-2 text-center text-xs'>
              {getErrorMessage(file.error)}
            </div>
          </div>
        )}

        <motion.button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            handleRemove(file.uid)
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100'
        >
          <IconX
            size={10}
            className='text-muted-foreground hover:text-destructive'
          />
        </motion.button>
      </motion.div>
    ),
    [handleRemove, previewFile]
  )

  // 列表模式文件预览项
  const ListFileItem = useCallback(
    ({ file }: { file: FileItem }) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        layout
        className='group hover:bg-muted/50 relative flex items-center overflow-hidden rounded-lg border p-3 pr-10 transition-colors'
      >
        <div
          className='flex min-w-0 flex-1 cursor-pointer items-center gap-3'
          onClick={() => file.status === 'done' && previewFile(file)}
        >
          {isFileType(file, FileType.IMAGE) && file.url ? (
            <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md'>
              <img
                src={file.url}
                alt={file.name}
                className='h-full w-full object-cover'
              />
              <div className='bg-foreground/5 absolute inset-0 flex items-center justify-center'>
                <FileTypeIcon file={file} size={16} />
              </div>
            </div>
          ) : isFileType(file, FileType.VIDEO) && file.url ? (
            <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md'>
              <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                <img
                  src={file.url + '?vframe/png/offset/0'}
                  alt={file.name}
                  className='h-full w-full object-cover'
                />
                <div className='bg-foreground/5 absolute inset-0 flex items-center justify-center'>
                  <FileTypeIcon file={file} size={16} />
                </div>
              </div>
            </div>
          ) : (
            <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md'>
              <div className='bg-foreground/30 absolute inset-0 flex items-center justify-center'>
                <FileTypeIcon file={file} size={16} />
              </div>
            </div>
          )}

          <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
            <span className='truncate text-sm font-medium'>{file.name}</span>
            <span className='text-muted-foreground truncate text-xs'>
              {file.size ? formatFileSize(file.size) : '已存在'}
            </span>
          </div>

          {file.status === 'uploading' && (
            <div className='right-10 flex h-full items-center'>
              <IconLoader className='text-primary h-4 w-4 animate-spin' />
            </div>
          )}

          {file.status === 'error' && (
            <div className='ml-3 flex items-center'>
              <span className='text-destructive ml-auto text-xs'>
                {getErrorMessage(file.error)}
              </span>
            </div>
          )}
        </div>

        <motion.button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            handleRemove(file.uid)
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className='bg-background/80 hover:bg-background text-muted-foreground hover:text-destructive absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 transition-all'
        >
          <IconX size={16} />
        </motion.button>
      </motion.div>
    ),
    [handleRemove, previewFile]
  )

  // 更新上传区域提示文本
  const getUploadTips = useCallback(() => {
    const tips = []
    if (multiple) {
      tips.push(`上传最多${maxCount}个文件`)
    } else {
      tips.push('上传一个文件')
    }
    tips.push(`单个文件不超过${formatFileSize(maxSize)}`)
    if (fileTypes?.length) {
      tips.push(`支持${fileTypes.join('、')}类型`)
    }
    return tips.join('，')
  }, [multiple, maxCount, maxSize, fileTypes])

  // 上传区域组件
  const UploadArea = useCallback(
    () => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'rounded-lg border-2 border-dashed p-6 transition-all',
            'flex flex-col items-center justify-center gap-2',
            'hover:border-primary/50 cursor-pointer',
            isDragActive
              ? 'border-primary bg-primary/5 scale-[1.02] shadow-sm'
              : 'border-muted'
          )}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{
              y: isDragActive ? [0, -5, 0] : 0,
            }}
            transition={{ repeat: isDragActive ? Infinity : 0, duration: 1 }}
          >
            <IconUpload className='text-muted-foreground h-8 w-8' />
          </motion.div>
          <p className='text-muted-foreground text-sm font-medium'>
            {isDragActive ? '拖放文件到这里...' : '点击或拖放文件到这里上传'}
          </p>
          <p className='text-muted-foreground text-xs'>{getUploadTips()}</p>
        </div>
      </motion.div>
    ),
    [getRootProps, getInputProps, isDragActive, getUploadTips]
  )

  // 卡片模式渲染
  const renderCardMode = useCallback(
    () => (
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
        <AnimatePresence>
          {fileList.map((file) => (
            <CardFileItem key={file.uid} file={file} />
          ))}
        </AnimatePresence>

        {fileList.length < maxCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className='hover:border-primary/50 flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors'
            >
              <input {...getInputProps()} />
              <div className='flex flex-col items-center justify-center'>
                <IconUpload className='text-muted-foreground mb-2 h-6 w-6' />
                <span className='text-sm'>上传</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    ),
    [fileList, maxCount, getRootProps, getInputProps, CardFileItem]
  )

  // 列表模式渲染
  const renderListMode = useCallback(
    () => (
      <div className='flex flex-col space-y-2'>
        <AnimatePresence>
          {fileList.map((file) => (
            <ListFileItem key={file.uid} file={file} />
          ))}
        </AnimatePresence>
      </div>
    ),
    [fileList, ListFileItem]
  )

  return (
    <div className={cn('space-y-6', className)}>
      {listType === 'list' && fileList.length < maxCount && <UploadArea />}
      {listType === 'card'
        ? renderCardMode()
        : fileList.length > 0 && renderListMode()}
    </div>
  )
}
