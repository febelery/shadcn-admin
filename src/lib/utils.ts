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
  meta?: {
    title: string;
    icon?: LucideIcon;
    requiresAuth?: boolean;
    order?: number;
  };
  children?: RouteConfig[];
};

export function convertRoutesToMenuItems(
  routes: RouteConfig[],
  parentPath: string = "/admin"
): MenuItem[] {
  return routes
    .filter((route) => route.meta?.title)
    .sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0))
    .map((route) => {
      const path = `${parentPath}/${route.path}`.replace(/\/+/g, "/");

      const menuItem: MenuItem = {
        title: route.meta?.title || "",
        url: path,
        icon: route.meta?.icon,
      };

      if (route.children?.length) {
        const childItems = route.children
          .filter(child => child.meta?.title)
          .map(child => ({
            title: child.meta?.title || "",
            url: `${path}/${child.path}`.replace(/\/+/g, "/"),
            icon: child.meta?.icon
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
