import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenError() {
  return (
    <div className='bg-background text-foreground relative h-svh w-full overflow-hidden'>
      {/* 动态背景 */}
      <div className='absolute inset-0 z-0'>
        {/* 主背景 */}
        <div className='from-background via-background to-background/90 absolute inset-0 bg-gradient-to-br'></div>

        {/* 动态图形 */}
        <div className='absolute inset-0'>
          <div className='border-border/10 dark:border-border/5 absolute top-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border'></div>
          <div className='border-border/10 dark:border-border/5 absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border'></div>
          <div className='border-border/10 dark:border-border/5 absolute top-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border'></div>
        </div>

        {/* 装饰线条 */}
        <div className='absolute inset-0 opacity-20 dark:opacity-10'>
          <div className='via-destructive/30 absolute top-0 left-1/4 h-full w-px bg-gradient-to-b from-transparent to-transparent'></div>
          <div className='via-destructive/30 absolute top-0 left-2/4 h-full w-px bg-gradient-to-b from-transparent to-transparent'></div>
          <div className='via-destructive/30 absolute top-0 left-3/4 h-full w-px bg-gradient-to-b from-transparent to-transparent'></div>

          <div className='via-destructive/30 absolute top-1/4 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent'></div>
          <div className='via-destructive/30 absolute top-2/4 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent'></div>
          <div className='via-destructive/30 absolute top-3/4 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent'></div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className='relative z-10 flex h-full w-full items-center justify-center p-6'>
        <div className='w-full max-w-5xl'>
          <div className='grid items-center gap-12 md:grid-cols-2'>
            {/* 左侧 - 错误码和图形 */}
            <div className='relative flex flex-col items-center justify-center md:items-end'>
              <div className='relative'>
                {/* 大数字 */}
                <div className='relative'>
                  <div className='text-destructive/5 dark:text-destructive/10 text-[180px] leading-none font-black tracking-tighter'>
                    403
                  </div>
                  <div className='absolute top-0 left-0 text-[180px] leading-none font-black tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(var(--destructive),0.3)]'>
                    403
                  </div>
                </div>

                {/* 锁图标 */}
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                  <div className='relative'>
                    <div className='bg-destructive/5 dark:bg-destructive/10 absolute -inset-10 rounded-full blur-xl'></div>
                    <div className='border-destructive/20 bg-background/80 dark:bg-background/30 relative flex h-20 w-20 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm'>
                      <ShieldX className='text-destructive h-10 w-10' />
                    </div>
                  </div>
                </div>
              </div>

              {/* 装饰元素 */}
              <div className='border-border/10 dark:border-border/5 absolute -bottom-20 -left-20 h-40 w-40 rounded-full border opacity-50'></div>
              <div className='border-border/10 dark:border-border/5 absolute -top-20 -right-20 h-40 w-40 rounded-full border opacity-50'></div>
            </div>

            {/* 右侧 - 内容 */}
            <div className='flex flex-col justify-center space-y-8'>
              <div className='space-y-3'>
                <div className='bg-destructive/10 text-destructive dark:bg-destructive/20 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium'>
                  <span className='bg-destructive mr-2 flex h-2 w-2 rounded-full'></span>
                  访问被拒绝
                </div>

                <h1 className='text-foreground text-4xl font-bold tracking-tight md:text-5xl'>
                  <span className='from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent'>
                    无权限访问
                  </span>
                </h1>

                <div className='from-destructive/50 h-1 w-20 bg-gradient-to-r to-transparent'></div>
              </div>

              <p className='text-muted-foreground text-lg'>
                您没有权限访问此资源。这可能是因为您的账户权限不足，或者您需要登录后才能访问此页面。
              </p>

              <div className='flex flex-wrap gap-4'>
                <Button
                  onClick={() => history.go(-1)}
                  variant='outline'
                  className='group border-border/50 hover:border-destructive/30 relative overflow-hidden transition-all'
                >
                  <span className='from-destructive/10 absolute inset-0 -translate-x-full bg-gradient-to-r to-transparent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'></span>
                  <span className='relative flex items-center gap-2'>
                    <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                    返回上页
                  </span>
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  className='group from-destructive/90 to-destructive/80 text-destructive-foreground hover:from-destructive hover:to-destructive/90 relative overflow-hidden bg-gradient-to-r'
                >
                  <span className='bg-foreground absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5'></span>
                  <span className='relative flex items-center gap-2'>
                    <Home className='h-4 w-4' />
                    返回首页
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
