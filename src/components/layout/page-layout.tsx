import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Header } from './header'
import { Main } from './main'
import { PageHeader } from './page-header'

interface PageLayoutProps {
  // Page header props
  title?: string
  description?: string
  actions?: React.ReactNode

  // Header customization
  headerContent?: React.ReactNode
  headerLeft?: React.ReactNode
  headerFixed?: boolean

  // Main customization
  mainFixed?: boolean
  mainFluid?: boolean
  mainClassName?: string

  // Content
  children: React.ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  headerContent,
  headerLeft,
  headerFixed,
  mainFixed,
  mainFluid,
  mainClassName,
  children,
}: PageLayoutProps) {
  return (
    <>
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
              <ProfileDropdown />
            </div>
          </>
        )}
      </Header>

      <Main fixed={mainFixed} fluid={mainFluid} className={mainClassName}>
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
