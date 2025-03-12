import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Globe } from '@/components/magicui/globe'
import HyperText from '@/components/magicui/hyper-text'

export default function NotFoundError() {
  const navigate = useNavigate()

  return (
    <div className='bg-background text-foreground relative h-svh w-full overflow-hidden'>
      {/* 背景效果 */}
      <div className='absolute inset-0 z-0'>
        {/* 主背景渐变 */}
        <div className='from-background via-background/95 to-background/90 absolute inset-0 bg-gradient-to-tr'></div>

        {/* 背景装饰 */}
        <div className='absolute inset-0 opacity-[0.03]'>
          <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
            <pattern
              id='grid-pattern'
              x='0'
              y='0'
              width='50'
              height='50'
              patternUnits='userSpaceOnUse'
            >
              <path
                d='M50,0 L0,0 L0,50'
                fill='none'
                stroke='currentColor'
                strokeWidth='0.5'
              />
            </pattern>
            <rect
              x='0'
              y='0'
              width='100%'
              height='100%'
              fill='url(#grid-pattern)'
            />
          </svg>
        </div>

        {/* 装饰元素 */}
        <div className='absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl'></div>
        <div className='absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl'></div>

        {/* 新增：大型404背景 */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-foreground/[0.02] text-[25vw] font-bold select-none'>
            404
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className='relative z-10 flex h-full w-full items-center justify-center p-6'>
        <div className='w-full max-w-6xl'>
          <div className='grid items-center gap-12 md:grid-cols-2'>
            {/* 左侧 - 文字内容 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='flex flex-col items-center text-center md:items-start md:text-left'
            >
              <div className='bg-muted/20 text-muted-foreground inline-flex items-center rounded-full px-3 py-1 text-sm font-medium'>
                <span className='bg-muted-foreground mr-2 flex h-2 w-2 rounded-full'></span>
                404 Not Found
              </div>

              <h1 className='mt-4 text-6xl font-bold tracking-tight'>
                <HyperText
                  className='from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-transparent'
                  text='页面未找到'
                />
              </h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className='from-muted-foreground/50 mt-4 h-1 w-20 origin-left bg-gradient-to-r to-transparent'
              ></motion.div>

              <p className='text-muted-foreground mt-6 max-w-md text-lg leading-relaxed'>
                很抱歉，您要访问的页面似乎已经迷路了。它可能已被移动、删除或暂时不可用。
              </p>

              <div className='mt-10 flex flex-wrap gap-4'>
                <Button
                  onClick={() => history.go(-1)}
                  variant='outline'
                  size='lg'
                  className='group border-muted-foreground/20 hover:border-muted-foreground/40 relative overflow-hidden transition-all'
                >
                  <span className='relative flex items-center gap-2'>
                    <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                    返回上页
                  </span>
                </Button>
                <Button
                  onClick={() => navigate({ to: '/' })}
                  size='lg'
                  className='group bg-foreground text-background hover:bg-foreground/90 relative overflow-hidden transition-all'
                >
                  <span className='relative flex items-center gap-2'>
                    <Home className='h-4 w-4' />
                    返回首页
                  </span>
                </Button>
              </div>
            </motion.div>

            {/* 右侧 - 视觉元素 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='flex justify-end'
            >
              <div className='relative h-94 w-94'>
                <Globe className='h-full w-full' />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
