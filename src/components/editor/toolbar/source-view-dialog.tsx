import * as React from 'react'
import { Editor } from '@tiptap/react'
import { Code2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SourceViewDialogProps {
  editor: Editor
  disabled?: boolean
}

/**
 * 独立的富文本编辑器源码查看与复制 Dialog 组件
 */
export function SourceViewDialog({ editor, disabled }: SourceViewDialogProps) {
  const [copied, setCopied] = React.useState(false)

  // 格式化输出 HTML 代码以提升可读性
  const getFormattedHTML = (html: string) => {
    if (!html) return ''
    return html
      .replace(/></g, '>\n<') // 在标签间加换行
      .replace(/(<\/[^>]+>)/g, '$1\n') // 在闭合标签后加换行
      .replace(/(\n\s*\n)/g, '\n') // 去掉冗余连续空行
      .trim()
  }

  // 拷贝 HTML 源码到剪贴板，提供微交互反馈
  const handleCopySource = (html: string) => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    toast.success('HTML 源码已成功复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='hover:bg-accent/80 h-8 w-8 p-0 transition-colors'
              disabled={disabled}
            >
              <Code2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          查看 HTML 源码
        </TooltipContent>
      </Tooltip>
      <DialogContent className='max-w-2xl sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Code2 className='text-primary h-5 w-5' />
            <span>HTML 源码视图</span>
          </DialogTitle>
        </DialogHeader>
        <div className='group/code relative mt-1 overflow-hidden rounded-md border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner'>
          {/* 悬浮复制按钮 */}
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='absolute top-3 right-3 h-8 w-8 border-slate-800 bg-slate-900 text-slate-400 opacity-0 transition-opacity duration-200 group-hover/code:opacity-100 hover:bg-slate-800 hover:text-slate-200'
            onClick={() => handleCopySource(editor.getHTML())}
          >
            {copied ? (
              <Check className='h-3.5 w-3.5 text-emerald-400' />
            ) : (
              <Copy className='h-3.5 w-3.5' />
            )}
          </Button>
          <pre className='max-h-[400px] scrollbar-thin scrollbar-thumb-slate-800 overflow-y-auto pr-8 leading-relaxed break-all whitespace-pre-wrap'>
            {getFormattedHTML(editor.getHTML())}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
