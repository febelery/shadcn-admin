import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
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
    lazy: async () => ({
      Component: (await import("../pages/error/404")).default,
    }),
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
]);
