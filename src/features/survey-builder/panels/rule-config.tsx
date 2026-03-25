import { useState } from 'react'
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
import { getQuestion } from '@/features/survey-builder/questions'
import { useBuilderStore } from '@/features/survey-builder/state'
import {
  type FlowRule,
  type FlowAction,
  type LogicExpression,
  type ComparisonExpression,
  isQuestionNode,
} from '@/features/survey-builder/types'

const ACTION_TYPES = [
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

const OPERATORS = [
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
  const { nodes, addRule, updateRule } = useBuilderStore()
  const questionNodes = nodes.filter((n) => isQuestionNode(n.type))

  const [name, setName] = useState(rule?.name ?? '新流程规则')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [priority, setPriority] = useState(rule?.priority ?? 0)

  // 1. 初始化扁平条件 (UI 只负责编辑扁平层级)
  const initialConditions = (() => {
    if (!rule)
      return [
        {
          id: crypto.randomUUID(),
          type: 'comparison' as const,
          field: questionNodes[0]?.id ?? '',
          operator: 'eq' as const,
          value: '',
        },
      ]

    const expr = rule.expression
    if (expr.type === 'logical' && expr.operator === 'AND') {
      return expr.expressions.map((e) => e as ComparisonExpression)
    }
    if (expr.type === 'comparison') return [expr]
    return []
  })()

  const [conditions, setConditions] =
    useState<ComparisonExpression[]>(initialConditions)
  const [actions, setActions] = useState<FlowAction[]>(
    rule?.actions ?? [
      {
        id: crypto.randomUUID(),
        type: 'jump_question',
        target: questionNodes[0]?.id ?? '',
      },
    ]
  )

  const save = () => {
    // 2. 在保存时进行 DSL 转换机制：将扁平转化为 AND 组合 (或者单个原子)
    let expression: LogicExpression
    if (conditions.length === 1) {
      expression = conditions[0]
    } else {
      expression = {
        id: crypto.randomUUID(),
        type: 'logical',
        operator: 'AND',
        expressions: conditions,
      }
    }

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
          <div className='flex min-w-60 flex-col gap-3'>
            <p className='text-muted-foreground/60 decoration-border text-[10px] font-semibold tracking-widest uppercase underline decoration-2 underline-offset-4'>
              条件 (When)
            </p>
            {conditions.map((cond, i) => (
              <div
                key={i}
                className='border-border/40 bg-muted/20 mb-1 space-y-1.5 rounded-lg border p-3 shadow-sm'
              >
                <Label className='text-muted-foreground/80 text-[10px]'>
                  选择问题
                </Label>
                <Select
                  value={cond.field}
                  onValueChange={(v) => {
                    const nextNode = questionNodes.find((n) => n.id === v)
                    const nextCaps = nextNode
                      ? getQuestion(nextNode.type)?.capabilities
                      : undefined
                    setConditions((c) =>
                      c.map((r, idx) => {
                        if (idx !== i) return r
                        const newOperator =
                          nextCaps &&
                          !nextCaps.operators.includes(r.operator as any)
                            ? nextCaps.operators[0] // 切换题型后，如果旧操作符不可用，自动重置
                            : r.operator
                        return { ...r, field: v, operator: newOperator as any }
                      })
                    )
                  }}
                >
                  <SelectTrigger className='h-8 text-xs'>
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
                <div className='flex gap-1.5'>
                  {(() => {
                    const sourceNode = questionNodes.find(
                      (n) => n.id === cond.field
                    )
                    const caps = sourceNode
                      ? getQuestion(sourceNode.type)?.capabilities
                      : undefined

                    // 1. 根据题型能力过滤可用操作符
                    // 2. 如果题型没有定义能力，则返回空列表 (题型需显式声明支持逻辑)
                    const availableOperators = caps
                      ? OPERATORS.filter((o: any) =>
                          caps.operators.includes(o.value as any)
                        )
                      : []

                    return (
                      <Select
                        value={cond.operator}
                        onValueChange={(v) =>
                          setConditions((c) =>
                            c.map((r, idx) =>
                              idx === i ? { ...r, operator: v as any } : r
                            )
                          )
                        }
                        disabled={availableOperators.length === 0}
                      >
                        <SelectTrigger className='h-8 w-32 shrink-0 text-[11px]'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOperators.map((o: any) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  })()}
                  {!['is_empty', 'is_not_empty'].includes(cond.operator) && (
                    <Input
                      className='h-8 flex-1 text-xs'
                      placeholder='请输入值…'
                      value={(cond.value as string) ?? ''}
                      onChange={(e) =>
                        setConditions((c) =>
                          c.map((r, idx) =>
                            idx === i ? { ...r, value: e.target.value } : r
                          )
                        )
                      }
                    />
                  )}
                </div>
              </div>
            ))}
            <Button
              variant='link'
              size='sm'
              className='text-primary mt-1 h-auto justify-start p-0 text-[11px] font-medium hover:opacity-70'
              onClick={() =>
                setConditions((c) => [
                  ...c,
                  {
                    id: crypto.randomUUID(),
                    type: 'comparison',
                    field: questionNodes[0]?.id ?? '',
                    operator: 'eq',
                    value: '',
                  },
                ])
              }
            >
              + 添加额外条件 (AND)
            </Button>
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
            {actions.map((action, i) => (
              <div
                key={i}
                className='border-border/40 bg-muted/20 mb-1 space-y-1.5 rounded-lg border p-3 shadow-sm'
              >
                <Label className='text-muted-foreground/80 text-[10px]'>
                  执行动作
                </Label>
                <Select
                  value={action.type}
                  onValueChange={(v) =>
                    setActions((a) =>
                      a.map((r, idx) =>
                        idx === i ? { ...r, type: v as any } : r
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
                    setActions((a) =>
                      a.map((r, idx) => (idx === i ? { ...r, target: v } : r))
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
