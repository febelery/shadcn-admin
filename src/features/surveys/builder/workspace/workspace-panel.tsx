import { Fragment, useMemo } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid, LayoutTemplate } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { getEditorSection } from '../../core/editor-schema'
import type { SurveyElement, SurveyMeta, ThemeConfig } from '../../core/types'
import { SurveyCoverHeader } from '../../shared/survey-cover-header'
import {
  buildQuestionDisplayOrdinalMap,
  buildQuestionOrdinalMap,
  getQuestionNumberingMode,
  getSurveyDefaultNumberingStyle,
} from '../../shared/question-numbering'
import { useIsPaletteDragging } from '../components/builder-dnd-provider'
import { BuilderGuidance } from '../components/builder-guidance'
import { BuilderPanelHeader } from '../components/builder-panel-header'
import { LABEL_LIMITS } from '../label-limits'
import { InlineEditable } from '../question-surface/inline-editable'
import { useBuilderStore } from '../store'
import {
  builderGuidanceCanvas,
  builderTypeBody,
  builderTypeDisplay,
  builderWorkspaceArea,
  builderWorkspaceInner,
  builderWorkspaceScroll,
  builderQuestionList,
  builderSurveyBody,
  builderSurveyFrame,
} from '../ui'
import { WorkspaceAddFooter } from './add-footer'
import { WorkspaceElementCard } from './element-card'
import { WorkspaceInsertSlot } from './insert-slot'
import { useScrollSelectedIntoWorkspace } from './use-workspace-scroll'
import { BUILDER_WORKSPACE_SCROLL_ATTR } from './workspace-scroll'

function WorkspaceSurveyCover({
  meta,
  theme,
}: {
  meta: SurveyMeta
  theme: ThemeConfig
}) {
  const hasCoverImage = Boolean(meta.cover)
  const onLightText =
    meta.coverType === 'color' || (meta.coverType === 'image' && hasCoverImage)

  const titleClass = cn(
    builderTypeDisplay,
    onLightText ? 'text-white' : 'text-foreground'
  )
  const descriptionClass = cn(
    builderTypeBody,
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
          onChange={(title) =>
            useBuilderStore.getState().updateMeta({ title })
          }
          placeholder='未命名问卷'
          maxLength={LABEL_LIMITS.surveyTitle}
          className={cn(titleClass, 'max-w-full min-w-0 wrap-break-word')}
        />
      }
      descriptionSlot={
        <InlineEditable
          value={meta.description}
          onChange={(description) =>
            useBuilderStore.getState().updateMeta({ description })
          }
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
  const {
    schema,
    selectedSectionId,
    selectedElementId,
    elements,
  } = useBuilderStore(
    useShallow((s) => {
      const section = s.schema ? getEditorSection(s.schema) : undefined
      return {
        schema: s.schema,
        selectedSectionId: s.selectedSectionId,
        selectedElementId: s.selectedElementId,
        elements: section?.elements ?? [],
      }
    })
  )

  const isPaletteDragging = useIsPaletteDragging()

  const numbering = useMemo(() => {
    if (!schema) return null
    return {
      globalOrdinalMap: buildQuestionOrdinalMap(schema),
      displayOrdinalMap: buildQuestionDisplayOrdinalMap(schema),
      surveyDefaultNumbering: getSurveyDefaultNumberingStyle(schema),
      numberingMode: getQuestionNumberingMode(schema),
    }
  }, [schema])

  const activeSection = schema ? getEditorSection(schema) : undefined
  const sectionId = activeSection?.id ?? selectedSectionId

  useScrollSelectedIntoWorkspace({ selectedElementId })

  if (!schema || !activeSection || !sectionId) {
    return (
      <main className={builderWorkspaceArea}>
        <BuilderPanelHeader
          icon={LayoutTemplate}
          title='画布'
          description='问卷题目编排'
        />
        <BuilderGuidance
          className={builderGuidanceCanvas}
          title='暂无可用页面'
          description='问卷数据异常或尚未初始化，请刷新后重试。'
        />
      </main>
    )
  }

  const renderElementCard = (el: SurveyElement) => {
    const numberingProps =
      el.kind === 'question' && numbering
        ? {
            globalOrdinal: numbering.globalOrdinalMap.get(el.id) ?? 1,
            displayOrdinal: numbering.displayOrdinalMap.get(el.id) ?? null,
            numberingMode: numbering.numberingMode,
            surveyDefaultNumbering: numbering.surveyDefaultNumbering,
          }
        : {}

    return (
      <WorkspaceElementCard
        sectionId={sectionId}
        element={el}
        selected={selectedElementId === el.id}
        dimmed={isPaletteDragging}
        {...numberingProps}
      />
    )
  }

  return (
    <main className={builderWorkspaceArea}>
      <BuilderPanelHeader
        icon={LayoutTemplate}
        title='画布'
        description='问卷题目编排'
      />

      <div
        className={builderWorkspaceScroll}
        {...{ [BUILDER_WORKSPACE_SCROLL_ATTR]: '' }}
      >
        <div className={builderWorkspaceInner}>
          <div className={builderSurveyFrame}>
            <WorkspaceSurveyCover meta={schema.meta} theme={schema.theme} />

            <div className={builderSurveyBody}>
              {elements.length === 0 && !isPaletteDragging && (
                <BuilderGuidance
                  className={builderGuidanceCanvas}
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
                <div className={builderQuestionList}>
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
    </main>
  )
}
