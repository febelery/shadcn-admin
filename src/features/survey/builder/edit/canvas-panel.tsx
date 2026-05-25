import { Fragment } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SurveyCoverHeader } from '@/features/survey/shared/survey-cover-header'
import { getEditorSection } from '../../core/editor-schema'
import { useBuilderStore } from '../store'
import { useIsPaletteDragging } from '../shared/dnd-provider'
import { BuilderPanelHeader } from '../shared/panel-header'
import { LABEL_LIMITS } from '../store'
import type { SurveyElement } from '../types'
import { WorkspaceAddFooter } from './add-footer'
import { WorkspaceElementCard } from './element-card'
import { BuilderGuidance } from './guidance'
import { InlineEditable } from './inline-editable'
import { WorkspaceInsertSlot } from './insert-slot'
import {
  useScrollSelectedIntoWorkspace,
  BUILDER_WORKSPACE_SCROLL_ATTR,
} from './workspace-scroll'

function WorkspaceSurveyCover() {
  const schema = useBuilderStore((s) => s.schema)
  const updateMeta = useBuilderStore((s) => s.updateMeta)
  if (!schema) return null
  const { meta, theme } = schema

  const hasCoverImage = Boolean(meta.cover)
  const onLightText =
    meta.coverType === 'color' || (meta.coverType === 'image' && hasCoverImage)

  const titleClass = cn(
    'text-xl font-semibold tracking-tight leading-tight sm:text-2xl',
    onLightText ? 'text-white' : 'text-foreground'
  )
  const descriptionClass = cn(
    'text-sm leading-relaxed',
    'mt-2 min-h-[1.25em]',
    onLightText ? 'text-white/90' : 'text-muted-foreground'
  )

  return (
    <SurveyCoverHeader
      meta={meta}
      theme={theme}
      titleSlot={
        <InlineEditable
          value={meta.title}
          onChange={(title) => updateMeta({ title })}
          placeholder='未命名问卷'
          maxLength={LABEL_LIMITS.surveyTitle}
          className={cn(titleClass, 'max-w-full min-w-0 wrap-break-word')}
        />
      }
      descriptionSlot={
        <InlineEditable
          value={meta.description}
          onChange={(description) => updateMeta({ description })}
          placeholder='添加问卷说明（选填）'
          multiline
          maxLength={LABEL_LIMITS.surveyDescription}
          className={cn(descriptionClass, 'max-w-full min-w-0')}
        />
      }
    />
  )
}

export function BuilderWorkspacePanel() {
  const schema = useBuilderStore((s) => s.schema)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)

  const section = schema ? getEditorSection(schema) : undefined
  const sectionId = section?.id ?? selectedSectionId
  const elements = section?.elements ?? []
  const isPaletteDragging = useIsPaletteDragging()

  useScrollSelectedIntoWorkspace({ selectedElementId })

  if (!schema || !sectionId) {
    return (
      <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
        <BuilderPanelHeader icon={LayoutTemplate} title='题目' />
        <BuilderGuidance
          className='flex flex-1 flex-col items-center justify-center gap-1.5 py-20 text-center'
          title='暂无可用页面'
          description='问卷 data 异常或尚未初始化，请刷新后重试。'
        />
      </div>
    )
  }

  const renderElementCard = (el: SurveyElement) => {
    return (
      <WorkspaceElementCard
        sectionId={sectionId}
        element={el}
        selected={selectedElementId === el.id}
      />
    )
  }

  return (
    <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
      <BuilderPanelHeader icon={LayoutTemplate} title='题目' />

      <div
        className='min-h-0 flex-1 overflow-y-auto pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'
        {...{ [BUILDER_WORKSPACE_SCROLL_ATTR]: '' }}
      >
        <div className='flex w-full flex-col px-4 py-6 @6xl/content:mx-auto @6xl/content:w-full @6xl/content:max-w-6xl'>
          <div className='bg-card text-card-foreground border-border/80 w-full overflow-hidden rounded-xl border shadow-md'>
            <WorkspaceSurveyCover />

            <div className='flex min-h-[320px] min-w-0 flex-col overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12'>
              {elements.length === 0 && !isPaletteDragging && (
                <BuilderGuidance
                  className='flex flex-1 flex-col items-center justify-center gap-1.5 py-20 text-center'
                  icon={LayoutGrid}
                  title='从左侧拖入或点击添加题目'
                  description='在画布上直接编辑题目与选项；选中题目后可在右侧属性面板调整设置。'
                />
              )}

              {elements.length === 0 && isPaletteDragging && (
                <WorkspaceInsertSlot sectionId={sectionId} index={0} />
              )}

              <SortableContext
                items={elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='flex flex-col gap-1'>
                  {elements.map((el, index) => (
                    <Fragment key={el.id}>
                      <WorkspaceInsertSlot
                        sectionId={sectionId}
                        index={index}
                      />
                      {renderElementCard(el)}
                    </Fragment>
                  ))}
                </div>
              </SortableContext>

              {elements.length > 0 && (
                <WorkspaceInsertSlot
                  sectionId={sectionId}
                  index={elements.length}
                />
              )}

              {elements.length > 0 ? (
                <WorkspaceAddFooter
                  sectionId={sectionId}
                  highlight={isPaletteDragging}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
