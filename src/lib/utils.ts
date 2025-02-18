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
        const childItems = convertRoutesToMenuItems(route.children, path);
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

export const buildMockApiUrl = (path: string) => {
  return `${import.meta.env.VITE_API_BASE_URL}${path}`;
};

export type FileType =
  | "image"
  | "video"
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "audio"
  | "archive"
  | "text"
  | "unknown";

const FILE_EXTENSION_MAP: Record<FileType, string[]> = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "heif",
    "heic",
    "svg",
    "ico",
  ],
  video: [
    "mp4",
    "webm",
    "ogg",
    "mov",
    "avi",
    "flv",
    "wmv",
    "mkv",
    "3gp",
    "m4v",
  ],
  pdf: ["pdf"],
  word: ["doc", "docx", "rtf"],
  excel: ["xls", "xlsx", "csv"],
  powerpoint: ["ppt", "pptx"],
  audio: ["mp3", "wav", "aac", "ogg", "m4a", "flac", "wma"],
  archive: ["zip", "rar", "7z", "tar", "gz", "bz2"],
  text: ["txt", "md", "json", "xml", "html", "css", "js", "ts"],
  unknown: [],
};

const EXTENSION_TO_TYPE = Object.entries(FILE_EXTENSION_MAP).reduce(
  (acc, [type, extensions]) => {
    extensions.forEach((ext) => {
      acc[ext] = type as FileType;
    });
    return acc;
  },
  {} as Record<string, FileType>
);

export const getUrlType = (url: string): FileType => {
  try {
    const pathname = new URL(url).pathname;
    const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

    return EXTENSION_TO_TYPE[extension] || "unknown";
  } catch {
    return "unknown";
  }
};
