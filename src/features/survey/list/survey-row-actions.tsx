import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  ScrollText,
  MoreHorizontal,
  SquarePen,
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
import type { SurveyListItem } from '../core/admin-data-schema'

type SurveyRowActionsProps = {
  survey: SurveyListItem
  onDelete: (id: string) => void
}

export function SurveyRowActions({ survey, onDelete }: SurveyRowActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className='flex items-center justify-end gap-1'>
      <Button
        nativeButton={false}
        render={<Link to='/survey/$id/edit' params={{ id: survey.id }} />}
        variant='ghost'
        size='sm'
        className='h-8 px-2'
        aria-label='编辑问卷'
      >
        <SquarePen data-icon='inline-start' />
        编辑
      </Button>

      <Button
        nativeButton={false}
        render={<Link to='/survey/$id/record' params={{ id: survey.id }} />}
        variant='ghost'
        size='sm'
        className='h-8 px-2'
        aria-label='回收'
      >
        <ScrollText data-icon='inline-start' />
        回收
      </Button>

      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    aria-label='更多操作'
                  >
                    <MoreHorizontal />
                  </Button>
                }
              />
            }
          />
          <TooltipContent side='top' className='text-xs'>
            更多
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align='end' sideOffset={6}>
          <DropdownMenuGroup>
            <DropdownMenuItem
              render={
                <Link to='/survey/$id/analysis' params={{ id: survey.id }} />
              }
            >
              <BarChart3 />
              分析
            </DropdownMenuItem>
            <DropdownMenuItem
              variant='destructive'
              onClick={(e) => {
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
        title={`删除「${survey.title}」？`}
        desc='问卷和全部答卷将永久删除。'
        confirmText='删除'
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
