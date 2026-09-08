import { Fragment } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid, LayoutTemplate } from 'lucide-react'
import type { SurveyElement } from '../../core/types'
import { useBuilderStore } from '../builder-session'
import { useIsPaletteDragging } from '../shared/dnd-provider'
import { BuilderPanelHeader } from '../shared/panel-header'
import { WorkspaceAddFooter } from './add-footer'
import { WorkspaceElementCard } from './element-card'
import { BuilderGuidance } from './guidance'
import { WorkspaceInsertSlot } from './insert-slot'
import { BUILDER_WORKSPACE_SCROLL_ATTR } from './workspace-scroll'

export function BuilderWorkspacePanel() {
  const elements = useBuilderStore((s) => s.document.elements)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)

  const isPaletteDragging = useIsPaletteDragging()

  const renderElementCard = (el: SurveyElement) => {
    return (
      <WorkspaceElementCard
        element={el}
        selected={selectedElementId === el.id}
      />
    )
  }

  return (
    <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
      <BuilderPanelHeader icon={LayoutTemplate} title='题目画布' />

      <div
        className='min-h-0 flex-1 overflow-y-auto pb-[calc(3.25rem+env(safe-area-inset-bottom))] lg:pb-0'
        {...{ [BUILDER_WORKSPACE_SCROLL_ATTR]: '' }}
      >
        <div className='mx-auto flex w-full max-w-5xl flex-col px-5 py-6 sm:py-8'>
          <div className='bg-card text-card-foreground border-border w-full overflow-hidden rounded-lg border'>
            <div className='flex min-h-[360px] min-w-0 flex-col overflow-x-hidden px-5 py-8 sm:px-8 sm:py-10 md:px-12'>
              {elements.length === 0 && !isPaletteDragging && (
                <BuilderGuidance
                  className='border-primary/20 bg-primary/[0.025] flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed px-8 py-16 text-center'
                  icon={LayoutGrid}
                  title='从左侧拖入或点击添加题目'
                  description='在画布上直接编辑题目与选项；选中题目后可在右侧属性面板调整设置。'
                />
              )}

              {elements.length === 0 && isPaletteDragging && (
                <WorkspaceInsertSlot index={0} />
              )}

              <SortableContext
                items={elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='flex flex-col gap-1'>
                  {elements.map((el, index) => (
                    <Fragment key={el.id}>
                      <WorkspaceInsertSlot index={index} />
                      {renderElementCard(el)}
                    </Fragment>
                  ))}
                </div>
              </SortableContext>

              {elements.length > 0 && (
                <WorkspaceInsertSlot index={elements.length} />
              )}

              {elements.length > 0 ? (
                <WorkspaceAddFooter highlight={isPaletteDragging} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
