import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
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

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function createSurveyColumns(handlers: {
  onDelete: (id: string) => void
  onPublish: (id: string) => void
  onPause: (id: string) => void
}): ColumnDef<SurveyListItem>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='标题' />
      ),
      cell: ({ row }) => {
        const description = stripHtml(row.original.description)

        return (
          <div className='flex min-w-0 flex-col gap-1 py-1'>
            <Link
              to='/survey/$id/edit'
              params={{ id: row.original.id }}
              className='truncate font-medium underline-offset-4 hover:underline'
              {...editInNewTab}
            >
              {row.original.title}
            </Link>
            {description && (
              <p className='text-muted-foreground line-clamp-1 max-w-xl text-xs'>
                {description}
              </p>
            )}
          </div>
        )
      },
      meta: {
        className: 'min-w-[280px]',
        tdClassName: 'align-middle',
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='状态' />
      ),
      cell: ({ row }) => (
        <Badge
          variant={statusVariant[row.original.status]}
          className='rounded-md px-2'
        >
          {statusLabel[row.original.status]}
        </Badge>
      ),
      meta: {
        className: 'w-[120px]',
      },
    },
    {
      accessorKey: 'questionCount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title='题目'
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <div className='text-right font-medium tabular-nums'>
          {row.original.questionCount}
        </div>
      ),
      meta: {
        className: 'w-[96px]',
        tdClassName: 'text-right',
      },
    },
    {
      accessorKey: 'recordCount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title='回收'
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <Link
          to='/survey/$id/record'
          params={{ id: row.original.id }}
          className='inline-flex w-full justify-end font-medium underline-offset-4 hover:underline'
        >
          <span className='tabular-nums'>{row.original.recordCount}</span>
        </Link>
      ),
      meta: {
        className: 'w-[96px]',
        tdClassName: 'text-right',
      },
    },

    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='更新时间' />
      ),
      cell: ({ row }) => (
        <div
          className='text-muted-foreground text-sm whitespace-nowrap'
          title={formatDateTime(row.original.updatedAt)}
        >
          {formatDateTime(row.original.updatedAt)}
        </div>
      ),
      meta: {
        className: 'w-[180px]',
      },
    },
    {
      id: 'actions',
      header: () => <div className='text-right'>操作</div>,
      cell: ({ row }) => (
        <SurveyRowActions
          survey={row.original}
          onDelete={handlers.onDelete}
          onPublish={handlers.onPublish}
          onPause={handlers.onPause}
        />
      ),
      meta: {
        className: 'w-[184px]',
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
