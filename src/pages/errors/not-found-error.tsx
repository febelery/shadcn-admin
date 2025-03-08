import { Button } from '@/components/ui/button'
import HyperText from '@/components/magicui/hyper-text'

export default function NotFoundError() {
  return (
    <div className='relative flex h-svh items-center justify-center p-8'>
      <div className='flex max-w-7xl flex-col-reverse items-center justify-between gap-16 md:flex-row md:gap-24'>
        <div className='justify flex flex-col items-center text-center md:items-start md:text-left'>
          <h1 className='text-muted-foreground text-3xl font-bold'>404</h1>
          <HyperText
            className='mt-4 text-6xl font-bold text-black dark:text-white'
            text='页面未找到'
          />
          <p className='text-muted-foreground mt-6 max-w-md text-lg'>
            您要访问的页面可能已被移动、删除或暂时不可用
          </p>
          <div className='mt-10 flex gap-6'>
            <Button onClick={() => history.go(-1)} variant='outline' size='lg'>
              返回
            </Button>
          </div>
        </div>
        <div className='w-full max-w-md md:max-w-xl'>
          <img
            src='/src/assets/404.svg'
            alt='404 Illustration'
            width={600}
            height={600}
            className='h-auto w-full'
          />
        </div>
      </div>
    </div>
  )
}
