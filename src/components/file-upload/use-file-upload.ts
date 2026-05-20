import * as React from 'react'
import { toast } from 'sonner'
import { createPlaceholderFileFromUrl, validateFile } from '@/lib/files'
import type {
  FileItem,
  FileValidation,
  FileUploadProps,
  UploadFn,
  CropSource,
} from './types'

function urlToItem(url: string): FileItem {
  return {
    id: `echo:${url}`,
    file: createPlaceholderFileFromUrl(url),
    url,
    progress: 100,
    status: 'success',
  }
}

export function useFileUpload(
  props: Omit<FileUploadProps, 'upload'> & { upload?: UploadFn }
) {
  const {
    value,
    defaultValue,
    onChange,
    validation,
    upload,
    disabled = false,
    onFileAccept,
    onFileReject,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
  } = props

  // defaultValue 仅作非受控模式的初始值，不参与后续 effect 同步
  const [items, setItems] = React.useState<FileItem[]>(() => {
    const initial = defaultValue
    const urls = Array.isArray(initial) ? initial : initial ? [initial] : []
    return urls.map(urlToItem)
  })

  // 避免 upload 回调中的 stale closure 问题
  const itemsRef = React.useRef(items)
  React.useLayoutEffect(() => {
    itemsRef.current = items
  }, [items])

  React.useEffect(() => {
    if (value === undefined) return // 非受控模式，跳过

    const urls = Array.isArray(value) ? value : value ? [value] : []
    const targetSet = new Set(urls)

    setItems((prev) => {
      const currentSuccessUrls = new Set(
        prev.filter((i) => i.status === 'success' && i.url).map((i) => i.url!)
      )

      // URL 集合无变化，提前退出，避免触发重渲染循环
      if (
        targetSet.size === currentSuccessUrls.size &&
        [...targetSet].every((u) => currentSuccessUrls.has(u))
      ) {
        return prev
      }

      // 保留上传中 / 错误的项；丢弃不在新值中的已完成项
      const kept = prev.filter(
        (i) => i.status !== 'success' || (i.url && targetSet.has(i.url))
      )
      const existingUrls = new Set(kept.filter((i) => i.url).map((i) => i.url!))
      const added = urls.filter((u) => !existingUrls.has(u)).map(urlToItem)

      return [...kept, ...added]
    })
  }, [value])

  const lastNotifiedRef = React.useRef<string[]>([])

  React.useEffect(() => {
    if (!onChange) return

    // 重要：用展开 + sort 生成新数组，不原地修改 ref 存储的值
    const current = items
      .filter((i) => i.status === 'success' && i.url)
      .map((i) => i.url!)
      .sort()

    const last = lastNotifiedRef.current

    if (
      current.length === last.length &&
      current.every((u, idx) => u === last[idx])
    ) {
      return
    }

    lastNotifiedRef.current = current
    // maxFiles === 1 时返回 string，其余返回 string[]
    onChange(validation?.maxFiles === 1 ? (current[0] ?? '') : current)
  }, [items, onChange, validation?.maxFiles])

  const patchItem = React.useCallback(
    (
      id: string,
      patch: Partial<FileItem> | ((item: FileItem) => Partial<FileItem>)
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...(typeof patch === 'function' ? patch(item) : patch),
              }
            : item
        )
      )
    },
    []
  )

  const removeFile = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearFiles = React.useCallback(() => setItems([]), [])

  const uploadSingle = React.useCallback(
    async (item: FileItem) => {
      if (!upload) return

      patchItem(item.id, {
        status: 'uploading',
        progress: 0,
        isNewUpload: true,
      })
      onUploadStart?.(item.file)

      try {
        const url = await upload(item.file, {
          onProgress: (p) => {
            patchItem(item.id, { progress: p })
            onUploadProgress?.(item.file, p)
          },
        })
        patchItem(item.id, {
          url,
          progress: 100,
          status: 'success',
          isNewUpload: true,
        })
        onUploadSuccess?.(item.file, url)
      } catch (err) {
        const message = err instanceof Error ? err.message : '上传失败'
        patchItem(item.id, {
          status: 'error',
          error: message,
          isNewUpload: true,
        })
        toast.error(item.file.name, { description: message })
        onUploadError?.(item.file, err as Error)
      }
    },
    [
      upload,
      patchItem,
      onUploadStart,
      onUploadProgress,
      onUploadSuccess,
      onUploadError,
    ]
  )

  const validate = React.useCallback(
    (incoming: File[]): File[] => {
      if (disabled) return []

      const rule: FileValidation = validation ?? {}
      const isSingle = rule.maxFiles === 1

      // 数量检查
      let candidates = incoming
      if (rule.maxFiles) {
        if (isSingle) {
          if (incoming.length > 1) {
            toast.error('单文件模式：一次只能上传一个文件')
            return []
          }
          // 单文件模式：允许替换，不检查 currentCount
        } else {
          // 计算除错误外的所有项目（上传中、已成功、待上传）
          const currentCount = itemsRef.current.length
          const remaining = rule.maxFiles - currentCount
          if (remaining <= 0) {
            toast.error(`已达上限，最多可上传 ${rule.maxFiles} 个文件`)
            return []
          }
          candidates = incoming.slice(0, remaining)
        }
      }

      // 逐个验证属性
      const accepted: File[] = []
      for (const file of candidates) {
        const error = validateFile(file, rule)
        if (error) {
          toast.error(file.name, { description: error })
          onFileReject?.(file, error)
        } else {
          accepted.push(file)
          onFileAccept?.(file)
        }
      }
      return accepted
    },
    [disabled, validation, onFileAccept, onFileReject]
  )

  const [isPending, startTransition] = React.useTransition()

  const [cropSource, setCropSource] = React.useState<CropSource | null>(null)
  const [cropQueue, setCropQueue] = React.useState<CropSource[]>([])

  const addFilesInternal = React.useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return

      const isSingle = validation?.maxFiles === 1
      const newItems: FileItem[] = accepted.map((file) => ({
        id: `new:${crypto.randomUUID()}`,
        file,
        progress: 0,
        status: 'idle' as const,
      }))

      // UI 更新标记为 transition（可中断，不阻塞用户交互）
      startTransition(() => {
        if (isSingle) {
          setItems(newItems.slice(0, 1))
        } else {
          setItems((prev) => [...prev, ...newItems])
        }
      })

      // 上传在 transition 外触发，保证立即启动，不被 React 延迟
      if (upload) {
        for (const item of newItems) {
          uploadSingle(item)
        }
      }
    },
    [validation?.maxFiles, upload, uploadSingle]
  )

  const addFiles = React.useCallback(
    (files: File[]) => {
      const accepted = validate(files)
      if (!accepted.length) return

      // 图片裁剪拦截逻辑：解构 maxFiles 限制，只要开启了 crop 且是图片就进入队列
      if (props.crop) {
        const images = accepted.filter((f) => f.type.startsWith('image/'))
        const rest = accepted.filter((f) => !f.type.startsWith('image/'))

        // 非图片直接添加
        if (rest.length > 0) {
          addFilesInternal(rest)
        }

        // 图片进入裁剪队列
        if (images.length > 0) {
          // 新文件 → 构造 { type: 'file' } 来源
          const tasks: CropSource[] = images.map((f) => ({
            type: 'file',
            file: f,
          }))
          if (cropSource) {
            setCropQueue((prev) => [...prev, ...tasks])
          } else {
            const [first, ...remaining] = tasks
            setCropQueue(remaining)
            setCropSource(first)
          }
          return
        }
      }

      addFilesInternal(accepted)
    },
    [validate, props.crop, addFilesInternal, cropSource]
  )

  const [previewId, setPreviewId] = React.useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

  const openPreview = React.useCallback((id: string) => {
    setPreviewId(id)
    setIsPreviewOpen(true)
  }, [])

  const closePreview = React.useCallback(() => {
    setIsPreviewOpen(false)
    // 等关闭动画结束后再清空 id，避免预览内容提前消失
    setTimeout(() => setPreviewId(null), 250)
  }, [])

  const previewableItems = React.useMemo(
    () => items.filter((i) => i.file || i.url),
    [items]
  )

  const previewIndex = React.useMemo(
    () =>
      previewId ? previewableItems.findIndex((i) => i.id === previewId) : -1,
    [previewId, previewableItems]
  )

  const goNext = React.useCallback(() => {
    const next = previewableItems[previewIndex + 1]
    if (next) setPreviewId(next.id)
  }, [previewIndex, previewableItems])

  const goPrev = React.useCallback(() => {
    const prev = previewableItems[previewIndex - 1]
    if (prev) setPreviewId(prev.id)
  }, [previewIndex, previewableItems])

  const isAtMax = React.useMemo(() => {
    const max = validation?.maxFiles
    if (!max) return false
    const currentCount = items.length
    return currentCount >= max
  }, [items, validation?.maxFiles])

  return {
    items,
    addFiles,
    removeFile,
    clearFiles,
    isPending,
    /** 外部 disabled 或已达最大数量时为 true */
    isDisabled: disabled || isAtMax,
    isAtMax,
    // 预览
    previewItem: previewId ? items.find((i) => i.id === previewId) : undefined,
    isPreviewOpen,
    openPreview,
    closePreview,
    hasPrev: previewIndex > 0,
    hasNext: previewIndex >= 0 && previewIndex < previewableItems.length - 1,
    goNext,
    goPrev,
    // 裁剪相关
    cropSource,
    setCropSource,
    completeCrop: (file: File) => {
      addFilesInternal([file])
      if (cropQueue.length > 0) {
        const [next, ...remaining] = cropQueue
        setCropQueue(remaining)
        setCropSource(next)
      } else {
        setCropSource(null)
      }
    },
    cancelCrop: () => {
      if (cropQueue.length > 0) {
        const [next, ...remaining] = cropQueue
        setCropQueue(remaining)
        setCropSource(next)
      } else {
        setCropSource(null)
      }
    },
  }
}

export type UseFileUploadReturn = ReturnType<typeof useFileUpload>
