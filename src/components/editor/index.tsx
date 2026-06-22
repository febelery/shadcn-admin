import * as React from 'react'
import { z } from 'zod'
import { Editor as TiptapEditor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { defaultExtensions } from './extensions'
import { Toolbar } from './toolbar/index'

export interface EditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  uploadImage?: (file: File) => Promise<string>
  minHeight?: string
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
}) => {
  return z.string().superRefine((val, ctx) => {
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
  uploadImage,
  minHeight = '200px',
}: EditorProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [editor, setEditor] = React.useState<TiptapEditor | null>(null)

  // 使用 Ref 追踪回调，避免 onChange 的引用变动引起生命周期的多余触发
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  // 初始化编辑器实例 (整个组件生命周期仅在挂载时运行一次，从根本上隔离重构开销)
  React.useEffect(() => {
    if (!containerRef.current) return

    const instance = new TiptapEditor({
      element: containerRef.current,
      extensions: defaultExtensions,
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        // 空段落过滤，向外传出空字符串方便表单依赖包（如 Zod）验证空值
        const isEmpty = editor.isEmpty || html === '<p></p>'
        onChangeRef.current?.(isEmpty ? '' : html)
      },
    })

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

    if (targetHTML !== currentHTML) {
      editor.commands.setContent(targetHTML)
    }
  }, [value, editor])

  // 单向流：监听只读属性的变化，动态通知 Tiptap 引擎而无需重新挂载容器
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

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
    <div
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
          color: hsl(var(--foreground));
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
          border-left: 4px solid hsl(var(--primary) / 0.4);
          padding-left: 1rem;
          font-style: italic;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: hsl(var(--muted-foreground));
        }
        .ProseMirror pre {
          border-radius: 0.375rem;
          background-color: hsl(var(--muted));
          padding: 0.75rem 1rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          overflow-x: auto;
          border: 1px solid hsl(var(--border) / 0.5);
        }
        .ProseMirror code {
          border-radius: 0.25rem;
          background-color: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.825rem;
          border: 1px solid hsl(var(--border) / 0.3);
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .ProseMirror a:hover {
          color: hsl(var(--primary) / 0.8);
        }
        .ProseMirror img {
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border) / 0.6);
          max-width: 100%;
          margin: 1rem auto;
          display: block;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.15s ease-in-out;
        }
        .ProseMirror img:hover {
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        }

        /* 可缩放图片的 NodeView 容器 */
        .ProseMirror .node-resizableImage {
          display: inline-block;
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

      {/* 顶部工具栏，注入已就绪的 editor 实例 */}
      <Toolbar editor={editor} disabled={disabled} uploadImage={uploadImage} />

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
  )
}
