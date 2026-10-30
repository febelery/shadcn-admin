import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { cn } from 'cn'
import { AlertCircle, ArrowLeft, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createEmptySurvey } from '../core/document-factory'
import { parseSurveyDocument } from '../core/document-schema'
import type { SurveyDocument } from '../core/types'
import {
  applySurveySettingsValues,
  type SurveySettingsFormValues,
} from '../settings/form-schema'
import {
  useCreateSurvey,
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
import { SettingsWorkspace } from './settings/workspace'
import { UnsavedChangesBlocker } from './unsaved-changes-blocker'

type Props = { mode: 'create' } | { mode: 'edit'; surveyId: string }

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

  const persistDocument = async (
    doc: SurveyDocument
  ): Promise<SurveyDocument> => {
    if (isCreate) {
      return create(doc)
    }
    return save({
      id: surveyId!,
      data: { ...doc, id: surveyId! },
    })
  }

  // 配置页提交：由 TanStack Form 校验通过后回调
  const handleSaveFromSettings = async (values: SurveySettingsFormValues) => {
    if (hasUnappliedRuleDraft) {
      toast.error('请先应用或取消当前规则草稿')
      return
    }
    const snapshot = getDocumentSnapshot()
    const updated = applySurveySettingsValues(snapshot, values)
    const valid = parseSurveyDocument(updated)
    const persisted = await persistDocument(valid)
    adoptDocument(persisted)
    toast.success(isCreate ? '已新建' : '已保存')
    if (isCreate) {
      await router.navigate({
        to: '/survey/$id/edit',
        params: { id: persisted.id },
        replace: true,
      })
    }
  }

  // 题目或流程页提交：直接保存当前快照
  const handleSaveFromOther = async () => {
    if (hasUnappliedRuleDraft) {
      toast.error('请先应用或取消当前规则草稿')
      return
    }
    const snapshot = getDocumentSnapshot()
    const valid = parseSurveyDocument(snapshot)
    const persisted = await persistDocument(valid)
    adoptDocument(persisted)
    toast.success('已保存')
  }

  const saveDisabled =
    saving || creating || hasUnappliedRuleDraft || (!isCreate && !isDirty)

  return (
    <div className='bg-background flex h-svh flex-col overflow-hidden antialiased'>
      <UnsavedChangesBlocker />
      <header
        className={cn(
          'border-border/80 bg-background/95 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm',
          'grid grid-cols-[1fr_auto_1fr] gap-2 px-3 sm:gap-3 sm:px-5'
        )}
      >
        <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0'
            nativeButton={false}
            render={<Link to='/survey' />}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='flex min-w-0 items-center'>
            <h1
              className='max-w-[12rem] truncate text-base font-semibold sm:max-w-xs md:max-w-md'
              title={surveyTitle || '未命名问卷'}
            >
              {surveyTitle || '未命名问卷'}
            </h1>
          </div>
        </div>
        <Tabs
          value={builderMode}
          onValueChange={(value) => {
            if (value === 'settings') {
              if (builderMode === 'flow') leaveToEdit()
              navigate({ type: 'show-settings' })
            } else if (value === 'edit') {
              leaveToEdit()
            } else {
              navigate({ type: 'show-flow' })
            }
          }}
          className='justify-self-center'
        >
          <TabsList className='h-8 sm:h-9'>
            <TabsTrigger value='settings' className='px-2.5 text-xs sm:px-4'>
              配置
            </TabsTrigger>
            <TabsTrigger value='edit' className='px-2.5 text-xs sm:px-4'>
              题目
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
            type={builderMode === 'settings' ? 'submit' : 'button'}
            form={
              builderMode === 'settings' ? 'survey-settings-form' : undefined
            }
            onClick={
              builderMode === 'settings' ? undefined : handleSaveFromOther
            }
            disabled={saveDisabled}
          >
            {saving || creating ? (
              <Spinner className='size-4' />
            ) : (
              <Save className='size-4' />
            )}
            <span className='sr-only'>{isCreate ? '新建' : '保存'}</span>
          </Button>
          <Button
            variant='outline'
            className='hidden sm:inline-flex'
            type={builderMode === 'settings' ? 'submit' : 'button'}
            form={
              builderMode === 'settings' ? 'survey-settings-form' : undefined
            }
            onClick={
              builderMode === 'settings' ? undefined : handleSaveFromOther
            }
            disabled={saveDisabled}
          >
            {saving || creating ? (
              <Spinner className='mr-2 size-4' />
            ) : (
              <Save className='mr-2 size-4' />
            )}
            {isCreate ? '新建' : '保存'}
          </Button>
        </div>
      </header>

      {builderMode === 'settings' && (
        <SettingsWorkspace onSave={handleSaveFromSettings} />
      )}
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
    <div className='flex h-svh flex-col'>
      <header className='border-border flex h-16 shrink-0 items-center justify-between border-b px-6'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-9 w-20' />
      </header>
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <Spinner className='text-muted-foreground size-8' />
          <p className='text-muted-foreground text-sm'>加载问卷数据中...</p>
        </div>
      </div>
    </div>
  )
}

function BuilderErrorState({
  onRetry,
  retrying,
}: {
  onRetry: () => void
  retrying?: boolean
}) {
  return (
    <div className='flex h-svh flex-col'>
      <header className='border-border flex h-16 shrink-0 items-center justify-between border-b px-6'>
        <Button
          variant='ghost'
          size='icon'
          nativeButton={false}
          render={<Link to='/survey' />}
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <span className='text-muted-foreground text-sm font-medium'>出错了</span>
        <div className='w-9' />
      </header>
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex max-w-sm flex-col items-center gap-3 text-center'>
          <AlertCircle className='text-destructive size-10' />
          <h2 className='text-lg font-semibold'>问卷加载失败</h2>
          <p className='text-muted-foreground text-sm'>
            无法获取问卷详情，请检查网络或确认问卷是否存在。
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={onRetry}
            disabled={retrying}
            className='mt-2'
          >
            {retrying ? (
              <Spinner className='mr-1.5 size-3.5' />
            ) : (
              <RefreshCw className='mr-1.5 size-3.5' />
            )}
            重新加载
          </Button>
        </div>
      </div>
    </div>
  )
}
