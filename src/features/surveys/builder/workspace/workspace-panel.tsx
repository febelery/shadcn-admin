import { Fragment } from 'react'
import { BUILDER_WORKSPACE_SCROLL_ATTR } from './workspace-scroll'
import { useScrollSelectedIntoWorkspace } from './use-workspace-scroll'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutTemplate } from 'lucide-react'
import { getEditorSection } from '../../core/editor-schema'
import { useBuilderStore } from '../store'
import {
  builderWorkspaceArea,
  builderWorkspaceEmpty,
  builderWorkspaceInner,
  builderWorkspaceScroll,
  builderQuestionList,
  builderSurveyBody,
  builderSurveyFrame,
} from '../ui'
import { BuilderSurveyCover } from '../components/builder-survey-cover'
import { useBuilderDnd } from '../components/builder-dnd-provider'
import { BuilderPanelHeader } from '../components/builder-panel-header'
import { WorkspaceAddFooter } from './add-footer'
import { WorkspaceElementCard } from './element-card'
import { WorkspaceInsertSlot } from './insert-slot'

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
        <div className='text-muted-foreground flex flex-1 items-center justify-center text-sm'>
          暂无题目
        </div>
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

      <div className={builderWorkspaceScroll} {...{ [BUILDER_WORKSPACE_SCROLL_ATTR]: '' }}>
        <div className={builderWorkspaceInner}>
          <div className={builderSurveyFrame}>
            <BuilderSurveyCover meta={schema.meta} theme={schema.theme} />

            <div className={builderSurveyBody}>
              {activeSection.elements.length === 0 && !isPaletteDragging && (
                <div className={builderWorkspaceEmpty}>
                  <p className='text-sm'>从左侧拖入或点击添加题目</p>
                  <p className='max-w-xs text-xs leading-relaxed'>
                    在画布上直接编辑题目与选项
                  </p>
                </div>
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
                      <WorkspaceInsertSlot sectionId={sectionId} index={index} />
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
