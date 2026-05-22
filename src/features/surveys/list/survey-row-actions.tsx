import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  ClipboardList,
  MoreHorizontal,
  Pause,
  Pencil,
  Rocket,
  Trash2,
} from 'lucide-react'
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
import type { SurveyListItem } from '../core/types'

/** 从列表打开已有问卷的编辑页（新标签，保留列表页） */
const editInNewTab = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const

type SurveyRowActionsProps = {
  survey: SurveyListItem
  onDelete: (id: string) => void
  onPublish: (id: string) => void
  onPause: (id: string) => void
}

export function SurveyRowActions({
  survey,
  onDelete,
  onPublish,
  onPause,
}: SurveyRowActionsProps) {
  return (
    <div className='flex items-center justify-end gap-1'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label='编辑问卷'
          >
            <Link
              to='/surveys/$id/edit'
              params={{ id: survey.id }}
              {...editInNewTab}
            >
              <Pencil className='h-4 w-4' />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          编辑
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label='查看分析'
          >
            <Link to='/surveys/$id/analytics' params={{ id: survey.id }}>
              <BarChart3 className='h-4 w-4' />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          分析
        </TooltipContent>
      </Tooltip>

      <SurveyStatusAction
        survey={survey}
        onPublish={onPublish}
        onPause={onPause}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label='查看填写记录'
          >
            <Link to='/surveys/$id/records' params={{ id: survey.id }}>
              <ClipboardList className='h-4 w-4' />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          填写记录
        </TooltipContent>
      </Tooltip>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label='更多操作'
            title='更多'
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' sideOffset={6}>
          <DropdownMenuItem
            variant='destructive'
            onClick={() => onDelete(survey.id)}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SurveyStatusAction({
  survey,
  onPublish,
  onPause,
}: {
  survey: SurveyListItem
  onPublish: (id: string) => void
  onPause: (id: string) => void
}) {
  if (survey.status === 'archived') {
    return (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        aria-label='已归档'
        title='已归档'
        disabled
      >
        <Pause className='h-4 w-4' />
      </Button>
    )
  }

  const isPublished = survey.status === 'published'
  const Icon = isPublished ? Pause : Rocket
  const label = isPublished ? '暂停发布' : '发布'
  const onClick = isPublished
    ? () => onPause(survey.id)
    : () => onPublish(survey.id)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          aria-label={label}
          onClick={onClick}
        >
          <Icon className='h-4 w-4' />
        </Button>
      </TooltipTrigger>
      <TooltipContent side='top' className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
