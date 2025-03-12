import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ServerError() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return (
    <div className='relative flex h-svh w-full items-center justify-center overflow-hidden'>
      {/* 动态背景 */}
      <div className='absolute inset-0 -z-10'>
        {/* 渐变背景 */}
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--background-rgb),0.8)_0%,rgba(var(--background-rgb),1)_70%)]'></div>

        {/* 动态粒子 */}
        <div className='absolute inset-0 overflow-hidden opacity-30'>
          {mounted &&
            Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className='bg-foreground/20 absolute rounded-full'
                style={{
                  width: `${Math.random() * 6 + 1}px`,
                  height: `${Math.random() * 6 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.1,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              ></div>
            ))}
        </div>

        {/* 光晕效果 */}
        <div className='absolute top-1/4 -left-[10%] h-[40vh] w-[40vh] rounded-full bg-red-500/10 blur-[100px]'></div>
        <div className='absolute -right-[10%] bottom-1/4 h-[50vh] w-[50vh] rounded-full bg-blue-500/10 blur-[120px]'></div>
        <div className='absolute top-1/2 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[150px]'></div>
      </div>

      {/* 装饰线条 */}
      <div className='absolute inset-0 -z-5 opacity-10'>
        <div className='via-foreground/50 absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent'></div>
        <div className='via-foreground/50 absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent'></div>
        <div className='via-foreground/50 absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent to-transparent'></div>
        <div className='via-foreground/50 absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent to-transparent'></div>
      </div>

      {/* 主要内容 */}
      <div className='relative z-10 mx-auto w-full max-w-5xl px-4'>
        <div className='group border-border/30 bg-background/20 hover:border-border/50 relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:bg-black/10 dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]'>
          {/* 装饰边框 */}
          <div className='absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100'>
            <div className='from-primary/20 via-border/0 to-primary/20 absolute inset-[-1px] rounded-2xl bg-gradient-to-br opacity-50'></div>
          </div>

          <div className='relative grid overflow-hidden md:grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_2fr]'>
            {/* 左侧图形区域 */}
            <div className='from-background/80 to-background/40 flex items-center justify-center bg-gradient-to-br p-8 dark:from-black/40 dark:to-black/20'>
              <div className='relative py-12'>
                {/* 错误数字 */}
                <div className='relative mb-6'>
                  <div className='text-[120px] leading-none font-black tracking-tighter text-red-500/10 dark:text-red-500/5'>
                    500
                  </div>
                  <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-red-500/80'>
                    500
                  </div>
                </div>

                {/* 错误图标 */}
                <div className='relative mx-auto flex h-32 w-32 items-center justify-center'>
                  <div className='absolute inset-0 animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-red-200/20'></div>
                  <div className='absolute inset-2 animate-[spin_15s_linear_infinite_reverse] rounded-full border border-dashed border-red-200/10'></div>
                  <div className='absolute inset-4 animate-[spin_10s_linear_infinite] rounded-full border border-dashed border-red-200/5'></div>
                  <div className='relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 shadow-inner'>
                    <AlertTriangle className='h-8 w-8 animate-pulse text-red-500' />
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className='flex flex-col justify-center p-8 md:p-10 lg:p-12'>
              <div className='mb-2 flex items-center gap-3'>
                <div className='rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400'>
                  服务器错误
                </div>
                <div className='bg-muted-foreground/50 h-1.5 w-1.5 rounded-full'></div>
                <div className='text-muted-foreground text-xs'>系统异常</div>
              </div>

              <h1 className='mb-4 text-4xl font-bold tracking-tight'>
                <span className='from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent'>
                  抱歉，系统遇到了问题
                </span>
              </h1>

              <p className='text-muted-foreground mb-8'>
                在处理您的请求时遇到了意外情况。您可以尝试刷新页面或稍后再试，如果问题持续存在，请联系系统管理员获取支持。
              </p>

              <div className='flex flex-wrap gap-4'>
                <Button
                  onClick={() => history.go(-1)}
                  variant='outline'
                  className='group border-border/50 hover:border-primary/50 relative overflow-hidden transition-all'
                >
                  <span className='from-primary/10 absolute inset-0 -translate-x-full bg-gradient-to-r to-transparent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'></span>
                  <span className='relative flex items-center gap-2'>
                    <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                    返回上页
                  </span>
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className='group from-primary to-primary/80 relative overflow-hidden bg-gradient-to-r'
                >
                  <span className='absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-10'></span>
                  <span className='relative flex items-center gap-2'>
                    <RotateCw className='h-4 w-4 transition-transform group-hover:rotate-90' />
                    刷新页面
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
