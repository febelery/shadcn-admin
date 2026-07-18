import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { EditWorkspace } from './edit/workspace'
import { FlowWorkspace } from './flow/workspace'
import {
  BuilderStoreProvider,
  createBuilderStore,
  useBuilderStore,
} from './store'
import { hasRuleDraftChanges } from './store/rule-authoring'
import { RuleAuthoringProvider } from './store/rule-authoring-provider'
import { useRuleAuthoring } from './store/use-rule-authoring'
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
          'border-border bg-background/80 supports-backdrop-filter:bg-background/70 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm',
          'grid grid-cols-[1fr_auto_1fr] gap-2 px-3 sm:gap-3 sm:px-5'
        )}
      >
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <Button variant='ghost' size='icon' className='shrink-0' asChild>
            <Link to='/survey'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Input
            className={cn(
              'placeholder:text-muted-foreground/50 text-base leading-none font-semibold tracking-tight',
              'min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:max-w-md'
            )}
            value={surveyTitle}
            placeholder='问卷标题'
            onChange={(e) => updateMeta({ title: e.target.value })}
          />
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
  const { data, isLoading } = useSurveyDetail(surveyId ?? '', {
    enabled: !isCreate,
  })

  if (!isCreate && isLoading) {
    return (
      <div className='text-muted-foreground flex h-[50vh] items-center justify-center gap-2'>
        <Spinner className='h-5 w-5' />
        加载问卷中…
      </div>
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
