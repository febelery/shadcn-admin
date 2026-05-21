import { useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { analyseSurvey } from '../core/expression/parser'
import { createEmptySurvey } from '../core/schema-defaults'
import type { BuilderMode, SurveySchema } from '../core/types'
import { validateSurveySchema } from '../core/validators'
import {
  useCreateSurvey,
  usePublishSurvey,
  useSurveyDetail,
  useUpdateSurvey,
} from '../queries/hooks'
import { BuilderContextProvider } from './context'
import { EditWorkspace } from './edit/workspace'
import { FlowWorkspace } from './flow/workspace'
import { useBuilderStore } from './store'

type Props = { mode: 'create' } | { mode: 'edit'; surveyId: string }

function formatSchemaValidationError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'issues' in err &&
    Array.isArray((err as { issues: unknown }).issues)
  ) {
    const first = (err as { issues: { message: string }[] }).issues[0]
    if (first?.message) return first.message
  }
  return '问卷数据结构校验失败'
}

function assertValidPayload(payload: SurveySchema): boolean {
  try {
    validateSurveySchema(payload)
    return true
  } catch (err) {
    toast.error(formatSchemaValidationError(err))
    return false
  }
}

export function SurveyBuilderPage(props: Props) {
  const isCreate = props.mode === 'create'
  const surveyId = props.mode === 'edit' ? props.surveyId : undefined
  const router = useRouter()

  const { data, isLoading } = useSurveyDetail(surveyId ?? '', {
    enabled: !isCreate,
  })
  const { mutateAsync: create, isPending: creating } = useCreateSurvey()
  const { mutateAsync: save, isPending: saving } = useUpdateSurvey()
  const { mutateAsync: publish, isPending: publishing } = usePublishSurvey()

  const schema = useBuilderStore((s) => s.schema)
  const init = useBuilderStore((s) => s.init)
  const isDirty = useBuilderStore((s) => s.isDirty)
  const markSaved = useBuilderStore((s) => s.markSaved)
  const getSchemaForSave = useBuilderStore((s) => s.getSchemaForSave)
  const builderMode = useBuilderStore((s) => s.builderMode)
  const setBuilderMode = useBuilderStore((s) => s.setBuilderMode)
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  useEffect(() => {
    if (isCreate) init(createEmptySurvey())
  }, [isCreate, init])

  useEffect(() => {
    if (!isCreate && data) init(data)
  }, [isCreate, data, init])

  if (!isCreate && isLoading) {
    return (
      <div className='text-muted-foreground flex h-[50vh] items-center justify-center gap-2'>
        <Loader2 className='h-5 w-5 animate-spin' />
        加载问卷中…
      </div>
    )
  }

  if (!schema) {
    return null
  }

  const persistPayload = async (payload: SurveySchema): Promise<string> => {
    if (isCreate) {
      const { id } = await create(payload.meta.title)
      const persisted = { ...payload, id }
      await save({ id, data: persisted })
      await router.navigate({
        to: '/surveys/$id/edit',
        params: { id },
        replace: true,
      })
      return id
    }
    await save({ id: surveyId!, data: { ...payload, id: surveyId! } })
    return surveyId!
  }

  const handleSave = async () => {
    const payload = getSchemaForSave()
    if (!payload || !assertValidPayload(payload)) return
    await persistPayload(payload)
    markSaved()
    toast.success(isCreate ? '问卷已创建' : '已保存')
  }

  const handlePublish = async () => {
    if (isCreate) {
      toast.error('请先保存问卷后再发布')
      return
    }
    const payload = getSchemaForSave()
    if (!payload || !assertValidPayload(payload)) return
    const issues = analyseSurvey(payload).filter((i) => i.severity === 'error')
    if (issues.length) {
      toast.error(issues[0].message)
      return
    }
    await save({ id: surveyId!, data: { ...payload, id: surveyId! } })
    const res = await publish(surveyId!)
    markSaved()
    toast.success(`已发布，访问标识：${res.slug}`)
  }

  const saveDisabled = saving || creating || (!isCreate && !isDirty)

  return (
    <div className='bg-background flex h-svh flex-col antialiased'>
      <header
        className={cn(
          'border-border bg-background/80 supports-backdrop-filter:bg-background/70 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm',
          'grid grid-cols-[1fr_auto_1fr] gap-2 px-3 sm:gap-3 sm:px-5'
        )}
      >
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <Button variant='ghost' size='icon' className='shrink-0' asChild>
            <Link to='/surveys/list'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Input
            className={cn(
              'placeholder:text-muted-foreground/50 text-base leading-none font-semibold tracking-tight',
              'min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:max-w-md'
            )}
            value={schema.meta.title}
            placeholder='问卷标题'
            onChange={(e) => updateMeta({ title: e.target.value })}
          />
        </div>
        <Tabs
          value={builderMode}
          onValueChange={(v) => setBuilderMode(v as BuilderMode)}
          className='justify-self-center'
        >
          <TabsList className='h-8 sm:h-9'>
            <TabsTrigger value='edit' className='px-2.5 text-xs sm:px-4'>
              编辑
            </TabsTrigger>
            <TabsTrigger value='flow' className='px-2.5 text-xs sm:px-4'>
              流程
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='flex shrink-0 items-center justify-end gap-2 sm:gap-3'>
          {(isCreate || isDirty) && (
            <span className='text-muted-foreground text-xs tabular-nums'>
              {isCreate ? '新建' : '未保存'}
            </span>
          )}
          <Button
            variant='outline'
            size='icon'
            className='sm:hidden'
            onClick={handleSave}
            disabled={saveDisabled}
          >
            {saving || creating ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Save className='size-4' />
            )}
            <span className='sr-only'>保存</span>
          </Button>
          <Button
            size='icon'
            className='sm:hidden'
            onClick={handlePublish}
            disabled={publishing || isCreate}
          >
            {publishing ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Send className='size-4' />
            )}
            <span className='sr-only'>发布</span>
          </Button>
          <Button
            variant='outline'
            className='hidden sm:inline-flex'
            onClick={handleSave}
            disabled={saveDisabled}
          >
            {saving || creating ? (
              <Loader2 className='mr-2 size-4 animate-spin' />
            ) : (
              <Save className='mr-2 size-4' />
            )}
            {isCreate ? '创建' : '保存'}
          </Button>
          <Button
            className='hidden sm:inline-flex'
            onClick={handlePublish}
            disabled={publishing || isCreate}
          >
            {publishing ? (
              <Loader2 className='mr-2 size-4 animate-spin' />
            ) : (
              <Send className='mr-2 size-4' />
            )}
            发布
          </Button>
        </div>
      </header>

      <BuilderContextProvider>
        {builderMode === 'edit' && <EditWorkspace />}
        {builderMode === 'flow' && <FlowWorkspace />}
      </BuilderContextProvider>
    </div>
  )
}
