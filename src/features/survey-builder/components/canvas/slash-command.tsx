import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_CATEGORIES,
} from '@/features/survey-builder/constants'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { NodeType } from '@/features/survey-builder/types'

export function SlashCommand() {
  const { slashOpen, slashAnchor, closeSlash, addNode, selectedNodeId } =
    useBuilderStore()

  const handleSelect = (type: NodeType) => {
    addNode(type, { afterId: selectedNodeId })
    closeSlash()
  }

  if (!slashOpen) return null

  return (
    <Popover open={slashOpen} onOpenChange={(open) => !open && closeSlash()}>
      <PopoverAnchor
        className='pointer-events-none invisible fixed'
        style={{
          left: slashAnchor?.x ?? 0,
          top: slashAnchor?.y ?? 0,
          width: 0,
          height: 0,
        }}
      />
      <PopoverContent
        side='bottom'
        align='start'
        sideOffset={0}
        className='z-500 w-64 overflow-hidden rounded-xl p-0 shadow-[0_8px_28px_rgba(0,0,0,.12),0_2px_8px_rgba(0,0,0,.06)]'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className='rounded-xl border-none'>
          <CommandInput placeholder='搜索题型…' className='h-11 text-sm' />
          <CommandList className='max-h-80'>
            <CommandEmpty>未找到匹配题型</CommandEmpty>
            {QUESTION_TYPE_CATEGORIES.map((cat) => (
              <CommandGroup key={cat} heading={cat}>
                {QUESTION_TYPES.filter((t) => t.category === cat).map(
                  (item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.type}
                        value={`${item.label} ${item.description}`}
                        onSelect={() => handleSelect(item.type)}
                        className='cursor-pointer gap-2.5 px-3 py-2'
                      >
                        <div className='border-border bg-muted text-muted-foreground group-hover:bg-background flex h-6 w-6 items-center justify-center rounded border transition-colors'>
                          <Icon className='h-3 w-3' />
                        </div>
                        <div>
                          <div className='text-xs font-medium'>
                            {item.label}
                          </div>
                          <div className='text-muted-foreground text-[10px]'>
                            {item.description}
                          </div>
                        </div>
                      </CommandItem>
                    )
                  }
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
