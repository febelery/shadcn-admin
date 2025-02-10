import { lazy } from "react";
import { GalleryVertical, ListFilter, FilePlus } from "lucide-react";

export default {
  path: "form",
  handle: {
    title: "表单",
    icon: GalleryVertical,
    order: 1,
  },
  children: [
    {
      path: "list",
      Component: lazy(() => import("@/pages/error/401")),
      handle: {
        title: "表单列表",
        name: "form-list",
        icon: ListFilter,
      },
    },
    {
      path: "create",
      Component: lazy(() => import("@/pages/error/500")),
      handle: {
        title: "新建表单",
        name: "form-create",
        icon: FilePlus,
      },
    },
  ],
};
