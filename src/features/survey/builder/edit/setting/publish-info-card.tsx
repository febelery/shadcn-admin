import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemGroup, ItemTitle, ItemActions } from '@/components/ui/item'
import { useBuilderStore } from '../../store'

export function PublishInfoCard() {
  const schema = useBuilderStore((s) => s.schema)

  if (!schema?.slug) return null

  return (
    <Card className='gap-0 py-0 shadow-sm'>
      <CardHeader className='px-4 py-3'>
        <CardTitle className='text-muted-foreground text-xs font-medium'>
          发布信息
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4 pt-0 pb-4'>
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
                {schema.slug}
              </code>
            </ItemActions>
          </Item>
          <Item size='sm' className='justify-between rounded-none px-0 py-1.5'>
            <ItemTitle className='text-muted-foreground text-xs font-normal'>
              版本
            </ItemTitle>
            <ItemActions>
              <code
                className={cn(
                  'text-muted-foreground font-mono text-xs leading-none tabular-nums',
                  'bg-muted rounded px-1.5 py-0.5'
                )}
              >
                v{schema.version}
              </code>
            </ItemActions>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
