import { Fragment } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid, LayoutTemplate } from 'lucide-react'
import { getEditorSection } from '../../core/editor-schema'
import { useBuilderDnd } from '../components/builder-dnd-provider'
import { BuilderGuidance } from '../components/builder-guidance'
import { BuilderPanelHeader } from '../components/builder-panel-header'
import { BuilderSurveyCover } from '../components/builder-survey-cover'
import { useBuilderStore } from '../store'
import {
  builderGuidanceCanvas,
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

export function BuilderWorkspacePanel() {
  const schema = useBuilderStore((s) => s.schema)!
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)
  const { activeDrag } = useBuilderDnd()
  const isPaletteDragging = activeDrag?.kind === 'palette'

  const activeSection = getEditorSection(schema)
  const sectionId = activeSection?.id ?? selectedSectionId

  useScrollSelectedIntoWorkspace({ selectedElementId })

  if (!activeSection || !sectionId) {
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
            <BuilderSurveyCover meta={schema.meta} theme={schema.theme} />

            <div className={builderSurveyBody}>
              {activeSection.elements.length === 0 && !isPaletteDragging && (
                <BuilderGuidance
                  className={builderGuidanceCanvas}
                  icon={LayoutGrid}
                  title='从左侧拖入或点击添加题目'
                  description='在画布上直接编辑题目与选项；选中题目后可在右侧属性面板调整设置。'
                />
              )}

              {activeSection.elements.length === 0 && isPaletteDragging && (
                <WorkspaceInsertSlot sectionId={sectionId} index={0} />
              )}

              <SortableContext
                items={activeSection.elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={builderQuestionList}>
                  {activeSection.elements.map((el, index) => (
                    <Fragment key={el.id}>
                      <WorkspaceInsertSlot
                        sectionId={sectionId}
                        index={index}
                      />
                      <WorkspaceElementCard
                        sectionId={sectionId}
                        element={el}
                        selected={selectedElementId === el.id}
                        dimmed={isPaletteDragging}
                      />
                    </Fragment>
                  ))}
                </div>
              </SortableContext>

              {activeSection.elements.length > 0 && (
                <WorkspaceInsertSlot
                  sectionId={sectionId}
                  index={activeSection.elements.length}
                />
              )}

              {activeSection.elements.length > 0 ? (
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
