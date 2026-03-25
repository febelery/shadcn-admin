import { useState } from 'react'
import { Plus, Trash2, Layers, Binary } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useFlowStore } from '@/features/survey-builder/state'
import {
  useQuestionNodes,
  RuleService,
} from '@/features/survey-builder/state/selectors'
import {
  type FlowRule,
  type FlowAction,
  type ConditionNode,
  type ComparisonNode,
  type Operator,
  type ActionType,
  type QuestionNode,
} from '@/features/survey-builder/types'

function ConditionNodeEditor({
  node,
  questionNodes,
  onUpdate,
  onDelete,
}: {
  node: ConditionNode
  questionNodes: QuestionNode[]
  onUpdate: (id: string, patch: Partial<ConditionNode>) => void
  onDelete: (id: string) => void
}) {
  // 渲染逻辑组 (AND/OR Group)
  if (node.type === 'group') {
    return (
      <div
        className={cn(
          'border-primary/20 bg-primary/5 mb-3 space-y-3 rounded-xl border-l-[3px] p-4 shadow-sm md:ml-2',
          node.children.length > 0 && 'pb-5'
        )}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 rounded-md p-1'>
              <Layers className='text-primary h-3.5 w-3.5' />
            </div>
            <Select
              value={node.op}
              onValueChange={(v: 'and' | 'or') => onUpdate(node.id, { op: v })}
            >
              <SelectTrigger className='h-7 w-20 border-none bg-transparent text-[11px] font-bold uppercase ring-0 focus:ring-0'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='and'>AND</SelectItem>
                <SelectItem value='or'>OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          </div>
        </div>

        <div className='space-y-3 pl-2'>
          {node.children.map((child) => (
            <ConditionNodeEditor
              key={child.id}
              node={child}
              questionNodes={questionNodes}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          <Button
            variant='ghost'
            size='sm'
            className='h-7 w-full border-dashed text-[10px] font-medium'
            onClick={() => {
              const newNode: ConditionNode = {
                id: crypto.randomUUID(),
                type: 'comparison',
                field: questionNodes[0]?.id ?? '',
                operator: 'eq',
                value: '',
              }
              onUpdate(node.id, { children: [...node.children, newNode] })
            }}
          >
            <Plus className='mr-1 h-3 w-3' />
            添加子条件
          </Button>
        </div>
      </div>
    )
  }

  // 渲染叶子节点 (Comparison)
  if (node.type === 'comparison') {
    return (
      <div className='group border-border/40 bg-muted/30 hover:border-primary/30 relative mb-2 space-y-2 rounded-lg border p-3 pl-4 shadow-sm transition-all'>
        <div className='absolute top-3 left-1.5 opacity-40'>
          <Binary className='h-3 w-3' />
        </div>
        <div className='flex items-center justify-between gap-2'>
          <Select
            value={node.field}
            onValueChange={(v) => {
              const nodeType = questionNodes.find((n) => n.id === v)?.type
              const patch: Partial<ComparisonNode> = { field: v }
              if (nodeType) {
                patch.operator = RuleService.getNextOperator(
                  nodeType,
                  node.operator,
                  OPERATORS
                ) as Operator
              }
              onUpdate(node.id, patch)
            }}
          >
            <SelectTrigger className='bg-background h-8 flex-1 text-[11px]'>
              <SelectValue placeholder='选择问题' />
            </SelectTrigger>
            <SelectContent>
              {questionNodes.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.title || n.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground hover:text-destructive h-6 w-6'
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          </div>
        </div>

        <div className='flex gap-1.5'>
          <Select
            value={node.operator}
            onValueChange={(v) =>
              onUpdate(node.id, { operator: v as Operator })
            }
            disabled={!questionNodes.find((n) => n.id === node.field)?.type}
          >
            <SelectTrigger className='bg-background h-8 w-32 shrink-0 text-[11px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RuleService.getAvailableOperators(
                questionNodes.find((n) => n.id === node.field)?.type ?? '',
                OPERATORS
              ).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!['is_empty', 'is_not_empty'].includes(node.operator) && (
            <Input
              className='bg-background h-8 flex-1 text-[11px]'
              placeholder='值…'
              value={(node.value as string) ?? ''}
              onChange={(e) => onUpdate(node.id, { value: e.target.value })}
            />
          )}
        </div>
      </div>
    )
  }

  return null
}

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'jump_question', label: '跳转至问题' },
  { value: 'show', label: '显示问题' },
  { value: 'hide', label: '隐藏问题' },
  { value: 'end', label: '提前结束' },
  { value: 'set_required', label: '设为必填' },
  { value: 'set_readonly', label: '设为只读' },
  { value: 'set_value', label: '赋值' },
  { value: 'clear_value', label: '清空答案' },
  { value: 'show_option', label: '显示选项' },
  { value: 'hide_option', label: '隐藏选项' },
]

const OPERATORS: { value: Operator; label: string }[] = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'is_empty', label: '为空' },
  { value: 'is_not_empty', label: '不为空' },
  { value: 'regex', label: '正则匹配' },
]

interface Props {
  rule: FlowRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RuleEditor({ rule, open, onOpenChange }: Props) {
  const addRule = useFlowStore((s) => s.addRule)
  const updateRule = useFlowStore((s) => s.updateRule)

  const questionNodes = useQuestionNodes()

  const [name, setName] = useState(rule?.name ?? '新流程规则')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [priority, setPriority] = useState(rule?.priority ?? 0)

  // 1. 初始化辅助：确保所有节点和动作都有稳定 ID
  const ensureIds = (expr: ConditionNode): ConditionNode => {
    if (!expr.id) expr.id = crypto.randomUUID()
    if (expr.type === 'group') {
      expr.children.forEach((c) => {
        if (!c.id) c.id = crypto.randomUUID()
      })
    }
    return expr
  }

  const [expression, setExpression] = useState<ConditionNode>(() => {
    if (rule?.expression)
      return ensureIds(JSON.parse(JSON.stringify(rule.expression)))
    return {
      id: crypto.randomUUID(),
      type: 'group',
      op: 'and',
      children: [
        {
          id: crypto.randomUUID(),
          type: 'comparison',
          field: questionNodes[0]?.id ?? '',
          operator: 'eq',
          value: '',
        },
      ],
    }
  })

  const [actions, setActions] = useState<FlowAction[]>(() => {
    const initialActions = rule?.actions ?? [
      {
        id: crypto.randomUUID(),
        type: 'jump_question',
        target: questionNodes[0]?.id ?? '',
      },
    ]
    return initialActions.map((a) => ({
      ...a,
      id: a.id || crypto.randomUUID(),
    }))
  })

  const save = () => {
    try {
      const payload: Omit<FlowRule, 'id'> & { id?: string } = {
        id: rule?.id ?? crypto.randomUUID(),
        name,
        enabled,
        priority,
        expression,
        actions,
      }
      if (rule) updateRule(rule.id, payload as FlowRule)
      else addRule(payload as FlowRule)
      onOpenChange(false)
    } catch (err) {
      toast.error(
        '保存规则失败：' + (err instanceof Error ? err.message : '未知错误')
      )
    }
  }

  const updateTreeNode = (id: string, patch: Partial<ConditionNode>) => {
    setExpression((prev) => {
      // 更新根节点
      if (prev.id === id) return { ...prev, ...patch } as ConditionNode
      // 更新子节点 (仅 comparison)
      if (prev.type === 'group') {
        return {
          ...prev,
          children: prev.children.map((c) =>
            c.id === id ? ({ ...c, ...patch } as ComparisonNode) : c
          ),
        }
      }
      return prev
    })
  }

  const removeTreeNode = (id: string) => {
    setExpression((prev) => {
      if (prev.id === id) return prev
      if (prev.type === 'group') {
        return {
          ...prev,
          children: prev.children.filter((c) => c.id !== id),
        }
      }
      return prev
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className='max-h-[85vh]'>
        <DrawerHeader className='border-border/40 border-b pb-4 text-left'>
          <DrawerTitle>{rule ? '编辑流程规则' : '新增流程规则'}</DrawerTitle>
          <DrawerDescription>
            通过设置“当满足条件时执行动作”来控制问卷的跳转与展示流程。
          </DrawerDescription>
        </DrawerHeader>

        <div className='flex gap-8 overflow-x-auto p-6'>
          {/* Condition column */}
          <div className='flex min-w-80 flex-col gap-3'>
            <p className='text-muted-foreground/60 decoration-border text-[10px] font-semibold tracking-widest uppercase underline decoration-2 underline-offset-4'>
              条件 (When)
            </p>
            <div className='max-h-[50vh] overflow-y-auto pr-2'>
              <ConditionNodeEditor
                node={expression}
                questionNodes={questionNodes}
                onUpdate={updateTreeNode}
                onDelete={removeTreeNode}
              />
            </div>
          </div>

          {/* Arrow */}
          <div className='text-muted-foreground/20 flex items-center pt-8 text-xl'>
            →
          </div>

          {/* Action column */}
          <div className='flex min-w-60 flex-col gap-3'>
            <p className='text-muted-foreground/60 decoration-border text-[10px] font-semibold tracking-widest uppercase underline decoration-2 underline-offset-4'>
              动作 (Then)
            </p>
            {actions.map((action) => (
              <div
                key={action.id}
                className='border-border/40 bg-muted/20 mb-1 space-y-1.5 rounded-lg border p-3 shadow-sm'
              >
                <Label className='text-muted-foreground/80 text-[10px]'>
                  执行动作
                </Label>
                <Select
                  value={action.type}
                  onValueChange={(v: ActionType) =>
                    setActions((prev) =>
                      prev.map((r) =>
                        r.id === action.id ? { ...r, type: v } : r
                      )
                    )
                  }
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={action.target}
                  onValueChange={(v) =>
                    setActions((prev) =>
                      prev.map((r) =>
                        r.id === action.id ? { ...r, target: v } : r
                      )
                    )
                  }
                >
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='选择目标问题' />
                  </SelectTrigger>
                  <SelectContent>
                    {questionNodes.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.title || n.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button
              variant='link'
              size='sm'
              className='text-primary mt-1 h-auto justify-start p-0 text-[11px] font-medium hover:opacity-70'
              onClick={() =>
                setActions((a) => [
                  ...a,
                  {
                    id: crypto.randomUUID(),
                    type: 'jump_question',
                    target: questionNodes[0]?.id ?? '',
                  },
                ])
              }
            >
              + 添加并行动作
            </Button>
          </div>

          <div className='bg-border/40 mx-2 w-px' />

          {/* Settings column */}
          <div className='flex min-w-56 flex-col gap-4'>
            <p className='text-muted-foreground/60 decoration-border text-[10px] font-semibold tracking-widest uppercase underline decoration-2 underline-offset-4'>
              规则配置
            </p>
            <div>
              <Label className='text-muted-foreground mb-1.5 block text-[11px]'>
                规则名称
              </Label>
              <Input
                className='h-9 text-xs'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='例如：特定省份跳转'
              />
            </div>
            <div className='border-border/40 space-y-3 rounded-lg border p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-foreground text-xs font-medium'>
                  启用该规则
                </span>
                <Switch
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  className='scale-[0.8]'
                />
              </div>
              <div className='flex items-center justify-between gap-4'>
                <Label className='text-muted-foreground text-xs'>优先级</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    min={0}
                    className='h-8 w-16 font-mono text-xs'
                    value={priority}
                    onChange={(e) => setPriority(+e.target.value)}
                  />
                  <span className='text-muted-foreground/60 text-[10px]'>
                    越小越优先
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className='border-border/40 bg-muted/10 flex-row items-center justify-end gap-3 border-t px-6 py-4'>
          <Button
            variant='ghost'
            className='h-9 px-6 text-xs'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button className='h-9 px-8 text-xs font-semibold' onClick={save}>
            保存当前规则
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
