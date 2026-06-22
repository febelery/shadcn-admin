import * as React from 'react'
import type { Editor } from '@tiptap/react'
import {
  uploadImageWithProgress,
  createBlobPreview,
  revokeBlobPreview,
} from '../image-upload'

/** 单张图片的上传状态 */
export interface UploadState {
  /** 上传进度 0-100 */
  progress: number
  /** 是否处于上传错误状态 */
  error: boolean
  /** 错误信息描述 */
  errorMsg?: string
  /** blob 预览 URL */
  blobUrl: string
}

/**
 * 专为富文本编辑器设计的图片上传生命周期管理 Hook
 * 实现了状态管理、DOM 状态渲染、校验以及与 Tiptap 文档同步的完全解耦
 */
export function useImageUpload(
  editor: Editor | null,
  uploadImageProp?: (file: File) => Promise<string>
) {
  const [uploadMap, setUploadMap] = React.useState<Map<string, UploadState>>(
    new Map()
  )

  // 辅助：更新单个图片 key 的上传状态
  const patchUpload = React.useCallback(
    (id: string, patch: Partial<UploadState>) => {
      setUploadMap((prev) => {
        const next = new Map(prev)
        const existing = next.get(id)
        if (existing) next.set(id, { ...existing, ...patch })
        return next
      })
    },
    []
  )

  // 核心：上传单个图片文件
  const uploadFile = React.useCallback(
    async (file: File) => {
      if (!editor || editor.isDestroyed) return

      // 临时生成一个唯一的 blobUrl，用于初始渲染定位
      let blobUrl = ''

      try {
        // 1. 基础校验：只允许图片类型
        if (!file.type.startsWith('image/')) {
          throw new Error('只允许上传图片文件')
        }

        // 文件大小限制 10MB
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('图片大小不能超过 10MB')
        }

        blobUrl = createBlobPreview(file)

        // 2. 立即将预览图以 blob 协议插入编辑器中，使用户感知流畅
        editor.chain().focus().setImage({ src: blobUrl }).run()

        // 3. 将其记入上传 Map 驱动样式同步
        setUploadMap((prev) => {
          const next = new Map(prev)
          next.set(blobUrl, { progress: 0, error: false, blobUrl })
          return next
        })

        // 4. 开始异步执行实际上传
        let finalUrl: string
        if (uploadImageProp) {
          finalUrl = await uploadImageProp(file)
        } else {
          finalUrl = await uploadImageWithProgress(file, {
            onProgress: (p) => patchUpload(blobUrl, { progress: p }),
          })
        }

        // 5. ✅ 成功：在 Tiptap 文档树中定位对应的 node 并替换为真实 URL
        const { state, view } = editor
        let targetPos: number | null = null

        state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === blobUrl) {
            targetPos = pos
            return false
          }
        })

        if (targetPos !== null) {
          const { tr } = state
          tr.setNodeMarkup(targetPos, undefined, {
            ...state.doc.nodeAt(targetPos)!.attrs,
            src: finalUrl,
          })
          view.dispatch(tr)
        }

        // 6. 释放内存并清理状态
        revokeBlobPreview(blobUrl)
        setUploadMap((prev) => {
          const next = new Map(prev)
          next.delete(blobUrl)
          return next
        })
      } catch (err: any) {
        // 7. ❌ 失败：如果在生成 blob 之前就校验失败，不需要同步 DOM 样式
        if (blobUrl) {
          const errorMsg =
            err instanceof Error ? err.message : '上传失败，请重试'
          patchUpload(blobUrl, { error: true, errorMsg, progress: 0 })
        } else {
          // TODO(security): 使用项目 UI 规范提示，不采用原生 alert()
          console.error('[图片校验/上传失败]', err)
        }
      }
    },
    [editor, uploadImageProp, patchUpload]
  )

  // 通过 update 事件在 ProseMirror 完成 DOM 渲染后同步图片上传状态样式
  // 使用 update 而非 transaction：update 在 DOM 渲染后触发，避免样式被 PM 覆盖
  // docChanged 守卫：跳过选区变化等非内容变更事件，减少不必要的 DOM 操作
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return

    const syncStyles = () => {
      const editorDom = editor.view.dom

      editorDom.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        const state = uploadMap.get(img.src)

        if (!state) {
          img.removeAttribute('title')
          img.style.removeProperty('outline')
          img.style.removeProperty('box-shadow')
          img.style.removeProperty('opacity')
          img.style.removeProperty('filter')
          return
        }

        if (state.error) {
          img.title = state.errorMsg || '上传失败，请重试'
          img.style.outline = '3px solid #ef4444'
          img.style.boxShadow = '0 0 0 6px rgba(239,68,68,0.2)'
          img.style.opacity = '0.7'
          img.style.filter = 'grayscale(20%)'
        } else {
          img.removeAttribute('title')
          img.style.outline = '2px solid rgba(59,130,246,0.75)'
          img.style.boxShadow = 'none'
          img.style.opacity = '1'
          img.style.filter = 'none'
        }
      })
    }

    // 首次载入 / uploadMap 变化时同步
    syncStyles()

    // 在 PM 完成 DOM 渲染后重绘样式，防止 ProseMirror 重构 DOM 导致样式丢失
    const onUpdate = ({
      transaction,
    }: {
      transaction: { docChanged: boolean }
    }) => {
      if (transaction.docChanged) syncStyles()
    }

    editor.on('update', onUpdate)

    return () => {
      editor.off('update', onUpdate)
    }
  }, [uploadMap, editor])

  return {
    uploadMap,
    uploadFile,
  }
}
