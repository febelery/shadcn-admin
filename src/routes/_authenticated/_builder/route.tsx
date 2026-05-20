import { createFileRoute, Outlet } from '@tanstack/react-router'

/** 问卷编辑路由分组：无后台侧栏，页面 shell 由 SurveyBuilderPage 自行负责 */
export const Route = createFileRoute('/_authenticated/_builder')({
  component: () => <Outlet />,
})
