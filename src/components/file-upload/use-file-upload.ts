/**
 * 文件上传 Hook
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
import { validateFile, createFileItem } from './file-upload-utils'

/**
 * 创建默认的七牛上传配置（使用统一的 API）
 */
export function createDefaultQiniuConfig(
  domain: string,
  region?: string,
  uploadUrl?: string
): QiniuUploadConfig {
  return {
    getToken: getQiniuUptoken,
    domain,
    region,
    uploadUrl,
  }
}

interface FileUploadState {
  items: FileUploadItem[]
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

  const [state, setState] = React.useState<FileUploadState>({
    items: [],
  })
  // 使用 ref 存储最新的 items
  const itemsRef = React.useRef(state.items)
  React.useEffect(() => {
    itemsRef.current = state.items
  }, [state.items])

  // 从 URL 提取文件名（如果 URL 中包含文件名）
  const getFileNameFromUrl = React.useCallback((url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const fileName = pathname.split('/').pop() || '已上传文件'
      // 解码 URL 编码的文件名
      return decodeURIComponent(fileName)
    } catch {
      // 如果不是有效的 URL，尝试从路径中提取
      const fileName = url.split('/').pop() || '已上传文件'
      return decodeURIComponent(fileName)
    }
  }, [])

  // 同步外部 value 到内部状态（支持回显和更新）
  React.useEffect(() => {
    const val = value !== undefined ? value : defaultValue
    const urls = Array.isArray(val) ? val : val ? [val] : []

    setState((prev) => {
      // 获取当前所有已上传成功的文件 URL
      const currentSuccessUrls = new Set(
        prev.items
          .filter((item) => item.status === 'success' && item.url)
          .map((item) => item.url!)
      )

      // 获取目标 URL 集合
      const targetUrls = new Set(urls)

      // 如果目标 URL 集合与当前一致，不需要更新
      if (
        targetUrls.size === currentSuccessUrls.size &&
        [...targetUrls].every((url) => currentSuccessUrls.has(url))
      ) {
        return prev
      }

      // 移除不在目标 URL 列表中的已上传项（保留上传中、待上传等状态的文件）
      const filteredItems = prev.items.filter(
        (item) =>
          !item.url || item.status !== 'success' || targetUrls.has(item.url)
      )

      // 添加新的 URL 项（不在当前列表中的）
      const existingUrls = new Set(
        filteredItems.filter((item) => item.url).map((item) => item.url!)
      )
      const newUrlItems: FileUploadItem[] = urls
        .filter((url) => !existingUrls.has(url))
        .map((url) => {
          const fileName = getFileNameFromUrl(url)
          const mimeType = getMimeTypeFromExtension(fileName)
          // 创建带有正确 MIME 类型的 File 对象
          const file = new File([], fileName, { type: mimeType })
          return {
            id: `url-${url}`,
            file,
            url,
            progress: 100,
            status: 'success' as const,
          }
        })

      return {
        ...prev,
        items: [...filteredItems, ...newUrlItems],
      }
    })
  }, [value, defaultValue, getFileNameFromUrl])

  // 更新外部值
  const updateValue = React.useCallback(
    (items: FileUploadItem[]) => {
      if (!onChange) return

      const urls = items
        .filter((item) => item.status === 'success' && item.url)
        .map((item) => item.url!)

      if (validation?.maxFiles === 1) {
        onChange(urls[0] || '')
      } else {
        onChange(urls)
      }
    },
    [onChange, validation?.maxFiles]
  )

  // 更新单个文件项的状态（辅助函数）
  const updateItemById = React.useCallback(
    (
      id: string,
      updater: (item: FileUploadItem) => Partial<FileUploadItem>
    ) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === id ? { ...i, ...updater(i) } : i
        ),
      }))
    },
    []
  )

  // 上传单个文件
  const uploadSingleFile = React.useCallback(
    async (item: FileUploadItem, uploadFn?: UploadFunction) => {
      if (!uploadFn) return

      updateItemById(item.id, () => ({
        status: 'uploading',
        progress: 0,
        isFromUpload: true, // 标记为上传操作
      }))
      onUploadStart?.(item.file)

      try {
        const url = await uploadFn(item.file, {
          onProgress: (progress) => {
            updateItemById(item.id, () => ({ progress }))
            onUploadProgress?.(item.file, progress)
          },
        })

        setState((prev) => {
          const updated = prev.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  url,
                  progress: 100,
                  status: 'success' as const,
                  isFromUpload: true, // 保持上传标记
                }
              : i
          )
          updateValue(updated)
          return { ...prev, items: updated }
        })

        onUploadSuccess?.(item.file, url)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        updateItemById(item.id, () => ({
          status: 'error' as const,
          error: errorMessage,
          isFromUpload: true, // 保持上传标记（即使是失败）
        }))
        toast.error(`文件上传失败: ${item.file.name}`, {
          description: errorMessage,
        })
        onUploadError?.(item.file, error as Error)
      }
    },
    [
      updateItemById,
      onUploadStart,
      onUploadProgress,
      onUploadSuccess,
      onUploadError,
      updateValue,
    ]
  )

  // 拒绝文件并显示提示
  const rejectFile = React.useCallback(
    (file: File, reason: string) => {
      toast.error(`文件被拒绝: ${file.name}`, {
        description: reason,
      })
      onFileReject?.(file, reason)
    },
    [onFileReject]
  )

  // 验证并添加文件
  const addFiles = React.useCallback(
    async (files: File[]) => {
      if (disabled) return

      const rule: FileUploadValidationRule = validation || {}
      const acceptedFiles: File[] = []
      const currentItems = itemsRef.current

      // 检查文件数量限制
      if (rule.maxFiles) {
        // 单文件模式（maxFiles === 1）
        if (rule.maxFiles === 1) {
          if (files.length > 1) {
            files.forEach((file) =>
              rejectFile(file, '单文件模式下只能上传一个文件')
            )
            files = []
          } else if (currentItems.length > 0 && files.length > 0) {
            files.forEach((file) =>
              rejectFile(file, '单文件模式下只能有一个文件，请先删除现有文件')
            )
            files = []
          }
        } else {
          // 多文件模式：检查剩余位置
          const remaining = rule.maxFiles - currentItems.length
          if (remaining <= 0) {
            files.forEach((file) =>
              rejectFile(file, `最多允许上传 ${rule.maxFiles} 个文件`)
            )
            files = []
          } else if (files.length > remaining) {
            files
              .slice(remaining)
              .forEach((file) =>
                rejectFile(file, `最多允许上传 ${rule.maxFiles} 个文件`)
              )
            files = files.slice(0, remaining)
          }
        }
      }

      // 验证每个文件
      for (const file of files) {
        const error = validateFile(file, rule)
        if (error) {
          toast.error(`文件验证失败: ${file.name}`, {
            description: error,
          })
          onFileReject?.(file, error)
        } else {
          acceptedFiles.push(file)
        }
      }

      // 添加接受的文件
      if (acceptedFiles.length > 0) {
        const newItems = acceptedFiles.map(createFileItem)
        setState((prev) => {
          const items =
            validation?.maxFiles === 1
              ? [...newItems]
              : [...prev.items, ...newItems]
          return { ...prev, items }
        })

        // 触发接受回调
        for (const file of acceptedFiles) {
          onFileAccept?.(file)
        }

        // 如果有上传函数，自动上传
        if (upload) {
          for (const item of newItems) {
            uploadSingleFile(item, upload)
          }
        }
      }
    },
    [
      disabled,
      validation,
      onFileAccept,
      onFileReject,
      rejectFile,
      upload,
      uploadSingleFile,
    ]
  )

  // 删除文件
  const removeFile = React.useCallback(
    (id: string) => {
      setState((prev) => {
        const updated = prev.items.filter((item) => item.id !== id)
        updateValue(updated)
        return { ...prev, items: updated }
      })
    },
    [updateValue]
  )

  // 清空所有文件
  const clearFiles = React.useCallback(() => {
    setState({ items: [] })
    updateValue([])
  }, [updateValue])

  // 手动触发上传
  const triggerUpload = React.useCallback(
    (id?: string) => {
      if (!upload) return

      setState((prev) => {
        const itemsToUpload = id
          ? prev.items.filter((item) => item.id === id)
          : prev.items.filter((item) => item.status === 'idle')

        for (const item of itemsToUpload) {
          uploadSingleFile(item, upload)
        }
        return prev
      })
    },
    [upload, uploadSingleFile]
  )

  // 计算是否达到文件数量上限
  const isMaxFilesReached = React.useMemo(() => {
    const currentCount = state.items.length

    // 单文件模式（maxFiles === 1）
    if (validation?.maxFiles === 1) {
      return currentCount > 0
    }

    // 多文件模式：检查 maxFiles 限制
    if (validation?.maxFiles) {
      return currentCount >= validation.maxFiles
    }

    return false
  }, [state.items.length, validation?.maxFiles])

  // 合并外部 disabled 和内部 isMaxFilesReached 状态
  const isDisabled = disabled || isMaxFilesReached

  return {
    items: state.items,
    addFiles,
    removeFile,
    clearFiles,
    triggerUpload,
    disabled: isDisabled,
  }
}
