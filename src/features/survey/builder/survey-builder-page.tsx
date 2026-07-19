import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, RefreshCw, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createEmptySurvey } from '../core/document-factory'
import { parseSurveyDocument } from '../core/document-schema'
import { analyseSurvey } from '../core/logic/analyzer'
import type { SurveyDocument } from '../core/types'
import {
  useCreateSurvey,
  usePublishSurvey,
  useSurveyDetail,
  useUpdateSurvey,
} from '../query/hooks'
import {
  BuilderStoreProvider,
  createBuilderStore,
  useBuilderStore,
} from './builder-session'
import { EditWorkspace } from './edit/workspace'
import { FlowWorkspace } from './flow/workspace'
import { useRuleAuthoring } from './session/rule-authoring'
import { RuleAuthoringProvider } from './session/rule-authoring-provider'
import { hasRuleDraftChanges } from './session/rule-draft'
import { UnsavedChangesBlocker } from './unsaved-changes-blocker'

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

function parseValidDocument(document: SurveyDocument): SurveyDocument | null {
  try {
    return parseSurveyDocument(document)
  } catch (err) {
    toast.error(formatSchemaValidationError(err))
    return null
  }
}

function SurveyBuilderSession({
  initialDocument,
  props,
}: {
  initialDocument: SurveyDocument
  props: Props
}) {
  const [store] = useState(() => createBuilderStore(initialDocument))

  return (
    <BuilderStoreProvider store={store}>
      <RuleAuthoringProvider>
        <SurveyBuilderContent props={props} />
      </RuleAuthoringProvider>
    </BuilderStoreProvider>
  )
}

function SurveyBuilderContent({ props }: { props: Props }) {
  const isCreate = props.mode === 'create'
  const surveyId = props.mode === 'edit' ? props.surveyId : undefined
  const router = useRouter()

  const { mutateAsync: create, isPending: creating } = useCreateSurvey()
  const { mutateAsync: save, isPending: saving } = useUpdateSurvey()
  const { mutateAsync: publish, isPending: publishing } = usePublishSurvey()

  const surveyTitle = useBuilderStore((s) => s.document.meta.title)
  const isDirty = useBuilderStore((s) => s.isDirty)
  const adoptDocument = useBuilderStore((s) => s.adoptDocument)
  const getDocumentSnapshot = useBuilderStore((s) => s.getDocumentSnapshot)
  const builderMode = useBuilderStore((s) => s.builderMode)
  const hasUnappliedRuleDraft = useBuilderStore((s) =>
    hasRuleDraftChanges(s.ruleDraft)
  )
  const navigate = useBuilderStore((s) => s.navigate)
  const { leaveToEdit } = useRuleAuthoring()
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  const persistDocument = async (
    document: SurveyDocument
  ): Promise<SurveyDocument> => {
    if (isCreate) {
      return create(document)
    }
    return save({
      id: surveyId!,
      data: { ...document, id: surveyId! },
    })
  }

  const handleSave = async () => {
    if (hasUnappliedRuleDraft) {
      toast.error('请先应用或取消当前规则草稿')
      return
    }
    const document = parseValidDocument(getDocumentSnapshot())
    if (!document) return
    const persisted = await persistDocument(document)
    adoptDocument(persisted)
    toast.success(isCreate ? '问卷已创建' : '已保存')
    if (isCreate) {
      await router.navigate({
        to: '/survey/$id/edit',
        params: { id: persisted.id },
        replace: true,
      })
    }
  }

  const handlePublish = async () => {
    if (hasUnappliedRuleDraft) {
      toast.error('请先应用或取消当前规则草稿')
      return
    }
    if (isCreate) {
      toast.error('请先保存问卷后再发布')
      return
    }
    const document = parseValidDocument(getDocumentSnapshot())
    if (!document) return
    const issues = analyseSurvey(document).filter((i) => i.severity === 'error')
    if (issues.length) {
      toast.error(issues[0].message)
      return
    }
    await save({ id: surveyId!, data: { ...document, id: surveyId! } })
    const published = await publish(surveyId!)
    adoptDocument(published)
    toast.success(`已发布，访问标识：${published.slug}`)
  }

  const saveDisabled =
    saving || creating || hasUnappliedRuleDraft || (!isCreate && !isDirty)

  return (
    <div className='bg-background flex h-svh flex-col antialiased'>
      <UnsavedChangesBlocker />
      <header
        className={cn(
          'border-border/80 bg-background/95 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm',
          'grid grid-cols-[1fr_auto_1fr] gap-2 px-3 sm:gap-3 sm:px-5'
        )}
      >
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <Button variant='ghost' size='icon' className='shrink-0' asChild>
            <Link to='/survey'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-muted-foreground hidden text-[11px] leading-none font-medium sm:block'>
              {builderMode === 'flow' ? '流程逻辑' : '问卷编辑'}
            </span>
            <Input
              aria-label='问卷标题'
              className={cn(
                'placeholder:text-muted-foreground/50 h-7 text-lg leading-none font-semibold',
                'min-w-0 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 sm:max-w-md'
              )}
              value={surveyTitle}
              placeholder='问卷标题'
              onChange={(e) => updateMeta({ title: e.target.value })}
            />
          </div>
        </div>
        <Tabs
          value={builderMode}
          onValueChange={(value) => {
            if (value === 'edit') leaveToEdit()
            else navigate({ type: 'show-flow' })
          }}
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
            <span className='text-muted-foreground hidden items-center gap-1.5 text-xs tabular-nums sm:flex'>
              <span
                className='size-1.5 rounded-full bg-amber-500'
                aria-hidden
              />
              {isCreate ? '新建草稿' : '未保存'}
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
              <Spinner className='size-4' />
            ) : (
              <Save className='size-4' />
            )}
            <span className='sr-only'>保存</span>
          </Button>
          <Button
            size='icon'
            className='sm:hidden'
            onClick={handlePublish}
            disabled={publishing || isCreate || hasUnappliedRuleDraft}
          >
            {publishing ? (
              <Spinner className='size-4' />
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
              <Spinner className='mr-2 size-4' />
            ) : (
              <Save className='mr-2 size-4' />
            )}
            {isCreate ? '创建' : '保存'}
          </Button>
          <Button
            className='hidden sm:inline-flex'
            onClick={handlePublish}
            disabled={publishing || isCreate || hasUnappliedRuleDraft}
          >
            {publishing ? (
              <Spinner className='mr-2 size-4' />
            ) : (
              <Send className='mr-2 size-4' />
            )}
            发布
          </Button>
        </div>
      </header>

      {builderMode === 'edit' && <EditWorkspace />}
      {builderMode === 'flow' && <FlowWorkspace />}
    </div>
  )
}

export function SurveyBuilderPage(props: Props) {
  const isCreate = props.mode === 'create'
  const surveyId = props.mode === 'edit' ? props.surveyId : undefined
  const [emptySurvey] = useState(createEmptySurvey)
  const { data, isLoading, isError, isFetching, refetch } = useSurveyDetail(
    surveyId ?? '',
    {
      enabled: !isCreate,
      suppressGlobalError: !isCreate,
    }
  )

  if (!isCreate && isLoading) {
    return <BuilderLoadingState />
  }

  if (!isCreate && isError) {
    return (
      <BuilderErrorState onRetry={() => void refetch()} retrying={isFetching} />
    )
  }

  const initialDocument = isCreate ? emptySurvey : data
  if (!initialDocument) return null

  return (
    <SurveyBuilderSession
      key={isCreate ? 'create' : initialDocument.id}
      initialDocument={initialDocument}
      props={props}
    />
  )
}

function BuilderLoadingState() {
  return (
    <div className='bg-muted/25 flex h-svh flex-col'>
      <header className='border-border/80 bg-background flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-5'>
        <Skeleton className='size-9 rounded-md' />
        <Skeleton className='h-7 w-56' />
        <div className='ms-auto flex gap-2'>
          <Skeleton className='h-9 w-20' />
          <Skeleton className='h-9 w-20' />
        </div>
      </header>
      <div className='grid min-h-0 flex-1 grid-cols-[18rem_minmax(0,1fr)_20rem]'>
        <aside className='border-border/80 bg-background border-r p-4'>
          <Skeleton className='mb-4 h-6 w-24' />
          <Skeleton className='mb-5 h-9 w-full' />
          <div className='space-y-2'>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className='h-9 w-full' />
            ))}
          </div>
        </aside>
        <main className='min-w-0 overflow-hidden p-6'>
          <Skeleton className='mx-auto h-full max-w-5xl rounded-lg' />
        </main>
        <aside className='border-border/80 bg-background border-l p-4'>
          <Skeleton className='mb-6 h-6 w-20' />
          <div className='space-y-5'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='space-y-2'>
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function BuilderErrorState({
  onRetry,
  retrying,
}: {
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <div className='bg-muted/25 flex h-svh flex-col'>
      <header className='border-border/80 bg-background flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-5'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/survey' aria-label='返回问卷列表'>
            <ArrowLeft className='size-4' />
          </Link>
        </Button>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-[11px] leading-none font-medium'>
            问卷编辑
          </span>
          <span className='text-base leading-none font-semibold'>
            暂时无法打开问卷
          </span>
        </div>
      </header>
      <main className='flex min-h-0 flex-1 items-center justify-center p-6'>
        <div
          role='alert'
          className='border-border bg-card flex max-w-md flex-col items-center gap-4 rounded-lg border px-8 py-10 text-center'
        >
          <div className='bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full'>
            <AlertCircle className='size-5' />
          </div>
          <div className='space-y-1.5'>
            <h1 className='text-xl font-semibold'>问卷加载失败</h1>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              问卷内容没有成功返回，当前编辑未受影响。请重试或返回列表选择其他问卷。
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' asChild>
              <Link to='/survey'>返回列表</Link>
            </Button>
            <Button onClick={onRetry} disabled={retrying}>
              <RefreshCw className={cn('size-4', retrying && 'animate-spin')} />
              {retrying ? '重试中' : '重新加载'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
