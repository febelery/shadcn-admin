import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Globe,
  Archive,
  FileEdit,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { SurveyListItem } from '@/features/surveys/types'
import { Checkbox } from '@/components/ui/checkbox'

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: '草稿', variant: 'secondary' },
  published: { label: '已发布', variant: 'default' },
  archived: { label: '已归档', variant: 'outline' },
}

function getFriendlyDuration(survey: SurveyListItem) {
  if (survey.status === 'draft') return <span className="text-muted-foreground/40 text-[12px]">未开启</span>
  
  const start = survey.startTime ? new Date(survey.startTime) : null
  const end = survey.endTime ? new Date(survey.endTime) : null

  if (!start) return <span className="text-muted-foreground text-[12px]">永久有效</span>

  const startStr = format(start, 'yyyy.MM.dd')
  const endStr = end ? format(end, 'MM.dd') : '长期'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[12px] font-medium text-foreground/80 tabular-nums">
        {startStr} - {endStr}
      </span>
      {survey.status === 'published' && (
        <span className="flex items-center gap-1 text-[10px] text-green-600/70">
          <span className="h-1 w-1 rounded-full bg-current" />
          进行中
        </span>
      )}
      {survey.status === 'archived' && (
        <span className="text-[10px] text-muted-foreground/50">已存档</span>
      )}
    </div>
  )
}

export const surveysColumns = (
  onOpenBuilder: (id: string) => void,
  updateStatus: (params: { id: string; status: string }) => void,
  setDeleteId: (id: string) => void
): ColumnDef<SurveyListItem>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: 'w-[40px] px-2',
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="问卷标题" />
    ),
    cell: ({ row }) => {
      const survey = row.original
      return (
        <div className="flex max-w-[320px] flex-col gap-0.5 py-1">
          <button
            className="truncate text-left font-semibold text-foreground transition-colors hover:text-primary hover:underline"
            onClick={() => onOpenBuilder(survey.id)}
          >
            {survey.title}
          </button>
          {survey.description && (
            <span className="truncate text-[12px] text-muted-foreground">
              {survey.description}
            </span>
          )}
        </div>
      )
    },
    meta: {
      className: 'min-w-[280px]',
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="状态" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
      return (
        <Badge variant={config.variant} className="rounded-sm px-2 py-0.5 text-[11px] font-medium">
          {config.label}
        </Badge>
      )
    },
    meta: {
      className: 'w-[100px] text-center',
    },
  },
  {
    id: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="活动运行时间" />
    ),
    cell: ({ row }) => getFriendlyDuration(row.original),
    meta: {
      className: 'w-[140px] text-center',
    },
  },
  {
    accessorKey: 'mode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="展示模式" />
    ),
    cell: ({ row }) => {
      const mode = row.getValue('mode') as string
      return (
        <span className="text-[13px] text-foreground/90">
          {mode === 'scroll' ? '滚动' : '卡片'}
        </span>
      )
    },
    meta: {
      className: 'w-[100px] text-center',
    },
  },
  {
    accessorKey: 'questionCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="题数" />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-foreground">
        {row.getValue('questionCount')}
      </div>
    ),
    meta: {
      className: 'w-[80px] text-center',
    },
  },
  {
    accessorKey: 'responseCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="回收" />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-foreground">
        {row.getValue('responseCount')}
      </div>
    ),
    meta: {
      className: 'w-[80px] text-center',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const survey = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onOpenBuilder(survey.id)}>
              <FileEdit className="mr-2 h-4 w-4" />
              编辑问卷
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              预览
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {survey.status !== 'published' && (
              <DropdownMenuItem
                onClick={() =>
                  updateStatus({
                    id: survey.id,
                    status: 'published',
                  })
                }
              >
                <Globe className="mr-2 h-4 w-4" />
                立即发布
              </DropdownMenuItem>
            )}
            {survey.status !== 'archived' && (
              <DropdownMenuItem
                onClick={() =>
                  updateStatus({ id: survey.id, status: 'archived' })
                }
              >
                <Archive className="mr-2 h-4 w-4" />
                归档问卷
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(survey.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除问卷
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    meta: {
      className: 'w-[60px] text-right',
    },
  },
]
