import * as React from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Terminal,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ColorPopover } from './color-popover'
import { FontSizeDropdown } from './font-size-dropdown'
import { FormatDropdown } from './format-dropdown'
import { LinkPopover } from './link-popover'
import { SourceViewDialog } from './source-view-dialog'
// 导入抽离的排版组件及常量配置
import { ToolbarButton } from './toolbar-button'

interface ToolbarProps {
  editor: Editor | null
  disabled?: boolean
  uploadFile?: (file: File) => Promise<void>
  /** compact 模式隐藏高级格式按钮（颜色、对齐、代码块、源码等） */
  compact?: boolean
}

/**
 * 富文本编辑器主工具栏组件
 */
export function Toolbar({
  editor,
  disabled,
  uploadFile,
  compact,
}: ToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 使用 forceUpdate 机制订阅 Tiptap 的选区和事务变化
  // 确保光标在不同样式区间内移动时，工具栏各个按钮的激活高亮状态能够敏捷、正确地局部刷新
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return

    const handleUpdate = () => {
      forceUpdate()
    }

    editor.on('selectionUpdate', handleUpdate)
    editor.on('transaction', handleUpdate)

    return () => {
      editor.off('selectionUpdate', handleUpdate)
      editor.off('transaction', handleUpdate)
    }
  }, [editor])

  if (!editor) return null

  // 触发本地文件上传
  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (uploadFile) {
      await uploadFile(file)
    }
  }

  // 动态获取当前激活的对齐图标以渲染到触发按钮上
  const getActiveAlignIcon = () => {
    if (editor.isActive({ textAlign: 'center' }))
      return <AlignCenter className='h-4 w-4' />
    if (editor.isActive({ textAlign: 'right' }))
      return <AlignRight className='h-4 w-4' />
    if (editor.isActive({ textAlign: 'justify' }))
      return <AlignJustify className='h-4 w-4' />
    return <AlignLeft className='h-4 w-4' />
  }

  // 动态获取当前激活的对齐描述文字
  const getActiveAlignLabel = () => {
    if (editor.isActive({ textAlign: 'center' })) return '居中对齐'
    if (editor.isActive({ textAlign: 'right' })) return '右对齐'
    if (editor.isActive({ textAlign: 'justify' })) return '两端对齐'
    return '左对齐'
  }

  return (
    <div className='bg-muted/20 sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b p-1.5 backdrop-blur-sm'>
      {/* 组 1: 历史操作 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        tooltip='撤销 (Ctrl+Z)'
      >
        <Undo className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        tooltip='重做 (Ctrl+Y)'
      >
        <Redo className='h-4 w-4' />
      </ToolbarButton>

      <div className='bg-border/80 mx-1 h-5 w-px' />

      {/* 组 2: 排版格式（正文与多级标题、字号） */}
      <FormatDropdown editor={editor} disabled={disabled} />
      {!compact && <FontSizeDropdown editor={editor} disabled={disabled} />}

      <div className='bg-border/80 mx-1 h-5 w-px' />

      {/* 组 3: 文本基础格式 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled}
        tooltip='加粗 (Ctrl+B)'
      >
        <Bold className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled}
        tooltip='斜体 (Ctrl+I)'
      >
        <Italic className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        disabled={disabled}
        tooltip='下划线 (Ctrl+U)'
      >
        <Underline className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        disabled={disabled}
        tooltip='删除线'
      >
        <Strikethrough className='h-4 w-4' />
      </ToolbarButton>

      {!compact && (
        <>
          <div className='bg-border/80 mx-1 h-5 w-px' />

          {/* 组 4: 段落对齐方式 */}
          <DropdownMenu>
            <Tooltip>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    disabled={disabled}
                    className='hover:bg-accent/80 h-8 w-8 p-0 transition-colors'
                  >
                    {getActiveAlignIcon()}
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <TooltipContent side='bottom' className='text-xs'>
                对齐方式: {getActiveAlignLabel()}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align='start' className='w-32'>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('left').run()
                }
                className={cn(
                  editor.isActive({ textAlign: 'left' }) &&
                    'bg-accent font-medium'
                )}
              >
                <AlignLeft className='mr-2 h-4 w-4' />
                左对齐
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('center').run()
                }
                className={cn(
                  editor.isActive({ textAlign: 'center' }) &&
                    'bg-accent font-medium'
                )}
              >
                <AlignCenter className='mr-2 h-4 w-4' />
                居中对齐
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('right').run()
                }
                className={cn(
                  editor.isActive({ textAlign: 'right' }) &&
                    'bg-accent font-medium'
                )}
              >
                <AlignRight className='mr-2 h-4 w-4' />
                右对齐
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign('justify').run()
                }
                className={cn(
                  editor.isActive({ textAlign: 'justify' }) &&
                    'bg-accent font-medium'
                )}
              >
                <AlignJustify className='mr-2 h-4 w-4' />
                两端对齐
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      {!compact && (
        <>
          <div className='bg-border/80 mx-1 h-5 w-px' />
          <ColorPopover editor={editor} disabled={disabled} />
        </>
      )}

      <div className='bg-border/80 mx-1 h-5 w-px' />

      {/* 组 6: 列表、引用与分割线 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        disabled={disabled}
        tooltip='无序列表'
      >
        <List className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        disabled={disabled}
        tooltip='有序列表'
      >
        <ListOrdered className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        disabled={disabled}
        tooltip='引用'
      >
        <Quote className='h-4 w-4' />
      </ToolbarButton>
      {!compact && (
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          tooltip='分割线'
        >
          <Minus className='h-4 w-4' />
        </ToolbarButton>
      )}

      {!compact && <div className='bg-border/80 mx-1 h-5 w-px' />}

      {/* 组 7: 代码与开发格式 */}
      {!compact && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            disabled={disabled}
            tooltip='行内代码'
          >
            <Code className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            disabled={disabled}
            tooltip='代码块'
          >
            <Terminal className='h-4 w-4' />
          </ToolbarButton>
        </>
      )}

      <div className='bg-border/80 mx-1 h-5 w-px' />

      {/* 组 8: 外部多媒体交互 (链接与图片) */}
      <LinkPopover editor={editor} disabled={disabled} />

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleImageChange}
        accept='image/*'
        className='hidden'
      />
      <ToolbarButton
        onClick={triggerImageUpload}
        disabled={disabled}
        tooltip='插入图片'
      >
        <ImageIcon className='h-4 w-4' />
      </ToolbarButton>

      {!compact && (
        <>
          <div className='bg-border/80 mx-1 h-5 w-px' />

          {/* 组 9: 辅助维护与源码开发 */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }}
            disabled={disabled}
            tooltip='清除所有样式'
          >
            <Eraser className='h-4 w-4' />
          </ToolbarButton>

          <SourceViewDialog editor={editor} disabled={disabled} />
        </>
      )}
    </div>
  )
}
