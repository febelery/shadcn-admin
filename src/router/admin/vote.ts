import { lazy } from "react";
import { ChartNoAxesColumn } from "lucide-react";

export default {
  path: "vote",
  Component: lazy(() => import("@/pages/error/500")),
  handle: {
    title: "投票",
    name: "vote",
    icon: ChartNoAxesColumn,
    hiddenInMenu: false, // 在菜单中隐藏
    hiddenMenu: false, // 隐藏菜单
    order: 1,
  },
};
