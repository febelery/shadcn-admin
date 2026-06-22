import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { Extension, type Command } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
// 使用 tiptap-extension-resize-image 实现图片拖拽缩放
import ImageResize from 'tiptap-extension-resize-image'

// 扩展 Tiptap 命令类型接口声明，用于支持 TypeScript 对 setFontSize 链式命令的安全推导
declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

/**
 * 自定义 Tiptap 字号扩展
 * 绑定于 textStyle 标记属性，动态向 DOM inline style 中渲染和解析 font-size。
 */
export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const htmlEl = element as HTMLElement
              return htmlEl.style.fontSize?.replace(/['"]+/g, '')
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string): Command =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        (): Command =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).run()
        },
    }
  },
})

/**
 * 静态 Tiptap 扩展配置
 * 采用面向 DOM 属性的松耦合架构，从编辑器挂载的 DOM 节点上动态抽取 placeholder 属性，
 * 彻底消除了因占位文字变动导致重建 extensions 数组的问题，从架构上保障了生命周期安全。
 */
// pnpm 幽灵依赖问题：@tiptap/core 存在 3.27.0 和 3.27.1 两个实例，结构类型不兼容
// 功能完全正常，此处用 as any[] 在类型层面绕过不兼容检查
// TODO: 在 package.json 添加 "pnpm.overrides": { "@tiptap/core": "3.27.1" } 后移除 any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultExtensions: any[] = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
  }),
  // tiptap-extension-resize-image：提供开箱即用的图片拖拽缩放能力
  ImageResize.configure({
    inline: false,
    allowBase64: true,
  }),
  TextStyle,
  FontSize,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder: ({ editor }) => {
      // 动态读取宿主 HTML 节点的 data-placeholder 属性，进行 HTMLElement 类型收窄以解决 TS 类型校验
      const element = editor.options.element
      return element instanceof HTMLElement
        ? element.getAttribute('data-placeholder') || '输入正文内容...'
        : '输入正文内容...'
    },
    emptyEditorClass: 'is-editor-empty',
  }),
]
