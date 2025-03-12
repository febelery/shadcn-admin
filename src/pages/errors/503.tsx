import { Cog } from 'lucide-react'

export default function MaintenanceError() {
  return (
    <div className='text-foreground relative h-svh w-full overflow-hidden bg-white dark:bg-black dark:text-white'>
      {/* 背景动效 */}
      <div className='absolute inset-0 z-0'>
        <div className='bg-primary/10 dark:bg-primary/30 absolute top-1/2 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]'></div>
        <div className='absolute top-[30%] left-[20%] h-[30vh] w-[30vh] rounded-full bg-blue-500/10 blur-[80px] dark:bg-blue-500/20'></div>
        <div className='absolute right-[20%] bottom-[20%] h-[25vh] w-[25vh] rounded-full bg-purple-500/10 blur-[80px] dark:bg-purple-500/20'></div>

        {/* 网格背景 */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)]'></div>
      </div>

      <div className='relative z-10 flex h-full w-full flex-col items-center justify-center p-6'>
        {/* 顶部装饰 */}
        <div className='via-primary absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent'></div>

        <div className='container mx-auto max-w-4xl'>
          <div className='grid gap-8 md:grid-cols-2 md:gap-12'>
            {/* 左侧内容 */}
            <div className='flex flex-col justify-center space-y-6'>
              <div className='space-y-2'>
                <h2 className='text-primary text-xl font-medium'>系统维护中</h2>
                <h1 className='text-5xl font-bold tracking-tighter sm:text-7xl'>
                  <span className='from-foreground to-primary/80 bg-gradient-to-r bg-clip-text text-transparent dark:from-white'>
                    503
                  </span>
                </h1>
              </div>

              <p className='text-muted-foreground max-w-md text-lg'>
                我们正在进行系统维护，以确保为您提供更稳定可靠的服务体验。
              </p>
            </div>

            {/* 右侧动画 */}
            <div className='flex items-center justify-center'>
              <div className='relative'>
                <div className='bg-primary/10 dark:bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl'></div>
                <div className='border-border bg-background/50 relative flex h-64 w-64 items-center justify-center rounded-full border backdrop-blur-md dark:border-white/10 dark:bg-black/50'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='border-muted-foreground/20 h-40 w-40 animate-[spin_10s_linear_infinite] rounded-full border border-dashed'></div>
                  </div>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='border-muted-foreground/10 h-32 w-32 animate-[spin_15s_linear_infinite] rounded-full border border-dashed'></div>
                  </div>
                  <Cog className='text-primary h-16 w-16 animate-[spin_8s_linear_infinite]' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
