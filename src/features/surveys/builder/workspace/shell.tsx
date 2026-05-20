import { useState } from 'react'
import { LayoutGrid, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { InspectorPanel } from '../components/inspector-panel'
import { QuestionPalette } from '../components/question-palette'
import { builderMobileDock, builderTypeMicro, builderWorkspace } from '../ui'
import { BuilderWorkspacePanel } from './workspace-panel'

const desktopOnly = 'hidden lg:flex'

export function BuilderWorkspace() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  return (
    <>
      <div className={builderWorkspace}>
        <QuestionPalette className={desktopOnly} />
        <BuilderWorkspacePanel />
        <InspectorPanel className={desktopOnly} />
      </div>

      <div className={builderMobileDock}>
        <div className='pointer-events-auto flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className={cn('h-9 gap-1.5 shadow-sm', builderTypeMicro)}
            onClick={() => setPaletteOpen(true)}
          >
            <LayoutGrid className='size-4' />
            题型库
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className={cn('h-9 gap-1.5 shadow-sm', builderTypeMicro)}
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
            <SheetTitle>题型库</SheetTitle>
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
    </>
  )
}
