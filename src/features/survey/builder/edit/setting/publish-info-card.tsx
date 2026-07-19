import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { Item, ItemGroup, ItemTitle, ItemActions } from '@/components/ui/item'
import { useBuilderStore } from '../../builder-session'

export function PublishInfoCard() {
  const { slug, revision } = useBuilderStore(
    useShallow((state) => ({
      slug: state.document.slug,
      revision: state.document.revision,
    }))
  )

  if (!slug) return null

  return (
    <section className='border-border/70 border-b px-4 py-4'>
      <h3 className='mb-2 text-sm font-semibold'>发布信息</h3>
      <div>
        <ItemGroup>
          <Item
            size='sm'
            className='border-border/45 justify-between rounded-none border-b px-0 py-1.5'
          >
            <ItemTitle className='text-muted-foreground text-xs font-normal'>
              标识
            </ItemTitle>
            <ItemActions>
              <code
                className={cn(
                  'text-muted-foreground font-mono text-xs leading-none tabular-nums',
                  'bg-muted rounded px-1.5 py-0.5'
                )}
              >
                {slug}
              </code>
            </ItemActions>
          </Item>
          <Item size='sm' className='justify-between rounded-none px-0 py-1.5'>
            <ItemTitle className='text-muted-foreground text-xs font-normal'>
              修订
            </ItemTitle>
            <ItemActions>
              <code
                className={cn(
                  'text-muted-foreground font-mono text-xs leading-none tabular-nums',
                  'bg-muted rounded px-1.5 py-0.5'
                )}
              >
                r{revision}
              </code>
            </ItemActions>
          </Item>
        </ItemGroup>
      </div>
    </section>
  )
}
