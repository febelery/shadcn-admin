"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: MenuItem[];
};

function NavMenuItem({ item }: { item: MenuItem }) {
  const location = useLocation();
  const isActive = location.pathname === item.url;

  const hasSubItems = item.items && item.items.length > 0;
  const activeSubItem = hasSubItems
    ? item.items?.find((subItem) => {
        return location.pathname.startsWith(subItem.url);
      })
    : null;

  React.useEffect(() => {
    if (isActive) {
      document.title = `${item.title}`;
    } else if (activeSubItem) {
      document.title = `${activeSubItem.title}`;
    }
  }, [isActive, activeSubItem, item.title]);

  return (
    <Collapsible asChild defaultOpen={Boolean(activeSubItem)}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
            {hasSubItems ? (
              <div className="w-full flex items-center gap-2 cursor-pointer select-none">
                {item.icon && <item.icon />}
                <span className="select-none">{item.title}</span>
              </div>
            ) : (
              <Link to={item.url} className="select-none">
                {item.icon && <item.icon />}
                <span className="select-none">{item.title}</span>
              </Link>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {hasSubItems && (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform duration-200 select-none">
                <ChevronRight />
                <span className="sr-only select-none">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <NavMenuItem key={subItem.title} item={subItem} />
                  ))}
                </SidebarMenuSub>
              </motion.div>
            </CollapsibleContent>
          </>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ items }: { items: MenuItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavMenuItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
