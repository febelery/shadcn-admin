import * as React from 'react'
import { z } from 'zod'
import { defaultUpload } from '@/config/upload'
import { Editor as TiptapEditor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { defaultExtensions } from './extensions'
import { useImageUpload } from './hooks/use-image-upload'
import { Toolbar } from './toolbar/index'

export interface EditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  /**
   * 自定义图片上传函数
   * - 不传时默认使用全局七牛云 defaultUpload（支持实时进度可视化）
   * - 传入则使用自定义逻辑（不支持进度回调）
   */
  uploadImage?: (file: File) => Promise<string>
  minHeight?: string
  /** 工具栏模式: 'full' 完整 | 'compact' 精简 | 'hidden' 隐藏 */
  toolbar?: 'full' | 'compact' | 'hidden'
  id?: string
  name?: string
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
}

/**
 * 专为富文本编辑器设计的 Zod 校验验证器
 * 从架构上封装了 HTML 标签过滤的复杂度，调用方无需感知内部正则机制，直接通过 min/max 进行标准校验
 */
export const zEditorString = (options?: {
  min?: number
  max?: number
  requiredError?: string
  minError?: string
  maxError?: string
  uploadingError?: string
}) => {
  return z.string().superRefine((val, ctx) => {
    // 拦截任何包含正在上传（blob:）或未上传成功的 base64/blob 图片
    if (val.includes('src="blob:') || val.includes('src="data:image/')) {
      ctx.addIssue({
        code: 'custom',
        message:
          options?.uploadingError || '正文中包含未上传成功或正在上传的图片',
      })
      return
    }

    // 剥离 HTML 标签及空白字符实体
    const cleanText = val
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    const length = cleanText.length

    const minVal = options?.min ?? 0
    if (minVal > 0 && length < minVal) {
      if (length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: options?.requiredError || '内容不能为空',
        })
      } else {
        ctx.addIssue({
          code: 'custom',
          message: options?.minError || `内容至少需要 ${minVal} 个字符`,
        })
      }
    }

    if (options?.max !== undefined && length > options.max) {
      ctx.addIssue({
        code: 'custom',
        message: options?.maxError || `内容最多不能超过 ${options.max} 个字符`,
      })
    }
  })
}

/**
 * 高质感富文本编辑器主入口组件
 */
export function Editor({
  value = '',
  onChange,
  placeholder = '输入正文内容...',
  disabled = false,
  invalid = false,
  className,
  // 默认接入全局七牛云上传，支持编辑器内实时进度可视化
  uploadImage = (file) => defaultUpload(file, {}),
  minHeight = '200px',
  toolbar = 'full',
  id,
  name,
  onFocus,
  onBlur,
  autoFocus,
}: EditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [editor, setEditor] = React.useState<TiptapEditor | null>(null)

  // 1. 调用自定义 hook 管理图片上传与 DOM 控制
  const { uploadFile } = useImageUpload(editor, uploadImage)

  // 使用 Ref 追踪最新的 uploadFile，避免 Tiptap 初始化闭包过期
  const uploadFileRef = React.useRef(uploadFile)
  React.useEffect(() => {
    uploadFileRef.current = uploadFile
  }, [uploadFile])

  // 使用 Ref 追踪回调，避免 onChange 的引用变动引起生命周期的多余触发
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const onFocusRef = React.useRef(onFocus)
  React.useEffect(() => {
    onFocusRef.current = onFocus
  }, [onFocus])

  const onBlurRef = React.useRef(onBlur)
  React.useEffect(() => {
    onBlurRef.current = onBlur
  }, [onBlur])

  const valueRef = React.useRef(value)
  React.useEffect(() => {
    valueRef.current = value
  }, [value])

  // 初始化编辑器实例 (整个组件生命周期仅在挂载时运行一次，从根本上隔离重构开销)
  React.useEffect(() => {
    if (!containerRef.current) return

    const instance = new TiptapEditor({
      element: containerRef.current,
      extensions: defaultExtensions,
      content: value,
      editable: !disabled,
      editorProps: {
        handleDrop(_view, event, _slice, moved) {
          if (
            !moved &&
            event.dataTransfer &&
            event.dataTransfer.files &&
            event.dataTransfer.files.length > 0
          ) {
            const files = Array.from(event.dataTransfer.files)
            const imageFiles = files.filter((f) => f.type.startsWith('image/'))
            if (imageFiles.length > 0) {
              event.preventDefault()
              imageFiles.forEach((file) => {
                uploadFileRef.current(file)
              })
              return true
            }
          }
          return false
        },
        handlePaste(_view, event) {
          if (
            event.clipboardData &&
            event.clipboardData.files &&
            event.clipboardData.files.length > 0
          ) {
            const files = Array.from(event.clipboardData.files)
            const imageFiles = files.filter((f) => f.type.startsWith('image/'))
            if (imageFiles.length > 0) {
              event.preventDefault()
              imageFiles.forEach((file) => {
                uploadFileRef.current(file)
              })
              return true
            }
          }
          return false
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        // 空段落过滤，向外传出空字符串方便表单依赖包（如 Zod）验证空值
        const isEmpty = editor.isEmpty || html === '<p></p>'
        const newValue = isEmpty ? '' : html
        
        // 防抖/防死循环：如果实质内容没有改变，不要向外触发 onChange，防止误触发表单的 isDirty/isTouched 验证
        if (newValue !== valueRef.current) {
          onChangeRef.current?.(newValue)
        }
      },
    })

    // 注册焦点/失焦事件，与表单库（TanStack Form）的 touched 状态联动
    instance.on('focus', () => onFocusRef.current?.())
    instance.on('blur', () => onBlurRef.current?.())

    setEditor(instance)

    // 组件卸载时干净利落地销毁编辑器并解绑 DOM 监听
    return () => {
      instance.destroy()
    }
  }, []) // 依赖数组留空，确保整个生命周期仅执行一次 new Editor

  // 单向流：监听外部 value 的变化，并在差异显著时直接更新视口内容（解决回显、重置及打字光标跳闪）
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentHTML = editor.getHTML()
    const targetHTML = value || ''

    // 修复进入页面时，targetHTML 为 '' 而 currentHTML 默认是 '<p></p>'，导致触发 setContent 及 onChange 的问题
    if (targetHTML === currentHTML) return
    if (targetHTML === '' && currentHTML === '<p></p>') return

    editor.commands.setContent(targetHTML)
  }, [value, editor])

  // 单向流：监听只读属性的变化，动态通知 Tiptap 引擎而无需重新挂载容器
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  // 受控自动聚焦：编辑器就绪且 autoFocus 为 true 时聚焦
  React.useEffect(() => {
    if (editor && autoFocus && !editor.isDestroyed) {
      editor.commands.focus()
    }
  }, [editor, autoFocus])

  // 字数统计逻辑，采用独立数据计算并做防爆卫语句守护
  const stats = React.useMemo(() => {
    if (!editor || editor.isDestroyed) return { characters: 0, words: 0 }
    const text = editor.getText().trim()
    if (!text) return { characters: 0, words: 0 }

    return {
      characters: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
    }
  }, [editor, value])

  return (
    <TooltipProvider delayDuration={150}>
      <div
        data-slot='editor'
        id={id}
        data-name={name}
        className={cn(
          'group border-input bg-background text-foreground relative flex w-full flex-col overflow-hidden rounded-md border shadow-xs transition-all duration-200',
          invalid
            ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive focus-within:ring-2 focus-within:ring-offset-2'
            : 'focus-within:border-ring focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
          disabled && 'bg-muted/30 cursor-not-allowed opacity-60 select-none',
          className
        )}
        style={{ '--editor-min-height': minHeight } as React.CSSProperties}
      >
        {/* 嵌入 scoped 局部样式，优雅调整 ProseMirror 编辑区各级元素的排版及 hover 交互 */}
        <style>{`
        .ProseMirror {
          outline: none;
          min-height: var(--editor-min-height, 200px);
          padding: 1rem;
          font-size: 0.875rem;
          line-height: 1.625;
        }
        /* 针对各层元素的排版微调 */
        .ProseMirror p {
          margin: 0;
        }
        .ProseMirror p:not(:first-child) {
          margin-top: 0.75rem;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--foreground);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        .ProseMirror h1 { font-size: 1.5rem; }
        .ProseMirror h2 { font-size: 1.25rem; }
        .ProseMirror h3 { font-size: 1.125rem; }
        
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 4px solid color-mix(in oklch, var(--primary) 40%, transparent);
          padding-left: 1rem;
          font-style: italic;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: var(--muted-foreground);
        }
        .ProseMirror pre {
          border-radius: 0.375rem;
          background-color: var(--muted);
          padding: 0.75rem 1rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          overflow-x: auto;
          border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
        }
        .ProseMirror code {
          border-radius: 0.25rem;
          background-color: var(--muted);
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.825rem;
          border: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
        }
        .ProseMirror a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .ProseMirror a:hover {
          color: color-mix(in oklch, var(--primary) 80%, transparent);
        }
        .ProseMirror img {
          border-radius: 0.375rem;
          max-width: 100%;
          display: block;
        }
        /* 图片父容器需要 position: relative，保证上传进度 ::after 定位正确 */
        .ProseMirror img + * , .ProseMirror p:has(img) {
          position: relative;
        }
        .ProseMirror [data-node-view-wrapper] {
          position: relative;
        }

        /* ─── tiptap-extension-resize-image 样式覆盖（shadcn 风格） ─────────────── */

        /* 选中容器：覆盖库注入的 dashed inline border → 主题色实线 + 发光 */
        .ProseMirror div[style*="dashed"] {
          border: 2px solid color-mix(in oklch, var(--primary) 70%, transparent) !important;
          border-radius: calc(var(--radius) - 2px) !important;
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--primary) 12%, transparent) !important;
        }

        /* ── Resize 句柄小圆点 ── */
        [data-resize-image-ui="resize-handle"] {
          background-color: var(--primary) !important;
          border: 2px solid var(--background) !important;
          border-radius: 50% !important;
          box-shadow: 0 1px 4px color-mix(in oklch, var(--primary) 40%, transparent) !important;
          width: 10px !important;
          height: 10px !important;
          transition: transform 0.12s ease, box-shadow 0.12s ease !important;
        }
        [data-resize-image-ui="resize-handle"]:hover {
          transform: scale(1.4) !important;
          box-shadow: 0 2px 8px color-mix(in oklch, var(--primary) 55%, transparent) !important;
        }

        /* ── 对齐浮层 position-controller ── */
        [data-resize-image-ui="position-controller"] {
          background-color: var(--popover) !important;
          border: 1px solid var(--border) !important;
          border-radius: calc(var(--radius) - 2px) !important;
          box-shadow: 0 4px 16px color-mix(in oklch, var(--foreground) 8%, transparent),
                      0 1px 4px color-mix(in oklch, var(--foreground) 5%, transparent) !important;
          padding: 3px 6px !important;
          gap: 4px !important;
          height: auto !important;
        }
        /* 对齐按钮图标：去掉图片默认样式，添加 hover 高亮 */
        [data-resize-image-ui="position-controller"] img {
          opacity: 0.55 !important;
          border-radius: 4px !important;
          border: none !important;
          margin: 1px !important;
          padding: 2px !important;
          transition: opacity 0.15s ease, background-color 0.15s ease !important;
          box-shadow: none !important;
        }
        [data-resize-image-ui="position-controller"] img:hover {
          opacity: 1 !important;
          background-color: var(--accent) !important;
        }
        /* 深色模式：对齐图标做反色处理（图标是黑色 SVG） */
        .dark [data-resize-image-ui="position-controller"] img {
          filter: invert(1) !important;
        }

        /* 利用 Tiptap Placeholder 输出的特定类匹配空节点渲染 data-placeholder 属性内容 */
        .ProseMirror .is-editor-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted-foreground);
          opacity: 0.45;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror[contenteditable="false"] {
          cursor: not-allowed;
        }
      `}</style>

        {/* 顶部工具栏，toolbar=false 时可完全隐藏 */}
        {toolbar !== 'hidden' && (
          <Toolbar
            editor={editor}
            disabled={disabled}
            uploadFile={uploadFile}
            compact={toolbar === 'compact'}
          />
        )}

        {/* 编辑器挂载视口。Tiptap 的 Placeholder 扩展将动态从 data-placeholder 节点读取属性 */}
        <div
          className='max-h-[600px] flex-1 overflow-y-auto'
          ref={containerRef}
          data-placeholder={placeholder}
        />

        {/* 底部状态栏 */}
        <div className='bg-muted/10 text-muted-foreground flex items-center justify-between border-t px-3 py-1.5 text-[11px] select-none'>
          <div className='flex items-center gap-1.5'>
            {disabled ? (
              <span className='inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400'>
                只读模式
              </span>
            ) : (
              <span className='inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
                已就绪
              </span>
            )}
          </div>
          <div className='flex items-center gap-3 font-mono'>
            <span>
              字数:{' '}
              <strong className='text-foreground/80 font-semibold'>
                {stats.characters}
              </strong>{' '}
              个字符
            </span>
            <span className='bg-border/80 h-2.5 w-px' />
            <span>
              词数:{' '}
              <strong className='text-foreground/80 font-semibold'>
                {stats.words}
              </strong>{' '}
              个单词
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
