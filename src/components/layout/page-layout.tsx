import { Main } from './main'
import { PageHeader } from './page-header'

interface PageLayoutProps {
  // 页面标题
  title?: string
  description?: string
  actions?: React.ReactNode

  // 主容器
  mainFluid?: boolean // 流式布局
  mainFixed?: boolean
  mainClassName?: string

  // 内容
  children: React.ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  mainFluid,
  mainClassName,
  mainFixed,
  children,
}: PageLayoutProps) {
  return (
    <>
      <Main fluid={mainFluid} className={mainClassName} fixed={mainFixed}>
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
