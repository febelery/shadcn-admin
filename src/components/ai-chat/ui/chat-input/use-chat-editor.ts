import { useEffect, useMemo, useRef } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import { useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from 'cn'
import { CHAT_SEND_EVENT, ChatKeymap } from './chat-keymap-extension'

/**
 * 超大文本粘贴的触发阈值：超过此行数或字符数时，自动转为文件附件
 * 参考 Claude 的策略：约 50 行 / 2000 字符以上
 */
const PASTE_LINE_THRESHOLD = 50
const PASTE_CHAR_THRESHOLD = 2000

export interface UseChatEditorOptions {
  /** 外部绑定的受控或初始文本值 */
  value: string
  /** 文本变化时的同步回调 */
  onChange: (value: string) => void
  /** 回车发送消息的回调 */
  onSend: () => void
  /** 捕获到粘贴/拖拽文件时的添加附件回调 */
  onAddFiles?: (files: File[]) => void
  /** 占位提示文案 */
  placeholder?: string
  /** 编辑器自定义样式类 */
  className?: string
}

export interface UseChatEditorReturn {
  editor: Editor | null
  isEmpty: boolean
  isComposingRef: React.RefObject<boolean>
  compositionHandlers: {
    onCompositionStart: () => void
    onCompositionEnd: () => void
  }
  getEditorText: () => string
  clearContent: () => void
  focus: () => void
}

/**
 * 将外部纯文本转换为安全排版的 HTML 段落结构，保护多行换行语义
 */
function textToHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<p>${escaped || '<br>'}</p>`
    })
    .join('')
}

/**
 * 提取节点内所有文本内容，并将 inline 的 hardBreak 还原为换行符 \n
 * 解决 ProseMirror 默认 node.textContent 会丢弃 hardBreak 导致视觉换行文字被强行拼接的问题
 */
function getNodeTextWithBreaks(node: {
  descendants: (fn: (child: any) => void) => void
}): string {
  let text = ''
  node.descendants((child: any) => {
    if (child.isText) {
      text += child.text
    } else if (child.type.name === 'hardBreak') {
      text += '\n'
    }
  })
  return text
}

/**
 * 序列化编辑器富文本内容，精确还原 Markdown 语法（标题、代码块语言、引用块、无序/有序列表、分割线）
 */
function serializeEditorText(editor: Editor): string {
  return editor.getText({
    blockSeparator: '\n',
    textSerializers: {
      heading: ({ node }) => {
        const hashes = '#'.repeat(node.attrs.level || 1)
        return `${hashes} ${getNodeTextWithBreaks(node)}`
      },
      codeBlock: ({ node }) => {
        const lang = node.attrs.language || ''
        return `\`\`\`${lang}\n${node.textContent}\n\`\`\``
      },
      blockquote: ({ node }) => {
        const lines = getNodeTextWithBreaks(node).split('\n')
        return lines.map((line) => `> ${line}`).join('\n')
      },
      horizontalRule: () => '---',
    },
  })
}

/**
 * 静态装配 TipTap 扩展集合，纯模块级单例，彻底避免 render 阶段频繁创建 extensions
 */
const CHAT_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
  }),
  Placeholder.configure({
    placeholder: '输入消息向 AI 提问…',
    emptyEditorClass: 'is-editor-empty',
  }),
  ChatKeymap,
]

/**
 * 对话输入框富文本编辑器深层 Hook
 *
 * 封装 TipTap 的完整生命周期：
 * 1. 实例化与 Markdown 扩展注册；
 * 2. 粘贴拦截：图片直接转附件，超长文本自动转为 .txt 文件；
 * 3. 拖拽放入文件拦截；
 * 4. IME 拼音输入法状态防误触（在 EditorView 顶层 direct prop 优先拦截）；
 * 5. 外部受控 value 的双向同步与 Markdown 结构化序列化。
 */
export function useChatEditor({
  value,
  onChange,
  onSend,
  onAddFiles,
  className,
}: UseChatEditorOptions): UseChatEditorReturn {
  // IME 拼音输入状态标记，用于防止中文确认候选词时误发
  const isComposingRef = useRef(false)

  // 保证按键扩展能永远调用到最新的 onSend 回调
  const onSendRef = useRef(onSend)
  useEffect(() => {
    onSendRef.current = onSend
  })

  // 保持 onAddFiles 最新引用
  const onAddFilesRef = useRef(onAddFiles)
  useEffect(() => {
    onAddFilesRef.current = onAddFiles
  })

  const editor = useEditor({
    extensions: CHAT_EXTENSIONS,
    content: '',
    immediatelyRender: false,
    editorProps: {
      /**
       * IME 保护单独保留在 editorProps.handleKeyDown 的核心原因：
       *
       * ProseMirror 的插件事件体系（包括 ChatKeymap 所在的 keymap plugin）晚于 EditorView 的 direct props 执行。
       * 当用户使用中文输入法（如 macOS 拼音、微软拼音）按回车确认拼音候选词时，浏览器会触发 keydown(Enter, isComposing=true)。
       * 在 EditorView 顶层的 handleKeyDown 拦截并返回 false，能 100% 在任何 ProseMirror 插件执行前将事件安全让渡给浏览器原生输入法，
       * 从根本上避免拼音上屏回车直接将草稿作为消息误发送出去。
       */
      handleKeyDown(_view, event) {
        if (event.isComposing || isComposingRef.current) {
          return false
        }
        return false
      },

      attributes: {
        class: cn(
          // Markdown prose 基础排版样式
          'prose prose-sm dark:prose-invert max-w-none outline-none',
          // 段落重置边距，防止首行下沉
          '[&_p]:my-0',
          // heading 标题字号约束
          '[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-0',
          '[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-0.5 [&_h2]:mt-0',
          '[&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-0 [&_h3]:mt-0',
          // 引用块样式
          '[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:my-1.5 [&_blockquote]:text-muted-foreground [&_blockquote]:italic',
          // code 代码块样式
          '[&_pre]:bg-muted/70 [&_pre]:border [&_pre]:border-border/50 [&_pre]:rounded-md [&_pre]:px-3 [&_pre]:py-2 [&_pre]:my-1.5 [&_pre]:text-xs [&_pre]:font-mono',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:font-mono',
          '[&_:not(pre)>code]:bg-muted/80 [&_:not(pre)>code]:border [&_:not(pre)>code]:border-border/40 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-xs [&_:not(pre)>code]:font-mono',
          // 分割线样式
          '[&_hr]:my-2 [&_hr]:border-border',
          // placeholder 样式（匹配空节点 ::before）
          '[&_.is-editor-empty]:before:text-muted-foreground/60 [&.is-editor-empty]:before:text-muted-foreground/60',
          '[&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 [&.is-editor-empty]:before:float-left [&.is-editor-empty]:before:h-0',
          '[&_.is-editor-empty]:before:pointer-events-none [&.is-editor-empty]:before:pointer-events-none',
          '[&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&.is-editor-empty]:before:content-[attr(data-placeholder)]',
          // 尺寸与滚动
          'min-h-[44px] max-h-48 overflow-y-auto',
          'px-2.5 py-1.5 text-sm leading-relaxed',
          className
        ),
      },

      // 拦截粘贴事件：处理图片粘贴和超长文本转附件
      handlePaste(_view, event) {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        // 1. 优先捕获剪贴板中的文件与图片
        const files = Array.from(clipboardData.items)
          .filter((item) => item.kind === 'file')
          .map((item) => item.getAsFile())
          .filter((f): f is File => f !== null)

        if (files.length > 0) {
          event.preventDefault()
          onAddFilesRef.current?.(files)
          return true
        }

        // 2. 文本粘贴拦截：超长文本（>50行或>2000字符）自动封包为 .txt 文件附件
        const text = clipboardData.getData('text/plain')
        if (
          text.length > PASTE_CHAR_THRESHOLD ||
          text.split('\n').length > PASTE_LINE_THRESHOLD
        ) {
          event.preventDefault()
          const blob = new Blob([text], { type: 'text/plain' })
          const file = new File([blob], 'pasted-text.txt', {
            type: 'text/plain',
          })
          onAddFilesRef.current?.([file])
          return true
        }

        return false
      },

      // 拦截拖拽文件放入编辑器
      handleDrop(_view, event) {
        const dt = event.dataTransfer
        if (!dt || dt.files.length === 0) return false
        event.preventDefault()
        onAddFilesRef.current?.(Array.from(dt.files))
        return true
      },
    },

    onUpdate({ editor: e }) {
      if (e.isDestroyed) return
      onChange(serializeEditorText(e))
    },
  })

  // 监听来自 ChatKeymap 的 CHAT_SEND_EVENT 事件触发发送，解耦生命周期
  useEffect(() => {
    const dom = editor?.view?.dom
    if (!dom) return

    const handleChatSend = () => {
      if (!isComposingRef.current) {
        onSendRef.current?.()
      }
    }

    dom.addEventListener(CHAT_SEND_EVENT, handleChatSend)
    return () => {
      dom.removeEventListener(CHAT_SEND_EVENT, handleChatSend)
    }
  }, [editor])

  // 外部 value 发生重置或变化时安全同步至编辑器内部
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (value === '') {
      if (!editor.isEmpty) {
        editor.commands.clearContent(true)
      }
    } else {
      const current = serializeEditorText(editor)
      if (current !== value) {
        editor.commands.setContent(textToHtml(value))
      }
    }
  }, [editor, value])

  const compositionHandlers = useMemo(
    () => ({
      onCompositionStart: () => {
        isComposingRef.current = true
      },
      onCompositionEnd: () => {
        // 延迟 50ms 释放，防止确认输入法拼写时的同频回车击穿触发消息发送
        setTimeout(() => {
          isComposingRef.current = false
        }, 50)
      },
    }),
    []
  )

  const getEditorText = () => {
    if (!editor || editor.isDestroyed) return value
    return serializeEditorText(editor)
  }

  const clearContent = () => {
    if (!editor || editor.isDestroyed) return
    editor.commands.clearContent(true)
  }

  const focus = () => {
    if (editor && !editor.isDestroyed && !editor.isFocused) {
      editor.commands.focus('end')
    }
  }

  const isTextEmpty = editor
    ? !serializeEditorText(editor).trim()
    : !value.trim()

  return {
    editor,
    isEmpty: isTextEmpty,
    isComposingRef,
    compositionHandlers,
    getEditorText,
    clearContent,
    focus,
  }
}
