import {
  HTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
  useState,
} from 'react'
import { AiEditor, AiEditorOptions } from 'aieditor'
import 'aieditor/dist/style.css'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

export type EditorVariant = 'basic' | 'standard' | 'full'

export interface EditorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  placeholder?: string
  defaultValue?: string
  value?: string
  onChange?: (val: string) => void
  options?: Omit<AiEditorOptions, 'element'>
  variant?: EditorVariant
  /**
   * 自定义图片上传函数
   * 返回 Promise<{ src: string }>
   */
  onUpload?: (file: File) => Promise<{ src: string; [key: string]: any }>
  disabled?: boolean
}

const TOOLBAR_VARIANTS: Record<EditorVariant, any[]> = {
  basic: [
    'undo',
    'redo',
    '|',
    'font-size',
    'bold',
    'italic',
    'underline',
    'strike',
    '|',
    'font-color',
    '|',
    'align',
    '|',
    'link',
  ],
  standard: [
    'undo',
    'redo',
    '|',
    'heading',
    'font-size',
    '|',
    'bold',
    'italic',
    'underline',
    'strike',
    'link',
    'code',
    '|',
    'font-color',
    'highlight',
    '|',
    'align',
    'line-height',
    '|',
    'bullet-list',
    'ordered-list',
    '|',
    'image',
    'video',
    'quote',
    'code-block',
    'table',
    '|',
    'fullscreen',
  ],
  full: [
    'undo',
    'redo',
    'brush',
    'eraser',
    '|',
    'heading',
    'font-family',
    'font-size',
    '|',
    'bold',
    'italic',
    'underline',
    'strike',
    'link',
    'code',
    'subscript',
    'superscript',
    'hr',
    'todo',
    'emoji',
    '|',
    'highlight',
    'font-color',
    '|',
    'align',
    'line-height',
    '|',
    'bullet-list',
    'ordered-list',
    'indent-decrease',
    'indent-increase',
    'break',
    '|',
    'image',
    'video',
    'quote',
    'code-block',
    'table',
    '|',
    'source-code',
    'fullscreen',
    'printer',
  ],
}

/**
 * 富文本编辑器 (AiEditor 封装)
 */
export const Editor = forwardRef<AiEditor | null, EditorProps>(function Editor(
  {
    placeholder,
    defaultValue,
    value,
    onChange,
    options,
    variant = 'standard',
    className,
    onUpload,
    disabled,
    ...props
  },
  ref
) {
  const divRef = useRef<HTMLDivElement>(null)
  const aiEditorRef = useRef<AiEditor | null>(null)
  const { theme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  // 暴露 AiEditor 实例
  useImperativeHandle(ref, () => aiEditorRef.current as AiEditor)

  // 初始化/销毁编辑器
  useEffect(() => {
    if (!divRef.current) return

    // 销毁旧实例
    if (aiEditorRef.current) {
      aiEditorRef.current.destroy()
      aiEditorRef.current = null
    }

    const editor = new AiEditor({
      element: divRef.current,
      placeholder,
      content: value || defaultValue || '',
      theme: theme as any,
      editable: !disabled,
      toolbarKeys: TOOLBAR_VARIANTS[variant],
      onChange: (ed) => {
        const html = ed.getHtml()
        // 避免循环更新
        if (onChange && html !== value) {
          onChange(html)
        }
      },
      // 上传适配器
      uploader: onUpload
        ? async (file: File) => {
            try {
              const result = await onUpload(file)
              return {
                errorCode: 0,
                data: result,
              }
            } catch (error) {
              console.error('Upload failed:', error)
              return {
                errorCode: 1,
                msg: error instanceof Error ? error.message : '上传失败',
              }
            }
          }
        : undefined,
      ...options,
    })

    aiEditorRef.current = editor
    setIsMounted(true)

    return () => {
      editor.destroy()
      aiEditorRef.current = null
      setIsMounted(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]) // 当 variant 变化时重新初始化

  // 监听 value 变化 (外部控制)
  useEffect(() => {
    if (
      aiEditorRef.current &&
      isMounted &&
      value !== undefined &&
      value !== aiEditorRef.current.getHtml()
    ) {
      aiEditorRef.current.setContent(value)
    }
  }, [value, isMounted])

  // 监听主题变化
  useEffect(() => {
    if (aiEditorRef.current && isMounted) {
      aiEditorRef.current.changeTheme(theme as any)
    }
  }, [theme, isMounted])

  // 监听 disabled 变化
  useEffect(() => {
    if (aiEditorRef.current && isMounted) {
      if (disabled) {
        aiEditorRef.current.setEditable(false)
      } else {
        aiEditorRef.current.setEditable(true)
      }
    }
  }, [disabled, isMounted])

  return (
    <div
      ref={divRef}
      className={cn(
        'aie-container-wrapper bg-background rounded-md border',
        'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      <style>{`
        .aie-container-wrapper .aie-container {
          border: none !important;
          background: transparent !important;
        }
        .aie-container-wrapper .aie-toolbar {
          border-bottom: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--muted) / 0.3) !important;
        }
        .aie-container-wrapper .aie-content {
          background: transparent !important;
          color: hsl(var(--foreground)) !important;
        }
        /* 隐藏 footer */
        aie-footer {
          display: none !important;
        }
        /* 修复暗色模式下的工具栏图标颜色 */
        .dark .aie-icon svg {
          fill: hsl(var(--foreground)) !important;
        }
      `}</style>
    </div>
  )
})
