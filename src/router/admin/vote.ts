import { lazy } from "react";
import { ChartNoAxesColumn } from "lucide-react";

export default {
  path: "vote",
  Component: lazy(() => import("@/pages/error/500")),
  meta: {
    title: "投票",
    icon: ChartNoAxesColumn,
    order: 1,
  },
};
