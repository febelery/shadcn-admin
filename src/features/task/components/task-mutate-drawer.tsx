import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Task } from '../data/schema'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, '标题是必填项。'),
  status: z.string().min(1, '请选择状态。'),
  label: z.string().min(1, '请选择标签。'),
  priority: z.string().min(1, '请选择优先级。'),
})

type TaskForm = z.infer<typeof formSchema>

export function TaskMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow

  // 动态构建默认值
  const initialValues = useMemo(() => {
    return (
      currentRow ?? {
        title: '',
        status: '',
        label: '',
        priority: '',
      }
    )
  }, [currentRow])

  const form = useForm({
    defaultValues: initialValues as TaskForm,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      onOpenChange(false)
      form.reset()
      showSubmittedData(value)
    },
  })

  // 弹窗打开或当前行变化时，重置表单为最新默认值
  useEffect(() => {
    if (open) form.reset()
  }, [open, initialValues])

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? '更新' : '创建'} 任务</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? '通过提供必要信息更新任务。'
              : '通过提供必要信息添加新任务。'}
            完成后点击保存。
          </SheetDescription>
        </SheetHeader>

        <form
          id='task-form'
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className='flex-1 space-y-6 overflow-y-auto px-4'
        >
          {/* 标题 */}
          <form.Field
            name='title'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>标题</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='输入标题'
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* 状态 */}
          <form.Field
            name='status'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>状态</FieldLabel>
                  <SelectDropdown
                    defaultValue={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    placeholder='选择状态'
                    items={[
                      { label: '进行中', value: 'in progress' },
                      { label: '待办', value: 'backlog' },
                      { label: '待处理', value: 'todo' },
                      { label: '已取消', value: 'canceled' },
                      { label: '已完成', value: 'done' },
                    ]}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* 标签 */}
          <form.Field
            name='label'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <FieldSet>
                  <FieldLegend variant='label'>标签</FieldLegend>
                  <RadioGroup
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                    className='flex flex-col space-y-1'
                  >
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem
                        value='documentation'
                        id={`${field.name}-documentation`}
                      />
                      <FieldLabel
                        htmlFor={`${field.name}-documentation`}
                        className='cursor-pointer font-normal'
                      >
                        文档
                      </FieldLabel>
                    </Field>
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem
                        value='feature'
                        id={`${field.name}-feature`}
                      />
                      <FieldLabel
                        htmlFor={`${field.name}-feature`}
                        className='cursor-pointer font-normal'
                      >
                        功能
                      </FieldLabel>
                    </Field>
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem value='bug' id={`${field.name}-bug`} />
                      <FieldLabel
                        htmlFor={`${field.name}-bug`}
                        className='cursor-pointer font-normal'
                      >
                        错误
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              )
            }}
          />

          {/* 优先级 */}
          <form.Field
            name='priority'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <FieldSet>
                  <FieldLegend variant='label'>优先级</FieldLegend>
                  <RadioGroup
                    name={field.name}
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                    className='flex flex-col space-y-1'
                  >
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem value='high' id={`${field.name}-high`} />
                      <FieldLabel
                        htmlFor={`${field.name}-high`}
                        className='cursor-pointer font-normal'
                      >
                        高
                      </FieldLabel>
                    </Field>
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem
                        value='medium'
                        id={`${field.name}-medium`}
                      />
                      <FieldLabel
                        htmlFor={`${field.name}-medium`}
                        className='cursor-pointer font-normal'
                      >
                        中
                      </FieldLabel>
                    </Field>
                    <Field orientation='horizontal' data-invalid={isInvalid}>
                      <RadioGroupItem value='low' id={`${field.name}-low`} />
                      <FieldLabel
                        htmlFor={`${field.name}-low`}
                        className='cursor-pointer font-normal'
                      >
                        低
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              )
            }}
          />
        </form>

        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>关闭</Button>
          </SheetClose>
          <Button form='task-form' type='submit'>
            保存更改
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
