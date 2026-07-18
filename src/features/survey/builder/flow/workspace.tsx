import { useState, useMemo } from 'react'
import { GitBranch, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useBuilderStore } from '../store'
import { buildRuleDraftPreviewDocument } from '../store/rule-authoring'
import { useRuleAuthoring } from '../store/use-rule-authoring'
import { CenterPanel } from './center-panel'
import { LeftPanel } from './left-panel'
import { createFlowProjector } from './projection'
import { RightPanel } from './right-panel'

const desktopOnly = 'hidden lg:flex'

export function FlowWorkspace() {
  const document = useBuilderStore((s) => s.document)
  const ruleDraft = useBuilderStore((s) => s.ruleDraft)
  const logicMobilePanel = useBuilderStore((s) => s.logicMobilePanel)
  const navigate = useBuilderStore((s) => s.navigate)
  const { clearRuleFocus } = useRuleAuthoring()
  const [project] = useState(createFlowProjector)
  const [projectPreview] = useState(createFlowProjector)
  const projection = useMemo(() => project(document), [document, project])
  const previewDocument = useMemo(
    () =>
      ruleDraft ? buildRuleDraftPreviewDocument(document, ruleDraft) : document,
    [document, ruleDraft]
  )
  const canvasProjection = useMemo(() => {
    if (!ruleDraft) return projection
    const preview = projectPreview(previewDocument)
    return {
      ...preview,
      // 草稿只叠加边，不参与正式拓扑布局和视口失效。
      layout: projection.layout,
      topologyKey: projection.topologyKey,
    }
  }, [previewDocument, projection, ruleDraft, projectPreview])

  return (
    <>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-80 min-w-0 shrink-0 flex-col overflow-hidden border-r 2xl:w-88',
            desktopOnly
          )}
        >
          <LeftPanel projection={projection} />
        </aside>
        <main className='from-background via-muted/25 to-muted/40 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-linear-to-b'>
          <CenterPanel
            projection={projection}
            canvasProjection={canvasProjection}
          />
        </main>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-80 min-w-0 shrink-0 flex-col overflow-hidden border-l 2xl:w-88',
            desktopOnly
          )}
        >
          <RightPanel projection={projection} />
        </aside>
      </div>

      <div className='border-border bg-background/90 pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden'>
        <div className='pointer-events-auto flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => navigate({ type: 'show-rule-list' })}
          >
            <GitBranch className='size-4' />
            规则
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => navigate({ type: 'show-current-rule-editor' })}
          >
            <Settings2 className='size-4' />
            编辑
          </Button>
        </div>
      </div>

      <Sheet
        open={logicMobilePanel === 'rules'}
        onOpenChange={(open) =>
          navigate({ type: open ? 'show-rule-list' : 'show-flow' })
        }
      >
        <SheetContent
          side='left'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>逻辑规则</SheetTitle>
          </SheetHeader>
          <LeftPanel
            projection={projection}
            className='flex h-full w-full max-w-none shrink border-0'
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={logicMobilePanel === 'editor'}
        onOpenChange={(open) => {
          if (open) navigate({ type: 'show-current-rule-editor' })
          else clearRuleFocus()
        }}
      >
        <SheetContent
          side='right'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>属性</SheetTitle>
          </SheetHeader>
          <RightPanel
            projection={projection}
            className='flex h-full w-full max-w-none shrink border-0'
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
