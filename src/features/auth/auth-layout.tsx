import { Logo } from '@/assets/logo'
import { SplineScene } from '@/components/ui/spline-scene'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col overflow-hidden text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center p-10 text-lg font-medium'>
          <Logo className='mr-2 h-6 w-6' />
          Shadcn Admin
        </div>
        <div className='relative z-10 flex-1'>
          <SplineScene
            scene='https://cbgccdn.thecover.cn/static/spline/scene.splinecode'
            className='h-full w-full'
          />
        </div>
      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          {children}
        </div>
      </div>
    </div>
  )
}
