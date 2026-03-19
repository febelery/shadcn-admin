import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Shield, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createRole,
  updateRole,
  getAvailablePermissions,
  type Role,
} from '../api'

const formSchema = z.object({
  name: z
    .string()
    .min(2, '角色标识至少 2 个字符')
    .regex(/^[a-z][a-z0-9-]*$/, '只能使用小写字母、数字和连字符，且以字母开头'),
  label: z.string().min(1, '角色名称不能为空'),
  description: z.string(),
  permissions: z.array(z.string()),
  isAllPermissions: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: RoleFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!role

  const { data: availablePermissions = [] } = useQuery({
    queryKey: ['available-permissions'],
    queryFn: getAvailablePermissions,
    staleTime: 1000 * 60 * 10,
  })

  // 按 group 分组
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, typeof availablePermissions>()
    for (const perm of availablePermissions) {
      const existing = groups.get(perm.group) || []
      existing.push(perm)
      groups.set(perm.group, existing)
    }
    return groups
  }, [availablePermissions])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      label: '',
      description: '',
      permissions: [],
      isAllPermissions: false,
    },
  })

  // 当 role 变化时重置表单
  useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          name: role.name,
          label: role.label,
          description: role.description,
          permissions: role.permissions.filter((p) => p !== '*'),
          isAllPermissions: role.permissions.includes('*'),
        })
      } else {
        form.reset({
          name: '',
          label: '',
          description: '',
          permissions: [],
          isAllPermissions: false,
        })
      }
    }
  }, [open, role, form])

  const isAllPermissions = useWatch({
    control: form.control,
    name: 'isAllPermissions',
  })
  const selectedPermissions = useWatch({
    control: form.control,
    name: 'permissions',
    defaultValue: [],
  })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      toast.success('角色创建成功')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateRole(id, payload),
    onSuccess: () => {
      toast.success('角色更新成功')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onOpenChange(false)
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  function onSubmit(values: FormValues) {
    const permissions = values.isAllPermissions ? ['*'] : values.permissions

    if (isEditing && role) {
      updateMutation.mutate({
        id: role.id,
        payload: {
          label: values.label,
          description: values.description,
          permissions,
        },
      })
    } else {
      createMutation.mutate({
        name: values.name,
        label: values.label,
        description: values.description || '',
        permissions,
      })
    }
  }

  function togglePermission(key: string) {
    const current = form.getValues('permissions')
    if (current.includes(key)) {
      form.setValue(
        'permissions',
        current.filter((p) => p !== key),
        { shouldValidate: true }
      )
    } else {
      form.setValue('permissions', [...current, key], { shouldValidate: true })
    }
  }

  function toggleGroup(groupPerms: string[]) {
    const current = form.getValues('permissions')
    const allSelected = groupPerms.every((p) => current.includes(p))

    if (allSelected) {
      form.setValue(
        'permissions',
        current.filter((p) => !groupPerms.includes(p)),
        { shouldValidate: true }
      )
    } else {
      const merged = [...new Set([...current, ...groupPerms])]
      form.setValue('permissions', merged, { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[90vh] max-w-2xl flex-col p-0'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='text-primary size-5' />
            {isEditing ? '编辑角色' : '新增角色'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '修改角色信息和权限配置' : '创建新角色并分配权限项'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
          >
            <ScrollArea className='min-h-0 flex-1'>
              <div className='space-y-6 px-6 pb-6'>
                <Separator className='my-2' />

                {/* 基本信息 */}
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>角色标识</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='如: editor'
                            disabled={isEditing}
                            {...field}
                            className='font-mono text-sm'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='label'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>角色名称</FormLabel>
                        <FormControl>
                          <Input placeholder='如: 编辑员' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>功能描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='详细说明该角色的业务范围...'
                          rows={2}
                          {...field}
                          className='resize-none'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* 权限项 */}
                <div>
                  <div className='mb-4 flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <h4 className='text-sm font-semibold'>权限清单</h4>
                      <p className='text-muted-foreground text-xs'>
                        控制角色在系统中的菜单可见性和操作权限
                      </p>
                    </div>
                    <div className='bg-muted/50 flex items-center gap-2 rounded-full px-3 py-1.5'>
                      <span className='text-xs font-medium'>超级权限</span>
                      <FormField
                        control={form.control}
                        name='isAllPermissions'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {isAllPermissions ? (
                    <div className='rounded-md border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20'>
                      <div className='mb-1 flex items-center gap-2 text-amber-800 dark:text-amber-400'>
                        <Info className='size-4' />
                        <span className='text-sm font-semibold'>
                          超级管理员模式已激活
                        </span>
                      </div>
                      <p className='text-xs leading-relaxed text-amber-700/80 dark:text-amber-500/80'>
                        该角色将自动获得系统目前及未来所有的功能权限。底层权限标识将返回为通用通配符{' '}
                        <code>[*]</code>。
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {Array.from(groupedPermissions.entries()).map(
                        ([group, perms]) => {
                          const permKeys = perms.map((p) => p.key)
                          const allChecked = permKeys.every((k) =>
                            selectedPermissions.includes(k)
                          )
                          const someChecked =
                            !allChecked &&
                            permKeys.some((k) =>
                              selectedPermissions.includes(k)
                            )

                          return (
                            <div
                              key={group}
                              className='border-muted rounded border'
                            >
                              <div className='bg-muted/30 flex items-center gap-2 px-3 py-2'>
                                <Checkbox
                                  checked={
                                    allChecked
                                      ? true
                                      : someChecked
                                        ? 'indeterminate'
                                        : false
                                  }
                                  onCheckedChange={() => toggleGroup(permKeys)}
                                />
                                <span className='text-muted-foreground/80 text-xs font-bold tracking-wider uppercase'>
                                  {group}
                                </span>
                                <Badge
                                  variant='secondary'
                                  className='ml-auto h-5 px-1.5 text-[10px]'
                                >
                                  {
                                    permKeys.filter((k) =>
                                      selectedPermissions.includes(k)
                                    ).length
                                  }
                                  /{permKeys.length}
                                </Badge>
                              </div>
                              <div className='grid gap-x-4 gap-y-1 p-3 sm:grid-cols-2'>
                                {perms.map((perm) => (
                                  <label
                                    key={perm.key}
                                    className='hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors'
                                  >
                                    <Checkbox
                                      checked={selectedPermissions.includes(
                                        perm.key
                                      )}
                                      onCheckedChange={() =>
                                        togglePermission(perm.key)
                                      }
                                    />
                                    <span className='font-medium'>
                                      {perm.label}
                                    </span>
                                    <span className='text-muted-foreground/60 ml-auto font-mono text-[10px]'>
                                      {perm.key.split(':')[1]}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className='bg-muted/5 border-t p-6 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <Loader2 className='mr-2 size-4 animate-spin' />}
                {isEditing ? '更新角色配置' : '确定创建角色'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
