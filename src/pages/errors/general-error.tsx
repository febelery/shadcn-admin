import { BackgroundLines } from '@/components/ui/background-lines'
import { Button } from '@/components/ui/button'

export default function ServerError() {
  return (
    <BackgroundLines className='flex w-full flex-col items-center justify-center px-4'>
      <div className='relative m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='from-foreground to-muted-foreground/80 bg-linear-to-b bg-clip-text text-[7rem] leading-tight font-bold text-transparent'>
          500
        </h1>
        <span className='text-xl font-bold'>Oops! 发生了一些问题 {`:')`}</span>
        <p className='text-muted-foreground text-center'>
          我们为给您带来的不便感到抱歉 <br /> 请稍后再试
        </p>
        <div className='mt-6 flex gap-4'>
          <Button onClick={() => history.go(-1)}>返回</Button>
        </div>
      </div>
    </BackgroundLines>
  )
}
