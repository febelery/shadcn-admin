import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type LucideIcon } from "lucide-react";

export type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: MenuItem[];
};

export type RouteConfig = {
  path: string;
  handle?: {
    title: string;
    icon?: LucideIcon;
    order?: number;
    hiddenInMenu?: boolean; // 在菜单中隐藏
    hiddenMenu?: boolean; // 隐藏菜单
    name?: string;
  };
  children?: RouteConfig[];
};

export function convertRoutesToMenuItems(
  routes: RouteConfig[],
  parentPath: string
): MenuItem[] {
  return routes
    .filter((route) => route.handle?.title && !route.handle?.hiddenInMenu)
    .sort((a, b) => (a.handle?.order || 0) - (b.handle?.order || 0))
    .map((route) => {
      const path = `${parentPath}/${route.path}`.replace(/\/+/g, "/");

      const menuItem: MenuItem = {
        title: route.handle?.title || "",
        url: path,
        icon: route.handle?.icon,
      };

      if (route.children?.length) {
        const childItems = route.children
          .filter((child) => child.handle?.title && !child.handle?.hiddenInMenu)
          .map((child) => ({
            title: child.handle?.title || "",
            url: `${path}/${child.path}`.replace(/\/+/g, "/"),
            icon: child.handle?.icon,
          }));

        if (childItems.length > 0) {
          menuItem.items = childItems;
        }
      }

      return menuItem;
    });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
