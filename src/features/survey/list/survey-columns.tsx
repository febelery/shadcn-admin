import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { SurveyListItem } from '../core/types'
import { SurveyRowActions } from './survey-row-actions'

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
  onPause: (id: string) => void
}): ColumnDef<SurveyListItem>[] {
  return [
    {
      accessorKey: 'title',
      header: '标题',
      cell: ({ row }) => (
        <Link
          to='/survey/$id/edit'
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
    {
      accessorKey: 'responseCount',
      header: '回收数',
      cell: ({ row }) => (
        <Link
          to='/survey/$id/record'
          params={{ id: row.original.id }}
          className='font-medium hover:underline'
        >
          {row.original.responseCount}
        </Link>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: '更新时间',
      cell: ({ row }) =>
        new Date(row.original.updatedAt).toLocaleString('zh-CN'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <SurveyRowActions
          survey={row.original}
          onDelete={handlers.onDelete}
          onPublish={handlers.onPublish}
          onPause={handlers.onPause}
        />
      ),
      meta: {
        className: 'w-[204px]',
      },
    },
  ]
}
