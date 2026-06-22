import { useState } from 'react'
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className='flex items-center justify-end gap-1'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='size-8'
            aria-label='编辑问卷'
          >
            <Link
              to='/survey/$id/edit'
              params={{ id: survey.id }}
              {...editInNewTab}
            >
              <Pencil />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          编辑
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
            className='size-8'
            aria-label='数据分析'
          >
            <Link to='/survey/$id/analysis' params={{ id: survey.id }}>
              <BarChart3 />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          数据分析
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant='ghost'
            size='icon'
            className='size-8'
            aria-label='查看填写记录'
          >
            <Link to='/survey/$id/record' params={{ id: survey.id }}>
              <ClipboardList />
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
            className='size-8'
            aria-label='更多操作'
            title='更多'
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant='destructive'
              onSelect={(e) => {
                e.preventDefault()
                setShowConfirm(true)
              }}
            >
              <Trash2 />
              删除
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title='确认删除问卷？'
        desc='删除问卷将同时清空该问卷下的所有答卷数据且无法恢复。您确定要删除吗？'
        confirmText='确认删除'
        cancelBtnText='取消'
        destructive
        handleConfirm={() => {
          onDelete(survey.id)
          setShowConfirm(false)
        }}
      />
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
        className='size-8'
        aria-label='已归档'
        title='已归档'
        disabled
      >
        <Pause />
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
          className='size-8'
          aria-label={label}
          onClick={onClick}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side='top' className='text-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
