import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedError() {
  const navigate = useNavigate()

  return (
    <div className='bg-background text-foreground relative h-svh w-full overflow-hidden'>
      {/* 背景效果 - 增强视觉层次 */}
      <div className='absolute inset-0 z-0'>
        {/* 主背景渐变 */}
        <div className='from-background via-background/95 to-background/90 absolute inset-0 bg-gradient-to-tr'></div>

        {/* 增加微妙的网格背景 */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(var(--primary),0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(var(--primary),0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20'></div>

        {/* 波浪背景装饰 - 增加更多层次 */}
        <svg
          className='absolute inset-0 h-full w-full opacity-10'
          viewBox='0 0 1000 1000'
          preserveAspectRatio='none'
        >
          <motion.path
            d='M0,800 C200,700 400,900 600,800 C800,700 1000,900 1000,800 L1000,1000 L0,1000 Z'
            fill='url(#gradient1)'
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
          <motion.path
            d='M0,850 C150,800 350,950 500,850 C650,750 850,950 1000,850 L1000,1000 L0,1000 Z'
            fill='url(#gradient2)'
            initial={{ y: 50 }}
            animate={{ y: -50 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
          {/* 添加额外的波浪层 */}
          <motion.path
            d='M0,780 C100,820 250,750 400,780 C550,810 700,750 850,780 C900,790 950,780 1000,780 L1000,1000 L0,1000 Z'
            fill='url(#gradient3)'
            initial={{ y: 30 }}
            animate={{ y: -30 }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
          <defs>
            <linearGradient id='gradient1' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='hsl(var(--primary) / 0.3)' />
              <stop offset='100%' stopColor='hsl(var(--primary) / 0.1)' />
            </linearGradient>
            <linearGradient id='gradient2' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='hsl(var(--primary) / 0.2)' />
              <stop offset='100%' stopColor='hsl(var(--primary) / 0.05)' />
            </linearGradient>
            <linearGradient id='gradient3' x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='hsl(var(--primary) / 0.15)' />
              <stop offset='100%' stopColor='hsl(var(--primary) / 0.03)' />
            </linearGradient>
          </defs>
        </svg>

        {/* 顶部装饰 - 增加光晕效果 */}
        <div className='bg-primary/5 absolute -top-20 left-1/2 h-40 w-[140%] -translate-x-1/2 rotate-6 blur-3xl'></div>
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          className='bg-primary/3 absolute -top-10 left-1/3 h-20 w-[80%] -translate-x-1/2 rotate-12 blur-3xl'
        ></motion.div>

        {/* 底部装饰 - 增加动态效果 */}
        <div className='bg-primary/5 absolute -bottom-20 left-1/2 h-40 w-[140%] -translate-x-1/2 -rotate-6 blur-3xl'></div>
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
          className='bg-primary/3 absolute right-1/3 -bottom-10 h-20 w-[80%] translate-x-1/2 -rotate-12 blur-3xl'
        ></motion.div>
      </div>

      {/* 主要内容 */}
      <div className='relative z-10 flex h-full w-full items-center justify-center p-6'>
        <div className='w-full max-w-6xl'>
          {/* 使用水平布局而非网格布局 */}
          <div className='flex h-full flex-col items-center justify-center text-center'>
            {/* 401 数字水印 - 增加微妙动画 */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className='pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.025]'
            >
              <div className='text-[25rem] leading-none font-black tracking-tighter'>
                401
              </div>
            </motion.div>

            {/* 错误状态图标 - 增强视觉效果 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className='relative mb-6'
            >
              <div className='bg-primary/5 dark:bg-primary/10 absolute -inset-12 rounded-full blur-xl'></div>
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 rgba(var(--primary), 0.3)',
                    '0 0 20px rgba(var(--primary), 0.5)',
                    '0 0 0 rgba(var(--primary), 0.3)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className='border-primary/20 bg-background/80 dark:bg-background/30 relative flex h-24 w-24 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm'
              >
                <KeyRound className='text-primary h-12 w-12' />
              </motion.div>
            </motion.div>

            {/* 错误信息 - 优化排版 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='mb-5 space-y-2'
            >
              <div className='bg-primary/10 text-primary dark:bg-primary/20 mx-auto inline-flex items-center rounded-full px-3 py-1 text-sm font-medium'>
                <span className='bg-primary mr-2 flex h-2 w-2 rounded-full'></span>
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  401
                </motion.span>{' '}
                Unauthorized
              </div>

              <h1 className='text-foreground mx-auto max-w-xl text-5xl font-extrabold tracking-tight md:text-6xl'>
                <span className='from-primary/80 to-primary/40 bg-gradient-to-r bg-clip-text text-transparent'>
                  需要身份验证
                </span>
              </h1>
            </motion.div>

            {/* 分隔线 - 增强动画效果 */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className='relative mb-5 h-px w-64 bg-transparent'
            >
              <svg
                width='100%'
                height='8'
                viewBox='0 0 256 8'
                fill='none'
                preserveAspectRatio='none'
              >
                <motion.path
                  d='M0,4 C20,0 40,8 60,4 C80,0 100,8 120,4 C140,0 160,8 180,4 C200,0 220,8 240,4 C246.7,2.7 253.3,2.7 256,4'
                  stroke='url(#lineGradient)'
                  strokeWidth='2'
                  fill='none'
                  animate={{ strokeDashoffset: [100, 0, 100] }}
                  transition={{ duration: 10, repeat: Infinity }}
                  strokeDasharray='100'
                />
                <defs>
                  <linearGradient
                    id='lineGradient'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='0%'
                  >
                    <stop offset='0%' stopColor='hsl(var(--primary) / 0.2)' />
                    <stop offset='50%' stopColor='hsl(var(--primary) / 0.8)' />
                    <stop offset='100%' stopColor='hsl(var(--primary) / 0.2)' />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* 错误描述 - 优化文字效果 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className='text-muted-foreground/90 mx-auto mb-8 max-w-2xl text-center text-lg leading-relaxed'
            >
              您需要登录后才能访问此页面。请提供有效的身份凭证或联系系统管理员获取访问权限。
            </motion.p>

            {/* 操作按钮 - 增强交互效果 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className='mb-8 flex flex-wrap justify-center gap-4'
            >
              <Button
                onClick={() => history.go(-1)}
                variant='outline'
                size='lg'
                className='group border-primary/20 hover:border-primary/40 hover:bg-primary/5 relative h-12 min-w-[160px] overflow-hidden transition-all'
              >
                <span className='from-primary/10 absolute inset-0 -translate-x-full bg-gradient-to-r to-transparent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'></span>
                <span className='relative flex items-center gap-2'>
                  <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
                  返回上页
                </span>
              </Button>
              <Button
                onClick={() => navigate({ to: '/' })}
                size='lg'
                className='group from-primary/90 to-primary/80 hover:from-primary hover:to-primary/90 text-primary-foreground relative h-12 min-w-[160px] overflow-hidden bg-gradient-to-r transition-all'
              >
                <span className='bg-foreground absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5'></span>
                <span className='relative flex items-center gap-2'>
                  <Home className='h-4 w-4 transition-transform group-hover:scale-110' />
                  返回首页
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
