import { CornerDownRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CascaderNode } from '../../core/types'
import {
  addCascaderChild,
  createCascaderNode,
  removeCascaderNode,
  updateCascaderNode,
} from '../../shared/cascader-adapters'
import { LABEL_LIMITS } from '../label-limits'

import { cn } from '@/lib/utils'
import {
  builderTypeCaption,
  builderTypeControl,
  builderTypeLabel,
} from '../ui'


type Props = {
  nodes: CascaderNode[]
  onChange: (nodes: CascaderNode[]) => void
}

type NodeRowProps = {
  node: CascaderNode
  depth: number
  rootCount: number
  onChange: (nodes: CascaderNode[]) => void
  allNodes: CascaderNode[]
}

function CascaderTreeNodeRow({
  node,
  depth,
  rootCount,
  onChange,
  allNodes,
}: NodeRowProps) {
  const childCount = node.children?.length ?? 0
  const canDelete = depth > 0 || rootCount > 1

  const handleLabelChange = (label: string) => {
    onChange(updateCascaderNode(allNodes, node.id, { label }))
  }

  const handleAddChild = () => {
    const child = createCascaderNode(`子级 ${childCount + 1}`)
    onChange(addCascaderChild(allNodes, node.id, child))
  }

  const handleDelete = () => {
    onChange(removeCascaderNode(allNodes, node.id))
  }

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
          className={cn('h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0', builderTypeControl)}
          value={node.label}
          placeholder={depth === 0 ? '一级选项' : '子级选项'}
          maxLength={LABEL_LIMITS.cascaderOption}
          onChange={(e) => handleLabelChange(e.target.value)}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7 shrink-0'
          aria-label='添加子级'
          onClick={handleAddChild}
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
          onClick={handleDelete}
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
          onChange={onChange}
          allNodes={allNodes}
        />
      ))}
    </>
  )
}

/** 级联选项树形编辑器（属性面板） */
export function CascaderTreeEditor({ nodes, onChange }: Props) {
  const handleAddRoot = () => {
    onChange([...nodes, createCascaderNode(`一级 ${nodes.length + 1}`)])
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <Label className={builderTypeLabel}>级联选项</Label>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className={cn('h-7', builderTypeControl)}
          onClick={handleAddRoot}
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
            onChange={onChange}
            allNodes={nodes}
          />
        ))}
      </div>
      <p className={builderTypeCaption}>
        点击 + 为当前项添加子级；末级节点即为可选项叶子。
      </p>
    </div>
  )
}