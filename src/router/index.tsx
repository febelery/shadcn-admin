import { lazy } from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import { auth } from "@/lib/auth";

// 权限检查 loader
const authLoader = async () => {
  // todo: 后期可通过接口检查，需配合 shouldRevalidate: () => true 使用
  const isAuthenticated = auth.isAuthenticated();
  if (!isAuthenticated) {
    auth.removeToken();

    const currentPath = window.location.pathname;
    return redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }
  return null;
};

// 导出管理路由
export const adminRoutes = Object.values(
  import.meta.glob<any>("./admin/*.ts", { eager: true })
)
  .map((module) => module.default)
  .filter(Boolean)
  .map((route) => ({
    ...route,
  }));

// 基础路由配置
const routes = [
  {
    path: "/",
  },
  {
    path: "/login",
    Component: lazy(() => import("@/pages/auth/login")),
  },
  {
    path: "*",
    Component: lazy(() => import("@/pages/error/404")),
  },
  {
    path: "/401",
    Component: lazy(() => import("@/pages/error/401")),
  },
  {
    path: "/500",
    Component: lazy(() => import("@/pages/error/500")),
  },
  {
    path: "/admin",
    Component: lazy(() => import("@/components/admin-sidebar")),
    loader: authLoader,
    // shouldRevalidate: () => true, // 强制重新验证
    errorElement: (
      <div className="mockup-window bg-base-300 border">
        <div className="bg-base-200 flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-error mb-2">渲染错误</h2>
            <p className="text-base-content/60">页面加载失败，请稍后重试</p>
          </div>
        </div>
      </div>
    ),
    children: [
      {
        index: false,
      },
      ...adminRoutes,
    ],
  },
];

// 创建路由
export const router = createBrowserRouter(routes);
