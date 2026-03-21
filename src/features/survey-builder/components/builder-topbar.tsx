import { useParams } from '@tanstack/react-router'
import {
  Eye,
  GitBranch,
  LayoutTemplate,
  Loader2,
  Redo2,
  Undo2,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUpdateSurvey } from '../hooks'
import { useConflictDetection } from '../hooks/use-conflict-detection'
import { useBuilderStore } from '../store'

export function BuilderTopbar() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })
  const {
    meta,
    builderMode,
    isDirty,
    setBuilderMode,
    markSaved,
    undo,
    redo,
    history,
    historyIndex,
  } = useBuilderStore()

  const { conflictRules } = useConflictDetection()

  const { mutate: updateSurvey, isPending: isSaving } = useUpdateSurvey()

  const handleSave = () => {
    if (!isDirty || isSaving) return

    // 延迟读取庞大的节点树，防止由顶层导致的全局重绘
    const state = useBuilderStore.getState()
    updateSurvey(
      {
        id: surveyId,
        data: {
          id: surveyId,
          version: state.version || '1',
          meta: state.meta,
          nodes: state.nodes,
          logic: state.logic,
          validations: [],
          extensions: state.extensions || {},
        },
      },
      {
        onSuccess: () => {
          markSaved()
          sessionStorage.removeItem(`survey-draft-${surveyId}`)
        },
      }
    )
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <TooltipProvider>
      <header className='bg-background relative z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4'>
        {/* Logo */}
        <div className='mr-2 flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-md'>
            <LayoutTemplate className='h-4 w-4' />
          </div>
          <span className='hidden text-sm font-semibold sm:block'>
            SurveyBuilder
          </span>
        </div>

        <Separator orientation='vertical' className='mx-2 h-5' />

        {/* Breadcrumb */}
        <nav className='hidden items-center gap-2 text-sm sm:flex'>
          <span className='text-foreground max-w-40 truncate font-medium md:max-w-[18rem]'>
            {meta.title || '未命名问卷'}
          </span>
        </nav>

        {/* Undo / Redo */}
        <div className='ml-2 flex items-center'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:bg-muted h-8 w-8 disabled:opacity-30'
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>撤销 ⌘Z</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:bg-muted h-8 w-8 disabled:opacity-30'
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重做 ⌘⇧Z</TooltipContent>
          </Tooltip>
        </div>

        {/* 中间模式切换 */}
        <ToggleGroup
          type='single'
          value={builderMode}
          onValueChange={(v) => {
            if (v) setBuilderMode(v as typeof builderMode)
          }}
          className='bg-muted absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center space-x-0 rounded-md p-1 shadow-sm'
        >
          <ToggleGroupItem
            value='build'
            className='data-[state=on]:bg-background data-[state=on]:text-foreground h-7 rounded-sm px-4 text-xs font-medium transition-all data-[state=on]:shadow-sm'
          >
            <LayoutTemplate className='mr-1.5 h-3.5 w-3.5' />
            构建
          </ToggleGroupItem>
          <ToggleGroupItem
            value='logic'
            className='data-[state=on]:bg-background data-[state=on]:text-foreground h-7 rounded-sm px-4 text-xs font-medium transition-all data-[state=on]:shadow-sm'
          >
            {conflictRules.length > 0 ? (
              <AlertTriangle className='text-destructive mr-1.5 h-3.5 w-3.5 animate-pulse' />
            ) : (
              <GitBranch className='mr-1.5 h-3.5 w-3.5' />
            )}
            逻辑
            {useBuilderStore.getState().logic.length > 0 && (
              <Badge
                variant='secondary'
                className={cn(
                  'ml-1.5 h-4 min-w-[16px] px-1 text-[9px] transition-colors',
                  conflictRules.length > 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {useBuilderStore.getState().logic.length}
              </Badge>
            )}
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Right actions */}
        <div className='ml-auto flex items-center gap-2'>
          {/* Save status */}
          <SaveButton
            isDirty={isDirty}
            isSaving={isSaving}
            onClick={handleSave}
          />

          <Separator orientation='vertical' className='h-4' />

          <Button variant='outline' size='sm' className='h-8 px-3 font-medium'>
            <Eye className='mr-1.5 h-3.5 w-3.5' />
            <span className='hidden sm:block'>预览</span>
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}

function SaveButton({
  isDirty,
  isSaving,
  onClick,
}: {
  isDirty: boolean
  isSaving: boolean
  onClick: () => void
}) {
  if (isSaving) {
    return (
      <Button
        size='sm'
        variant='ghost'
        className='h-8 px-3 text-xs font-medium'
        disabled
      >
        <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
        保存中…
      </Button>
    )
  }

  if (!isDirty) {
    return (
      <div className='text-muted-foreground flex items-center gap-1.5 px-2 text-xs'>
        <Check className='h-3.5 w-3.5' />
        已保存
      </div>
    )
  }

  return (
    <Button size='sm' className='h-8 px-4 text-xs shadow-sm' onClick={onClick}>
      保存修改
    </Button>
  )
}
