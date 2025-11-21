import { Main } from './main'
import { PageHeader } from './page-header'

interface PageLayoutProps {
  // Page header props
  title?: string
  description?: string
  actions?: React.ReactNode

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
  mainFixed,
  mainFluid,
  mainClassName,
  children,
}: PageLayoutProps) {
  return (
    <Main fixed={mainFixed} fluid={mainFluid} className={mainClassName}>
      {title && (
        <PageHeader title={title} description={description}>
          {actions}
        </PageHeader>
      )}
      {children}
    </Main>
  )
}
