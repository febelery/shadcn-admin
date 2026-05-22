import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import SplashCursor from '@/components/ui/splash-cursor'

export function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <SplashCursor />
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        <span className='font-medium'>哎呀！页面未找到！</span>
        <p className='text-muted-foreground text-center'>
          您要查找的页面似乎不存在 <br />
          或可能已被移除。
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>首页</Button>
        </div>
      </div>
    </div>
  )
}
