import { Extension, markInputRule, markPasteRule } from '@tiptap/core'

/**
 * 自定义发送事件名，用于解耦按键捕获与外部发送生命周期
 */
export const CHAT_SEND_EVENT = 'chat-send'

/**
 * 按退格（Backspace）在块首时，应自动退回恢复为普通段落（paragraph）的块类型规则表
 * 统一收拢 heading、blockquote、codeBlock 等多分支判断
 */
const BACKSPACE_EXIT_TYPES = ['heading', 'blockquote', 'codeBlock'] as const

/**
 * 专为聊天输入框定制的 TipTap 键盘交互扩展
 *
 * 职责单一、声明式注册：
 * 1. 回车发送：Enter 触发发送消息；Mod-Enter 同样支持发送（向 view.dom 派发 chat-send 自定义事件）
 * 2. 快捷换行：Shift-Enter 触发换行，在标题中换行时新行自动重置为普通段落，避免连续大标题
 * 3. 智能退出：空块或块首按 Backspace 时，查表统一还原为普通段落
 * 4. 快捷重置：Alt-0 / Mod-Alt-0 随时将当前块一键重置为段落
 * 5. Markdown 标记识别：输入/粘贴 **粗体**、*斜体*、~~删除线~~、`行内代码` 时自动转换为对应 Mark
 */
export const ChatKeymap = Extension.create({
  name: 'chatKeymap',

  // Markdown 行内标记实时识别：**粗体**、*斜体*、~~删除线~~、`行内代码`
  // 在敲击闭合符号的瞬间自动转换为对应 Mark，仅覆盖最常用的几种，
  // 不追求完全兼容 Markdown 规范（不处理转义、嵌套等边界情况）
  addInputRules() {
    const { schema } = this.editor
    const rules = []

    // 粗体：**text** / __text__（需先于斜体注册，避免单个 * 被斜体规则提前捕获）
    if (schema.marks.bold) {
      rules.push(
        markInputRule({
          find: /(?:^|\s)\*\*([^*]+)\*\*$/,
          type: schema.marks.bold,
        }),
        markInputRule({ find: /(?:^|\s)__([^_]+)__$/, type: schema.marks.bold })
      )
    }

    // 斜体：*text* / _text_
    if (schema.marks.italic) {
      rules.push(
        markInputRule({
          find: /(?:^|\s)\*([^*]+)\*$/,
          type: schema.marks.italic,
        }),
        markInputRule({ find: /(?:^|\s)_([^_]+)_$/, type: schema.marks.italic })
      )
    }

    // 删除线：~~text~~
    if (schema.marks.strike) {
      rules.push(
        markInputRule({
          find: /(?:^|\s)~~([^~]+)~~$/,
          type: schema.marks.strike,
        })
      )
    }

    // 行内代码：`text`
    if (schema.marks.code) {
      rules.push(
        markInputRule({ find: /(?:^|\s)`([^`]+)`$/, type: schema.marks.code })
      )
    }

    return rules
  },

  // 粘贴一整段带 Markdown 标记的文本时，同样转换为对应 Mark
  addPasteRules() {
    const { schema } = this.editor
    const rules = []

    if (schema.marks.bold) {
      rules.push(
        markPasteRule({ find: /\*\*([^*]+)\*\*/g, type: schema.marks.bold })
      )
    }
    if (schema.marks.italic) {
      rules.push(
        markPasteRule({
          find: /(?:^|\s)\*([^*]+)\*(?=\s|$)/g,
          type: schema.marks.italic,
        })
      )
    }
    if (schema.marks.strike) {
      rules.push(
        markPasteRule({ find: /~~([^~]+)~~/g, type: schema.marks.strike })
      )
    }
    if (schema.marks.code) {
      rules.push(markPasteRule({ find: /`([^`]+)`/g, type: schema.marks.code }))
    }

    return rules
  },

  addKeyboardShortcuts() {
    const triggerSend = () => {
      // 若处于输入法（IME）组合状态，绝不发送
      if (this.editor.view.composing) {
        return false
      }

      // 通过 EditorView 的 DOM 节点派发标准 CustomEvent，由外部处理发送与空内容校验
      this.editor.view.dom.dispatchEvent(
        new CustomEvent(CHAT_SEND_EVENT, { bubbles: true })
      )
      return true
    }

    return {
      // 1. 退格键（Backspace）：优先删除 hardBreak 软换行，在块首时解除格式并退回普通段落
      Backspace: () => {
        const { selection } = this.editor.state
        const { $from, empty } = selection
        if (!empty) return false

        // 优先处理 hardBreak：光标紧贴 hardBreak（软换行）后按退格时，直接删除该换行符，
        // 将视觉新行无缝拼接回上一行末尾。
        // 核心原因：列表项或段落内通过 Shift-Enter 插入 hardBreak 后，视觉新行在 ProseMirror
        // 结构中仍同属一个 block，$from.parentOffset 并不为 0。若不在此直接拦截删除，
        // 默认事件流会将其转换为 NodeSelection 选中 <br> 导致光标跳到上一行末尾或视觉异常。
        if ($from.nodeBefore?.type.name === 'hardBreak') {
          return this.editor
            .chain()
            .deleteRange({
              from: $from.pos - $from.nodeBefore.nodeSize,
              to: $from.pos,
            })
            .scrollIntoView()
            .run()
        }

        if ($from.parentOffset !== 0) return false

        for (const type of BACKSPACE_EXIT_TYPES) {
          if (this.editor.isActive(type)) {
            // 引用块调用专门的 liftEmptyBlock，其余节点直接重置为 paragraph
            if (type === 'blockquote') {
              return this.editor.commands.liftEmptyBlock()
            }
            return this.editor.commands.setParagraph()
          }
        }

        return false
      },

      // Delete 键：光标紧贴 hardBreak 前按 Delete 时直接删除换行，避免产生 NodeSelection 异常
      Delete: () => {
        const { selection } = this.editor.state
        const { $from, empty } = selection
        if (empty && $from.nodeAfter?.type.name === 'hardBreak') {
          return this.editor
            .chain()
            .deleteRange({
              from: $from.pos,
              to: $from.pos + $from.nodeAfter.nodeSize,
            })
            .scrollIntoView()
            .run()
        }
        return false
      },

      // 2. 换行键（Shift-Enter）：换行
      'Shift-Enter': () => {
        const { selection } = this.editor.state
        const { $from } = selection
        const parent = $from.parent
        const parentType = parent.type.name
        const parentText = parent.textContent

        // 段落内输入 ``` 直接按 Shift-Enter 同样转换为代码块
        if (parentType === 'paragraph') {
          const codeBlockMatch = parentText.match(/^```([a-zA-Z0-9_+#.-]*)$/)
          if (codeBlockMatch) {
            const language = codeBlockMatch[1] || undefined
            return this.editor
              .chain()
              .deleteRange({ from: $from.start(), to: $from.end() })
              .setCodeBlock(language ? { language } : undefined)
              .run()
          }
        }

        // 代码块：内部直接插入物理换行
        if (this.editor.isActive('codeBlock')) {
          return this.editor.commands.newlineInCode()
        }

        // 标题：空标题直接重置，有内容标题拆分后将新行还原为段落（解决标题无法退出的核心痛点）
        if (this.editor.isActive('heading')) {
          if (parent.content.size === 0) {
            return this.editor.commands.setParagraph()
          }
          return this.editor.chain().splitBlock().setParagraph().run()
        }

        // 引用块：空引用换行跳出，否则常规拆分
        if (this.editor.isActive('blockquote')) {
          if (parent.content.size === 0) {
            return this.editor.commands.liftEmptyBlock()
          }
          return this.editor.commands.splitBlock()
        }

        // 普通段落：拆分新段落换行
        return this.editor.commands.splitBlock()
      },

      // 3. 回车键（Enter）：发送消息
      Enter: () => {
        // 若处于输入法（IME）组合状态，让原生输入法正常确认拼音上屏
        if (this.editor.view.composing) {
          return false
        }

        const { selection } = this.editor.state
        const { $from } = selection
        const parent = $from.parent
        const parentType = parent.type.name
        const parentText = parent.textContent

        // 段落内的行首 Markdown 语法回车即时转换（避免将刚打出的 ``` 或 > 误当作消息发送）
        if (parentType === 'paragraph') {
          // 输入 ``` 或 ```ts 按回车自然进入代码块
          const codeBlockMatch = parentText.match(/^```([a-zA-Z0-9_+#.-]*)$/)
          if (codeBlockMatch) {
            const language = codeBlockMatch[1] || undefined
            return this.editor
              .chain()
              .deleteRange({ from: $from.start(), to: $from.end() })
              .setCodeBlock(language ? { language } : undefined)
              .run()
          }

          // 输入 > 未按空格直接按回车，容错进入引用块
          if (parentText.trim() === '>') {
            return this.editor
              .chain()
              .deleteRange({ from: $from.start(), to: $from.end() })
              .toggleBlockquote()
              .run()
          }
        }

        // 触发发送
        return triggerSend()
      },

      // 4. Mod-Enter（Cmd/Ctrl+Enter）：全局强制发送
      'Mod-Enter': () => triggerSend(),

      // 5. 快捷键 Alt-0 / Mod-Alt-0：随时将当前块还原为段落
      'Alt-0': () => this.editor.commands.setParagraph(),
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
    }
  },
})
