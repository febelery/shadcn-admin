/**
 * 文件上传 Hook
 * 包含状态管理、上传控制和文件验证逻辑
 */
import * as React from 'react'
import type {
  FileUploadProps,
  FileUploadItem,
  FileUploadValidationRule,
  UploadFunction,
  QiniuUploadConfig,
} from '@/types/file-upload'
import { toast } from 'sonner'
import { getQiniuUptoken } from '@/api/qiniu'
import { getMimeTypeFromExtension } from '@/lib/utils'
import {
  validateFile,
  createFileItem,
  getFileNameFromUrl,
} from './file-upload-utils'

interface UseFileStateProps {
  value?: string | string[]
  defaultValue?: string | string[]
  onChange?: (value: string | string[]) => void
  maxFiles?: number
}

interface UseUploadControllerProps {
  uploadFn?: UploadFunction
  onUploadStart?: (file: File) => void
  onUploadProgress?: (file: File, progress: number) => void
  onUploadSuccess?: (file: File, url: string) => void
  onUploadError?: (file: File, error: Error) => void
}

interface UseFileValidationProps {
  disabled?: boolean
  validation?: FileUploadValidationRule
  onFileAccept?: (file: File) => void
  onFileReject?: (file: File, reason: string) => void
}

/**
 * 创建默认的七牛上传配置
 */
export function createDefaultQiniuConfig(
  region?: string,
  uploadUrl?: string
): QiniuUploadConfig {
  return {
    getToken: getQiniuUptoken,
    region,
    uploadUrl,
  }
}

/**
 * Hook: 管理文件列表状态
 * 处理外部 value 的同步和内部状态的更新
 */
function useFileState({
  value,
  defaultValue,
  onChange,
  maxFiles,
}: UseFileStateProps) {
  const [items, setItems] = React.useState<FileUploadItem[]>([])

  // 使用 ref 避免闭包问题，同时用于比较变化
  const itemsRef = React.useRef(items)
  React.useEffect(() => {
    itemsRef.current = items
  }, [items])

  // 1. Sync Props -> State (External Update)
  React.useEffect(() => {
    const val = value !== undefined ? value : defaultValue
    const urls = Array.isArray(val) ? val : val ? [val] : []
    const targetUrls = new Set(urls)

    setItems((prev) => {
      const currentSuccessUrls = new Set(
        prev
          .filter((item) => item.status === 'success' && item.url)
          .map((item) => item.url!)
      )

      // 如果 URL 集合一致，不更新（避免重渲染和循环）
      if (
        targetUrls.size === currentSuccessUrls.size &&
        [...targetUrls].every((url) => currentSuccessUrls.has(url))
      ) {
        return prev
      }

      // 保留正在上传或失败的项，移除不在新列表中的成功项
      const keptItems = prev.filter(
        (item) =>
          item.status !== 'success' || (item.url && targetUrls.has(item.url))
      )

      // 添加新的 URL 项
      const existingUrls = new Set(
        keptItems.filter((item) => item.url).map((item) => item.url!)
      )

      const newItems = urls
        .filter((url) => !existingUrls.has(url))
        .map((url) => {
          const fileName = getFileNameFromUrl(url)
          const mimeType = getMimeTypeFromExtension(fileName)
          const file = new File([], fileName, { type: mimeType })
          return {
            id: `url-${url}`,
            file,
            url,
            progress: 100,
            status: 'success' as const,
          }
        })

      return [...keptItems, ...newItems]
    })
  }, [value, defaultValue])

  // 2. Sync State -> Props (Internal Update)
  const prevSuccessUrlsRef = React.useRef<string[]>([])

  const notifyChange = React.useCallback(
    (currentItems: FileUploadItem[]) => {
      if (!onChange) return

      const successUrls = currentItems
        .filter((item) => item.status === 'success' && item.url)
        .map((item) => item.url!)
        .sort()

      const prevUrls = prevSuccessUrlsRef.current.sort()

      // 只有当成功上传的文件列表发生变化时才触发 onChange
      if (
        successUrls.length !== prevUrls.length ||
        !successUrls.every((url, index) => url === prevUrls[index])
      ) {
        prevSuccessUrlsRef.current = successUrls
        if (maxFiles === 1) {
          onChange(successUrls[0] || '')
        } else {
          onChange(successUrls)
        }
      }
    },
    [onChange, maxFiles]
  )

  // 监听 items 变化并通知外部
  React.useEffect(() => {
    notifyChange(items)
  }, [items, notifyChange])

  // Actions
  const updateItem = React.useCallback(
    (
      id: string,
      updater: (item: FileUploadItem) => Partial<FileUploadItem>
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updater(item) } : item
        )
      )
    },
    []
  )

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearFiles = React.useCallback(() => {
    setItems([])
  }, [])

  const addItems = React.useCallback((newItems: FileUploadItem[]) => {
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const setSingleItem = React.useCallback((newItem: FileUploadItem) => {
    setItems([newItem])
  }, [])

  return {
    items,
    itemsRef,
    updateItem,
    removeItem,
    clearFiles,
    addItems,
    setSingleItem,
  }
}

/**
 * Hook: 控制上传流程
 */
function useUploadController({
  uploadFn,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
}: UseUploadControllerProps) {
  const uploadSingleFile = React.useCallback(
    async (
      item: FileUploadItem,
      updateItem: (
        id: string,
        updater: (item: FileUploadItem) => Partial<FileUploadItem>
      ) => void
    ) => {
      if (!uploadFn) return

      updateItem(item.id, () => ({
        status: 'uploading',
        progress: 0,
        isFromUpload: true,
      }))
      onUploadStart?.(item.file)

      try {
        const url = await uploadFn(item.file, {
          onProgress: (progress) => {
            updateItem(item.id, () => ({ progress }))
            onUploadProgress?.(item.file, progress)
          },
        })

        updateItem(item.id, () => ({
          url,
          progress: 100,
          status: 'success',
          isFromUpload: true,
        }))
        onUploadSuccess?.(item.file, url)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        updateItem(item.id, () => ({
          status: 'error',
          error: errorMessage,
          isFromUpload: true,
        }))
        toast.error(`文件上传失败: ${item.file.name}`, {
          description: errorMessage,
        })
        onUploadError?.(item.file, error as Error)
      }
    },
    [uploadFn, onUploadStart, onUploadProgress, onUploadSuccess, onUploadError]
  )

  return { uploadSingleFile }
}

/**
 * Hook: 处理文件验证和添加
 */
function useFileValidation({
  disabled,
  validation,
  onFileAccept,
  onFileReject,
}: UseFileValidationProps) {
  const validateAndGetFiles = React.useCallback(
    (files: File[], currentCount: number): File[] => {
      if (disabled) return []

      const rule = validation || {}
      const acceptedFiles: File[] = []

      // 1. 数量限制检查
      if (rule.maxFiles) {
        if (rule.maxFiles === 1) {
          // 单文件模式：如果已有文件，提示需先删除（或者由调用方处理替换逻辑）
          if (currentCount > 0 && files.length > 0) {
            // 这里我们选择允许替换，所以不报错，直接返回新文件
            // 但如果是一次性拖入多个，则报错
            if (files.length > 1) {
              files.forEach((f) =>
                toast.error(`单文件模式下只能上传一个文件: ${f.name}`)
              )
              return []
            }
          }
        } else {
          // 多文件模式
          const remaining = rule.maxFiles - currentCount
          if (remaining <= 0) {
            files.forEach(() =>
              toast.error(`最多允许上传 ${rule.maxFiles} 个文件`)
            )
            return []
          }
          if (files.length > remaining) {
            files
              .slice(remaining)
              .forEach((f) => toast.error(`超出文件数量限制: ${f.name}`))
            files = files.slice(0, remaining)
          }
        }
      }

      // 2. 文件属性验证
      for (const file of files) {
        const error = validateFile(file, rule)
        if (error) {
          toast.error(`文件验证失败: ${file.name}`, { description: error })
          onFileReject?.(file, error)
        } else {
          acceptedFiles.push(file)
          onFileAccept?.(file)
        }
      }

      return acceptedFiles
    },
    [disabled, validation, onFileAccept, onFileReject]
  )

  return { validateAndGetFiles }
}

export function useFileUpload(
  props: Omit<FileUploadProps, 'upload'> & { upload?: UploadFunction }
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

  // 1. State Management
  const {
    items,
    itemsRef,
    updateItem,
    removeItem,
    clearFiles,
    addItems,
    setSingleItem,
  } = useFileState({
    value,
    defaultValue,
    onChange,
    maxFiles: validation?.maxFiles,
  })

  // 2. Upload Logic
  const { uploadSingleFile } = useUploadController({
    uploadFn: upload,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
  })

  // 3. Validation Logic
  const { validateAndGetFiles } = useFileValidation({
    disabled,
    validation,
    onFileAccept,
    onFileReject,
  })

  // 4. Public Actions
  const addFiles = React.useCallback(
    async (files: File[]) => {
      const isSingleMode = validation?.maxFiles === 1
      const currentCount = isSingleMode ? 0 : itemsRef.current.length // 单文件模式下忽略当前数量，直接替换

      const acceptedFiles = validateAndGetFiles(files, currentCount)
      if (acceptedFiles.length === 0) return

      const newItems = acceptedFiles.map(createFileItem)

      if (isSingleMode) {
        setSingleItem(newItems[0])
      } else {
        addItems(newItems)
      }

      // 自动上传
      if (upload) {
        for (const item of newItems) {
          // 注意：这里使用闭包中的 updateItem，它会更新最新的 state
          uploadSingleFile(item, updateItem)
        }
      }
    },
    [
      validation?.maxFiles,
      itemsRef,
      validateAndGetFiles,
      setSingleItem,
      addItems,
      upload,
      uploadSingleFile,
      updateItem,
    ]
  )

  const triggerUpload = React.useCallback(
    (id?: string) => {
      if (!upload) return
      const currentItems = itemsRef.current
      const itemsToUpload = id
        ? currentItems.filter((item) => item.id === id)
        : currentItems.filter((item) => item.status === 'idle')

      for (const item of itemsToUpload) {
        uploadSingleFile(item, updateItem)
      }
    },
    [upload, itemsRef, uploadSingleFile, updateItem]
  )

  // Derived State
  const isMaxFilesReached = React.useMemo(() => {
    if (validation?.maxFiles === 1) return items.length > 0
    if (validation?.maxFiles) return items.length >= validation.maxFiles
    return false
  }, [items.length, validation?.maxFiles])

  return {
    items,
    addFiles,
    removeFile: removeItem,
    clearFiles,
    triggerUpload,
    disabled: disabled || isMaxFilesReached,
  }
}
