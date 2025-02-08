import { lazy } from "react";
import { GalleryVertical, ListFilter, FilePlus } from "lucide-react";

export default {
  path: "form",
  meta: {
    title: "表单",
    requiresAuth: true,
    icon: GalleryVertical,
    order: 1,
  },
  children: [
    {
      path: "list",
      Component: lazy(() => import("@/pages/error/401")),
      meta: {
        title: "表单列表",
        icon: ListFilter,
      },
    },
    {
      path: "create",
      Component: lazy(() => import("@/pages/error/500")),
      meta: {
        title: "新建表单",
        icon: FilePlus,
      },
    },
  ],
};
