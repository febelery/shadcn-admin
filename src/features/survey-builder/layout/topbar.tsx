'use client'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Eye,
  GitBranch,
  LayoutTemplate,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useConflictDetection } from '../hooks/use-conflict-detection'
import { useUpdateSurvey } from '../hooks/use-update-survey'
import {
  useSchemaStore,
  useUIStore,
  useDraftStore,
  useFlowStore,
} from '../state'

export function BuilderTopbar() {
  const { surveyId } = useParams({ from: '/survey/builder/$surveyId' })
  const navigate = useNavigate()

  const title = useSchemaStore((s) => s.meta.title)
  const builderMode = useUIStore((s) => s.builderMode)
  const isDirty = useDraftStore((s) => s.isDirty)
  const flowCount = useFlowStore((s) => s.flow.length)
  const setBuilderMode = useUIStore((s) => s.setBuilderMode)
  const markSaved = useDraftStore((s) => s.markSaved)

  const { conflictRules } = useConflictDetection()
  const { mutate: updateSurvey, isPending: isSaving } = useUpdateSurvey()

  const handleSave = () => {
    if (!isDirty || isSaving) return
    const schema = useSchemaStore.getState()
    const flow = useFlowStore.getState()
    updateSurvey(
      {
        id: surveyId,
        data: {
          id: surveyId,
          version: schema.version ?? '1',
          meta: schema.meta,
          nodes: schema.nodes,
          flow: flow.flow,
          validations: [],
          extensions: schema.extensions ?? {},
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

  const handlePreview = () => {
    navigate({ to: '/survey/preview/$surveyId', params: { surveyId } })
  }

  return (
    <TooltipProvider>
      <header className='bg-background relative z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4'>
        <div className='mr-2 flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-md'>
            <LayoutTemplate className='h-4 w-4' />
          </div>
          <span className='hidden text-sm font-semibold sm:block'>
            SurveyBuilder
          </span>
        </div>

        <Separator orientation='vertical' className='mx-2 h-5' />

        <nav className='hidden items-center gap-2 text-sm sm:flex'>
          <span className='text-foreground max-w-40 truncate font-medium md:max-w-[18rem]'>
            {title || '未命名问卷'}
          </span>
        </nav>

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
            value='flow'
            className='data-[state=on]:bg-background data-[state=on]:text-foreground h-7 rounded-sm px-4 text-xs font-medium transition-all data-[state=on]:shadow-sm'
          >
            {conflictRules.length > 0 ? (
              <AlertTriangle className='text-destructive mr-1.5 h-3.5 w-3.5 animate-pulse' />
            ) : (
              <GitBranch className='mr-1.5 h-3.5 w-3.5' />
            )}
            流程
            {flowCount > 0 && (
              <Badge
                variant='secondary'
                className={cn(
                  'ml-1.5 h-4 min-w-[16px] px-1 text-[9px] transition-colors',
                  conflictRules.length > 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {flowCount}
              </Badge>
            )}
          </ToggleGroupItem>
        </ToggleGroup>

        <div className='ml-auto flex items-center gap-2'>
          <SaveButton
            isDirty={isDirty}
            isSaving={isSaving}
            onClick={handleSave}
          />
          <Separator orientation='vertical' className='h-4' />
          <Button
            variant='outline'
            size='sm'
            className='h-8 px-3 font-medium'
            onClick={handlePreview}
          >
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
