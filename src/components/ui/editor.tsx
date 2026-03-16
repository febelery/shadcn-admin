import { HTMLAttributes, useEffect, useRef } from 'react'
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
  onUpload?: (file: File) => Promise<{ src: string; [key: string]: any }>
  disabled?: boolean
  ref?: React.Ref<AiEditor | null>
}

const TOOLBAR_VARIANTS: Record<EditorVariant, string[]> = {
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

const EDITOR_STYLES = `
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
  aie-footer { display: none !important; }
  .dark .aie-icon svg { fill: hsl(var(--foreground)) !important; }
`

/**
 * 富文本编辑器 (AiEditor 封装)
 */
export function Editor({
  placeholder,
  defaultValue,
  value,
  onChange,
  options,
  variant = 'standard',
  className,
  onUpload,
  disabled,
  ref,
  ...props
}: EditorProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const aiEditorRef = useRef<AiEditor | null>(null)
  const { theme } = useTheme()

  // 初始化/销毁编辑器，variant 变化时重新初始化
  useEffect(() => {
    if (!divRef.current) return

    const el = divRef.current
    const isComposing = { current: false }

    const onCompositionStart = () => {
      isComposing.current = true
    }

    const onCompositionEnd = () => {
      isComposing.current = false
      // 组合输入结束后手动触发一次 onChange
      const html = aiEditorRef.current?.getHtml() ?? ''
      if (onChange && html !== value) onChange(html)
    }

    el.addEventListener('compositionstart', onCompositionStart)
    el.addEventListener('compositionend', onCompositionEnd)

    const editor = new AiEditor({
      element: el,
      placeholder,
      content: value ?? defaultValue ?? '',
      theme: theme as any,
      editable: !disabled,
      toolbarKeys: TOOLBAR_VARIANTS[variant],
      onChange: (ed) => {
        // 拼音组合阶段不触发，避免候选词弹出时校验
        if (isComposing.current) return
        const html = ed.getHtml()
        if (onChange && html !== value) onChange(html)
      },
      uploader: onUpload
        ? async (file: File) => {
            try {
              return { errorCode: 0, data: await onUpload(file) }
            } catch (error) {
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

    if (typeof ref === 'function') ref(null)
    else if (ref) (ref as React.RefObject<AiEditor | null>).current = null

    return () => {
      el.removeEventListener('compositionstart', onCompositionStart)
      el.removeEventListener('compositionend', onCompositionEnd)
      editor.destroy()
      aiEditorRef.current = null
      if (typeof ref === 'function') ref(null)
      else if (ref) (ref as React.RefObject<AiEditor | null>).current = null
    }
  }, [variant])

  // 外部 value 变化时同步内容
  useEffect(() => {
    const editor = aiEditorRef.current
    if (editor && value !== undefined && value !== editor.getHtml()) {
      editor.setContent(value)
    }
  }, [value])

  // 主题变化
  useEffect(() => {
    aiEditorRef.current?.changeTheme(theme as any)
  }, [theme])

  // disabled 变化
  useEffect(() => {
    aiEditorRef.current?.setEditable(!disabled)
  }, [disabled])

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
      <style>{EDITOR_STYLES}</style>
    </div>
  )
}
