import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import HyperText from '@/components/magicui/hyper-text'
import { Particles } from '@/components/magicui/particles'
import { useTheme } from '@/components/theme-provider'

export default function NotFoundError() {
  const { theme } = useTheme()
  const [color, setColor] = useState('#ffffff')

  useEffect(() => {
    setColor(theme === 'dark' ? '#ffffff' : '#000000')
  }, [theme])

  return (
    <div className='relative h-svh'>
      <Particles
        className='absolute inset-0'
        quantity={100}
        ease={80}
        color={color}
        refresh
      />
      <div className='relative m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='from-foreground to-muted-foreground/80 bg-linear-to-b bg-clip-text text-[7rem] leading-tight font-bold text-transparent'>
          404
        </h1>
        <HyperText
          className='text-2xl font-bold text-black dark:text-white'
          text='抱歉，页面未找到'
        />
        <p className='text-muted-foreground text-center'>
          您要访问的页面可能已被移动、删除或暂时不可用
        </p>
        <div className='mt-6 flex gap-4'>
          <Button onClick={() => history.go(-1)}>返回</Button>
        </div>
      </div>
    </div>
  )
}
