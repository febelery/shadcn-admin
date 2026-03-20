import { useParams } from '@tanstack/react-router'
import {
  Eye,
  GitBranch,
  LayoutTemplate,
  Loader2,
  Redo2,
  Undo2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBuilderStore } from '../store'
import { useUpdateSurvey } from '../hooks'

export function BuilderTopbar() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })
  const {
    meta,
    schema,
    logic,
    version,
    extensions,
    builderMode,
    isDirty,
    isSaving,
    setBuilderMode,
    setIsSaving,
    markSaved,
    undo,
    redo,
    history,
    historyIndex,
  } = useBuilderStore()

  const { mutate: updateSurvey } = useUpdateSurvey()

  const handleSave = () => {
    if (!isDirty || isSaving) return
    setIsSaving(true)
    updateSurvey(
      {
        id: surveyId,
        data: {
          id: surveyId,
          version: version || '1',
          meta,
          schema,
          logic,
          validations: [],
          extensions: extensions || {},
        },
      },
      {
        onSuccess: () => {
          markSaved()
          sessionStorage.removeItem(`survey-draft-${surveyId}`)
        },
        onError: () => setIsSaving(false),
      }
    )
  }

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <TooltipProvider>
      <header className='relative z-50 flex h-11 shrink-0 items-center gap-1 border-b border-border/50 bg-background/95 px-3 backdrop-blur-sm'>
        {/* Logo */}
        <div className='mr-1 flex items-center gap-2'>
          <div className='bg-foreground flex h-6 w-6 items-center justify-center rounded-md'>
            <LayoutTemplate className='text-background h-3.5 w-3.5' />
          </div>
          <span className='hidden text-sm font-semibold tracking-tight sm:block'>
            SurveyBuilder
          </span>
        </div>

        <Separator orientation='vertical' className='mx-2 h-4' />

        {/* Breadcrumb */}
        <nav className='hidden items-center gap-1 text-xs sm:flex'>
          <span className='text-muted-foreground/60 cursor-pointer transition hover:text-muted-foreground'>
            问卷库
          </span>
          <span className='text-border'>/</span>
          <span className='text-foreground/80 max-w-40 truncate font-medium md:max-w-[16rem]'>
            {meta.title || '未命名问卷'}
          </span>
        </nav>

        {/* Undo / Redo */}
        <div className='ml-1 flex items-center'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-muted-foreground disabled:opacity-30'
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>撤销 ⌘Z</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-muted-foreground disabled:opacity-30'
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重做 ⌘⇧Z</TooltipContent>
          </Tooltip>
        </div>

        {/* 中间模式切换 */}
        <div className='bg-muted/60 border-border/40 absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-lg border p-0.5'>
          <ModeTab
            active={builderMode === 'build'}
            onClick={() => setBuilderMode('build')}
            icon={<LayoutTemplate className='h-3.5 w-3.5' />}
            label='构建'
          />
          <ModeTab
            active={builderMode === 'logic'}
            onClick={() => setBuilderMode('logic')}
            icon={<GitBranch className='h-3.5 w-3.5' />}
            label='逻辑'
            badge={logic.length > 0 ? logic.length : undefined}
          />
        </div>

        {/* Right actions */}
        <div className='ml-auto flex items-center gap-2'>
          {/* Save status */}
          <SaveButton
            isDirty={isDirty}
            isSaving={isSaving}
            onClick={handleSave}
          />

          <Separator orientation='vertical' className='h-4' />

          <Button
            variant='outline'
            size='sm'
            className='h-7 gap-1.5 border-border/50 px-2.5 text-xs'
          >
            <Eye className='h-3.5 w-3.5' />
            <span className='hidden sm:block'>预览</span>
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}

// 子组件

function ModeTab({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size='sm'
      onClick={onClick}
      className={cn(
        'h-7 gap-1.5 px-2.5 text-xs font-medium transition-all duration-150',
        active ? 'bg-background shadow-xs' : 'text-muted-foreground'
      )}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <Badge
          variant='secondary'
          className='bg-primary/10 text-primary hover:bg-primary/10 h-4 min-w-4 px-1 text-[9px] font-bold'
        >
          {badge}
        </Badge>
      )}
    </Button>
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
        className='h-7 gap-1.5 rounded-full px-3 text-[11px]'
        disabled
      >
        <Loader2 className='h-3 w-3 animate-spin' />
        保存中…
      </Button>
    )
  }

  if (!isDirty) {
    return (
      <Badge
        variant='secondary'
        className='bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium'
      >
        <Check className='h-3 w-3' />
        已保存
      </Badge>
    )
  }

  return (
    <Button
      size='sm'
      className='h-7 rounded-full px-4 text-[11px] font-semibold'
      onClick={onClick}
    >
      保存
    </Button>
  )
}