import { CornerDownRight, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addCascaderChild,
  createCascaderNode,
  removeCascaderNode,
  updateCascaderNode,
} from '@/features/survey/shared/cascader-adapters'
import type { CascaderNode } from '../../../../core/types'
import { BUILDER_TEXT_LIMITS } from '../../../shared/text-limits'
import { InspectorFormField, InspectorFormGroup } from './layout'
import type { QuestionInspectorProps } from './types'

type NodeRowProps = {
  node: CascaderNode
  depth: number
  rootCount: number
  nodes: CascaderNode[]
  onChange: (nodes: CascaderNode[]) => void
}

function CascaderTreeNodeRow({
  node,
  depth,
  rootCount,
  nodes,
  onChange,
}: NodeRowProps) {
  const childCount = node.children?.length ?? 0
  const canDelete = depth > 0 || rootCount > 1

  return (
    <>
      <div
        className='bg-muted/30 flex items-center gap-1 rounded-md border px-1 py-1'
        style={{ marginInlineStart: depth * 16 }}
      >
        {depth > 0 ? (
          <CornerDownRight className='text-muted-foreground size-3.5 shrink-0' />
        ) : (
          <span className='size-3.5 shrink-0' />
        )}
        <Input
          className={cn(
            'h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0',
            'text-xs leading-none'
          )}
          value={node.label}
          placeholder={depth === 0 ? '一级选项' : '子级选项'}
          maxLength={BUILDER_TEXT_LIMITS.cascaderOption}
          onChange={(event) =>
            onChange(
              updateCascaderNode(nodes, node.id, {
                label: event.target.value,
              })
            )
          }
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0'
          aria-label='添加子级'
          onClick={() =>
            onChange(
              addCascaderChild(
                nodes,
                node.id,
                createCascaderNode(`子级 ${childCount + 1}`)
              )
            )
          }
        >
          <Plus className='size-3.5' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0'
          disabled={!canDelete}
          aria-label='删除选项'
          onClick={() => onChange(removeCascaderNode(nodes, node.id))}
        >
          <Trash2 className='size-3.5' />
        </Button>
      </div>
      {node.children?.map((child) => (
        <CascaderTreeNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          rootCount={rootCount}
          nodes={nodes}
          onChange={onChange}
        />
      ))}
    </>
  )
}

function CascaderTreeEditor({
  nodes,
  onChange,
}: {
  nodes: CascaderNode[]
  onChange: (nodes: CascaderNode[]) => void
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label className='text-muted-foreground text-xs font-medium'>
          级联选项
        </Label>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className={cn('h-7', 'text-xs leading-none')}
          onClick={() =>
            onChange([...nodes, createCascaderNode(`一级 ${nodes.length + 1}`)])
          }
        >
          <Plus className='mr-1 size-3.5' />
          添加一级
        </Button>
      </div>

      <div className='flex flex-col gap-1.5'>
        {nodes.map((node) => (
          <CascaderTreeNodeRow
            key={node.id}
            node={node}
            depth={0}
            rootCount={nodes.length}
            nodes={nodes}
            onChange={onChange}
          />
        ))}
      </div>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        点击 + 为当前项添加子级；末级节点即为可选项叶子。
      </p>
    </div>
  )
}

export function CascaderInspectorFields({
  question,
  onConfigChange,
}: QuestionInspectorProps<'cascader'>) {
  const { config } = question

  return (
    <>
      <CascaderTreeEditor
        nodes={config.cascaderOptions}
        onChange={(cascaderOptions) => onConfigChange({ cascaderOptions })}
      />
      <InspectorFormGroup title='级联设置'>
        <InspectorFormField label='占位提示'>
          <Input
            value={config.placeholder ?? '请选择'}
            onChange={(event) =>
              onConfigChange({ placeholder: event.target.value })
            }
          />
        </InspectorFormField>
      </InspectorFormGroup>
    </>
  )
}
