import { ChartNoAxesColumn } from "lucide-react";

export default {
  path: "vote",
  Component: (await import("@/pages/error/500")).default,
  meta: {
    title: "投票",
    requiresAuth: true,
    icon: ChartNoAxesColumn,
    order: 1,
  },
};
