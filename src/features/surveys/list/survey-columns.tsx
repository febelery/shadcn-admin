import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SurveyListItem } from '../core/types'

/** 从列表打开已有问卷的编辑页（新标签，保留列表页） */
const editInNewTab = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const

const statusVariant: Record<
  SurveyListItem['status'],
  'default' | 'secondary' | 'outline'
> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
}

const statusLabel: Record<SurveyListItem['status'], string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

export function createSurveyColumns(handlers: {
  onDelete: (id: string) => void
  onPublish: (id: string) => void
  onArchive: (id: string) => void
}): ColumnDef<SurveyListItem>[] {
  return [
    {
      accessorKey: 'title',
      header: '标题',
      cell: ({ row }) => (
        <Link
          to='/surveys/$id/edit'
          params={{ id: row.original.id }}
          className='font-medium hover:underline'
          {...editInNewTab}
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {statusLabel[row.original.status]}
        </Badge>
      ),
    },
    { accessorKey: 'questionCount', header: '题目数' },
    { accessorKey: 'responseCount', header: '回收数' },
    {
      accessorKey: 'updatedAt',
      header: '更新时间',
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString('zh-CN'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const s = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link
                  to='/surveys/$id/edit'
                  params={{ id: s.id }}
                  {...editInNewTab}
                >
                  <Pencil className='mr-2 h-4 w-4' /> 编辑
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to='/surveys/$id/analytics' params={{ id: s.id }}>
                  <BarChart3 className='mr-2 h-4 w-4' /> 分析
                </Link>
              </DropdownMenuItem>
              {s.status === 'draft' && (
                <DropdownMenuItem onClick={() => handlers.onPublish(s.id)}>
                  发布
                </DropdownMenuItem>
              )}
              {s.status !== 'archived' && (
                <DropdownMenuItem onClick={() => handlers.onArchive(s.id)}>
                  归档
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive'
                onClick={() => handlers.onDelete(s.id)}
              >
                <Trash2 className='mr-2 h-4 w-4' /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
