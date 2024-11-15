import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      path: "/",
    },
    {
      path: "/login",
      lazy: async () => ({
        Component: (await import("@/pages/auth/login")).default,
      }),
    },
    {
      path: "*",
      Component: (await import("@/pages/error/404")).default,
    },
    {
      path: "/401",
      lazy: async () => ({
        Component: (await import("@/pages/error/401")).default,
      }),
    },
    {
      path: "/500",
      lazy: async () => ({
        Component: (await import("@/pages/error/500")).default,
      }),
    },
    {
      path: "/admin",
      lazy: async () => ({
        Component: (await import("@/components/app-sidebar")).AppSidebar,
      }),
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
        {
          path: "404",
          Component: (await import("@/pages/error/404")).default,
        },
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
