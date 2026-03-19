import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Plus,
  Users,
  Pencil,
  Trash2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PageLayout } from '@/components/layout/page-layout'
import { getRoles, deleteRole, type Role } from './api'
import { RoleFormDialog } from './components/role-form-dialog'

export function Permissions() {
  const queryClient = useQueryClient()
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const { data: roles = [], isFetching } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success('角色已删除')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeletingRole(null)
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  function handleCreateRole() {
    setEditingRole(null)
    setFormDialogOpen(true)
  }

  function handleEditRole(role: Role) {
    setEditingRole(role)
    setFormDialogOpen(true)
  }

  function handleDeleteRole(role: Role) {
    setDeletingRole(role)
  }

  function confirmDelete() {
    if (deletingRole) {
      deleteMutation.mutate(deletingRole.id)
    }
  }

  const stats = [
    {
      title: '角色总数',
      value: roles.length.toString(),
      icon: Shield,
      description: '当前系统定义的角色',
    },
    {
      title: '管理员',
      value: roles.filter((r) => r.permissions.includes('*')).length.toString(),
      icon: UserCheck,
      description: '拥有完整系统权限',
    },
    {
      title: '用户总额',
      value: roles.reduce((sum, r) => sum + r.userCount, 0).toString(),
      icon: Users,
      description: '已分配角色的用户数',
    },
    {
      title: '安全项',
      value: '10',
      icon: ShieldCheck,
      description: '受控制的资源项',
    },
  ]

  return (
    <PageLayout>
      <div className='mb-6 flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>权限管理</h1>
          <p className='text-muted-foreground'>
            管理系统角色及其关联的细粒度操作权限
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={handleCreateRole}>
            <Plus className='mr-2 size-4' />
            新增角色
          </Button>
        </div>
      </div>

      <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
              </CardTitle>
              <stat.icon className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-muted-foreground text-xs'>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {isFetching && roles.length === 0
          ? Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className='pb-3'>
                  <Skeleton className='h-5 w-1/3' />
                  <Skeleton className='mt-2 h-4 w-1/2' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-20' />
                </CardContent>
              </Card>
            ))
          : roles.map((role) => {
              const isAdmin = role.name === 'admin'
              const isFullAccess = role.permissions.includes('*')

              return (
                <Card
                  key={role.id}
                  className='border-muted group flex flex-col transition-shadow hover:shadow-sm'
                >
                  <CardHeader className='relative pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='space-y-1'>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          {role.label}
                          {isFullAccess && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ShieldAlert className='size-4 text-amber-500' />
                              </TooltipTrigger>
                              <TooltipContent side='top'>全权限</TooltipContent>
                            </Tooltip>
                          )}
                        </CardTitle>
                        <CardDescription className='font-mono text-xs'>
                          @{role.name}
                        </CardDescription>
                      </div>
                      <div className='flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => handleEditRole(role)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        {!isAdmin && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-destructive h-8 w-8'
                            onClick={() => handleDeleteRole(role)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col'>
                    <p className='text-muted-foreground mb-4 line-clamp-2 h-10 text-sm'>
                      {role.description}
                    </p>

                    <div className='border-muted/50 mt-auto flex items-center justify-between border-t pt-4'>
                      <div className='flex gap-2'>
                        <Badge
                          variant='outline'
                          className='rounded-sm font-normal'
                        >
                          {isFullAccess
                            ? '全部权限'
                            : `${role.permissions.length} 项权限`}
                        </Badge>
                        <Badge
                          variant='outline'
                          className='text-muted-foreground rounded-sm font-normal'
                        >
                          {role.userCount} 用户
                        </Badge>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={() => handleEditRole(role)}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      <RoleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        role={editingRole}
      />

      <AlertDialog
        open={!!deletingRole}
        onOpenChange={() => setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除角色「{deletingRole?.label}」吗？
              {deletingRole && deletingRole.userCount > 0 && (
                <div className='text-destructive mt-2 flex items-center gap-2 font-medium'>
                  <AlertCircle className='size-4' />
                  <span>该角色下仍有 {deletingRole.userCount} 名关联用户</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
