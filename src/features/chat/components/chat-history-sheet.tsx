import { useState } from 'react'
import { Clock, MessageSquare, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export interface HistorySession {
  id: string
  title: string
  preview: string
  updatedAt: string
  group: '今天' | '前 7 天' | '更早'
  messageCount: number
}

const INITIAL_SESSIONS: HistorySession[] = [
  {
    id: '1',
    title: '版本新特性与思考过程探索',
    preview: '本次更新增加了键盘快捷键、更快的搜索体验…',
    updatedAt: '10 分钟前',
    group: '今天',
    messageCount: 4,
  },
  {
    id: '2',
    title: '原型需求定制问卷交互方案',
    preview: '请回答这份简短的问卷，我将为你量身定制原型路线…',
    updatedAt: '2 小时前',
    group: '今天',
    messageCount: 6,
  },
  {
    id: '3',
    title: '敏感操作权限确认流程演示',
    preview: '检测到敏感操作：即将归档 3 篇草稿，执行前需要你的确认…',
    updatedAt: '3 天前',
    group: '前 7 天',
    messageCount: 3,
  },
  {
    id: '4',
    title: '全局快捷键配置指南',
    preview: '按 ⌘K 进行全局搜索，按 Enter 发送消息…',
    updatedAt: '5 天前',
    group: '前 7 天',
    messageCount: 2,
  },
  {
    id: '5',
    title: '多模态 AI 架构调研分析',
    preview: '基于深度思考与流式协议的前端渲染方案对比…',
    updatedAt: '上周',
    group: '更早',
    messageCount: 12,
  },
]

interface ChatHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectSession?: (session: HistorySession) => void
}

/**
 * 对话历史抽屉组件（从右上角点击展开）
 */
export function ChatHistorySheet({
  open,
  onOpenChange,
  onSelectSession,
}: ChatHistorySheetProps) {
  const [sessions, setSessions] = useState<HistorySession[]>(INITIAL_SESSIONS)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string>('1')

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.preview.toLowerCase().includes(query.toLowerCase())
  )

  const groups = ['今天', '前 7 天', '更早'] as const

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessions((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSelect = (session: HistorySession) => {
    setActiveId(session.id)
    onSelectSession?.(session)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='border-b pb-4'>
          <div className='flex items-center gap-2 pr-8'>
            <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg'>
              <Clock className='size-4' />
            </div>
            <SheetTitle className='text-base font-semibold tracking-tight'>
              对话历史
            </SheetTitle>
          </div>
          <SheetDescription className='text-muted-foreground text-xs'>
            查看、检索或继续你此前的主题对话
          </SheetDescription>

          {/* 搜索框 */}
          <div className='relative mt-2'>
            <Search className='text-muted-foreground/60 absolute top-2.5 left-2.5 size-3.5' />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='搜索历史对话…'
              className='h-8.5 pl-8 text-xs'
            />
          </div>
        </SheetHeader>

        {/* 历史对话列表 */}
        <div className='flex-1 space-y-5 overflow-y-auto px-4 py-2'>
          {filteredSessions.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center text-xs'>
              暂无匹配的对话历史
            </div>
          ) : (
            groups.map((group) => {
              const items = filteredSessions.filter((s) => s.group === group)
              if (items.length === 0) return null

              return (
                <div key={group} className='space-y-1.5'>
                  <div className='text-muted-foreground px-1.5 text-[11px] font-medium tracking-wider uppercase'>
                    {group}
                  </div>
                  <div className='space-y-1'>
                    {items.map((session) => {
                      const isActive = session.id === activeId
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSelect(session)}
                          className={`group relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition-all ${
                            isActive
                              ? 'border-primary/40 bg-accent/60 shadow-2xs'
                              : 'hover:border-border hover:bg-muted/40 border-transparent bg-transparent'
                          }`}
                        >
                          <div className='flex min-w-0 items-start gap-2.5'>
                            <MessageSquare
                              className={`mt-0.5 size-3.5 shrink-0 ${
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <div className='min-w-0 flex-1 space-y-1'>
                              <div className='text-foreground truncate text-xs font-medium'>
                                {session.title}
                              </div>
                              <p className='text-muted-foreground line-clamp-1 text-[11px]'>
                                {session.preview}
                              </p>
                              <div className='text-muted-foreground/70 flex items-center gap-2 text-[10px]'>
                                <span>{session.updatedAt}</span>
                                <span>·</span>
                                <span>{session.messageCount} 条对话</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            type='button'
                            size='icon'
                            variant='ghost'
                            className='text-muted-foreground/60 hover:text-destructive size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                            onClick={(e) => handleDelete(session.id, e)}
                            title='删除此对话'
                          >
                            <Trash2 className='size-3' />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 底部清理 */}
        {sessions.length > 0 && (
          <div className='text-muted-foreground flex items-center justify-between border-t p-3 text-xs'>
            <span>共 {sessions.length} 个历史对话</span>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground hover:text-destructive h-7 text-xs'
              onClick={() => setSessions([])}
            >
              清空历史
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
