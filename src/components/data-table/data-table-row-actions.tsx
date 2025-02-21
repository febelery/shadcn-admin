"use client";

import { Row } from "@tanstack/react-table";
import { LucideIcon, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 定义菜单项接口
interface MenuItem<TData> {
  label: string;
  action: (row: Row<TData>) => void;
  shortcut?: string;
  icon?: LucideIcon;
}

// 定义子菜单项接口
interface SubMenuItem<TData> {
  label: string;
  options: {
    value: string;
    label: string;
    icon?: LucideIcon;
  }[];
  currentValue?: string;
  onChange: (value: string, row: Row<TData>) => void;
}

// 定义组件props接口
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  menuItems?: MenuItem<TData>[];
  subMenus?: SubMenuItem<TData>[];
  triggerIcon?: LucideIcon;
  menuWidth?: string;
}

export function DataTableRowActions<TData>({
  row,
  menuItems = [],
  subMenus = [],
  triggerIcon: TriggerIcon = MoreHorizontal,
  menuWidth = "w-[160px]",
}: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <TriggerIcon className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={menuWidth}>
        {menuItems.map((item, index) => (
          <DropdownMenuItem key={index} onClick={() => item.action(row)}>
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.label}
            {item.shortcut && (
              <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
        ))}

        {menuItems.length > 0 && subMenus.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {subMenus.map((subMenu, index) => (
          <DropdownMenuSub key={index}>
            <DropdownMenuSubTrigger>{subMenu.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={subMenu.currentValue}
                onValueChange={(value) => subMenu.onChange(value, row)}
              >
                {subMenu.options.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
