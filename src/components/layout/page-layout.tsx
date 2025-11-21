import { useLayout } from '@/context/layout-provider'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { Main } from './main'
import { PageHeader } from './page-header'

interface PageLayoutProps {
  // 页面标题
  title?: string
  description?: string
  actions?: React.ReactNode

  // Header customization
  headerContent?: React.ReactNode
  headerLeft?: React.ReactNode
  headerFixed?: boolean

  // 主容器
  mainFluid?: boolean // 流式布局
  mainClassName?: string

  // 内容
  children: React.ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  headerContent,
  headerLeft,
  headerFixed,
  mainFluid,
  mainClassName,
  children,
}: PageLayoutProps) {
  const { navType } = useLayout()
  const isSidebarLayout = navType !== 'topbar'
  return (
    <>
      {isSidebarLayout && (
        <Header fixed={headerFixed}>
          {headerContent ? (
            headerContent
          ) : (
            <>
              {headerLeft}
              <Search />
              <div className='ms-auto flex items-center space-x-4'>
                <AnimatedThemeToggler />
                <ConfigDrawer />
              </div>
            </>
          )}
        </Header>
      )}
      <Main fluid={mainFluid} className={mainClassName}>
        {title && (
          <PageHeader title={title} description={description}>
            {actions}
          </PageHeader>
        )}
        {children}
      </Main>
    </>
  )
}
