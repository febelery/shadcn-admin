import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

export const adminRoutes = Object.values(
  import.meta.glob<any>("./admin/*.ts", { eager: true })
)
  .map((module) => module.default)
  .filter(Boolean);

export const router = createBrowserRouter(
  [
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
          index: true,
          // lazy: async () => ({}),
        },
        ...adminRoutes,
      ],
    },
  ],
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);
