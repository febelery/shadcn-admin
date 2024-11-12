import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      path: "/",
    },
    {
      path: "/login",
      lazy: async () => ({
        Component: (await import("../pages/auth/Login")).default,
      }),
    },

    {
      path: "*",
      Component: (await import("../pages/error/404")).default,
    },
    {
      path: "/401",
      lazy: async () => ({
        Component: (await import("../pages/error/401")).default,
      }),
    },
    {
      path: "/500",
      lazy: async () => ({
        Component: (await import("../pages/error/500")).default,
      }),
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
