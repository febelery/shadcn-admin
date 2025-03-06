import { Button } from '@/components/ui/button'

export default function ForbiddenError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>403</h1>
        <span className='font-medium'>禁止访问</span>
        <p className='text-muted-foreground text-center'>
          您没有权限访问此资源
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>返回</Button>
        </div>
      </div>
    </div>
  )
}
