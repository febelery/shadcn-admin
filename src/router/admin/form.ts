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
      Component: (await import("@/pages/error/401")).default,
      meta: {
        title: "表单列表",
        icon: ListFilter,
      },
    },
    {
      path: "create",
      Component: (await import("@/pages/error/500")).default,
      meta: {
        title: "新建表单",
        icon: FilePlus,
      },
    },
  ],
};
