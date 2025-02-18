import { lazy } from "react";
import {
  GalleryVertical,
  ListFilter,
  FilePlus,
  ChartNoAxesColumn,
} from "lucide-react";

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
        title: "列表",
        name: "form-list",
        icon: ListFilter,
      },
    },
    {
      path: "create",
      Component: lazy(() => import("@/pages/error/500")),
      handle: {
        title: "创建",
        name: "form-create",
        icon: FilePlus,
      },
    },
    {
      path: "result",
      handle: {
        title: "数据",
        icon: ListFilter,
      },
      children: [
        {
          path: "statistics",
          Component: lazy(() => import("@/pages/form/statistics")),
          handle: {
            title: "统计",
            name: "form-result-statistics",
            icon: ChartNoAxesColumn,
          },
        },
        {
          path: "reports",
          Component: lazy(() => import("@/pages/error/500")),
          handle: {
            title: "报表",
            name: "form-result-reports",
            icon: FilePlus,
          },
        },
      ],
    },
  ],
};
