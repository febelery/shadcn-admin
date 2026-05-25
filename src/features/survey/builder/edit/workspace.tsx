import { useState } from 'react'
import { LayoutGrid, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getEditorSection } from '../../core/editor-schema'
import { useBuilderStore } from '../store'
import { BuilderDndProvider } from '../shared/dnd-provider'
import { BuilderWorkspacePanel } from './canvas-panel'
import { InspectorPanel } from './inspector/panel'
import { QuestionPalette } from './palette'

const desktopOnly = 'hidden lg:flex'

/** 编辑模式 · 完整工作区（含 DnD） */
export function EditWorkspace() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const sectionId = useBuilderStore((s) => s.schema ? getEditorSection(s.schema)?.id ?? s.selectedSectionId : s.selectedSectionId)

  return (
    <BuilderDndProvider sectionId={sectionId}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-72 min-w-0 shrink-0 flex-col overflow-hidden border-r',
            desktopOnly
          )}
        >
          <QuestionPalette />
        </aside>
        <main className='from-background via-muted/25 to-muted/40 @container/content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-linear-to-b'>
          <BuilderWorkspacePanel />
        </main>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-80 min-w-0 shrink-0 flex-col overflow-hidden border-l',
            desktopOnly
          )}
        >
          <InspectorPanel />
        </aside>
      </div>

      <div className='border-border bg-background/90 pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden'>
        <div className='pointer-events-auto flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => setPaletteOpen(true)}
          >
            <LayoutGrid className='size-4' />
            题型
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => setInspectorOpen(true)}
          >
            <Settings2 className='size-4' />
            属性
          </Button>
        </div>
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent
          side='left'
          className='flex w-[min(100vw,18rem)] flex-col gap-0 p-0 sm:max-w-xs'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>题型</SheetTitle>
          </SheetHeader>
          <QuestionPalette
            className='flex h-full w-full max-w-none shrink border-0'
            onNavigate={() => setPaletteOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>属性</SheetTitle>
          </SheetHeader>
          <InspectorPanel className='flex h-full w-full max-w-none shrink border-0' />
        </SheetContent>
      </Sheet>
    </BuilderDndProvider>
  )
}
