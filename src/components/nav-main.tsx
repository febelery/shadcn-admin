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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
    ? item.items?.find((subItem) => location.pathname === subItem.url)
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
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            isActive={isActive} // 只在完全匹配时激活
          >
            {hasSubItems ? (
              <div className="w-full flex items-center gap-2 cursor-pointer">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </div>
            ) : (
              <Link to={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {hasSubItems && (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform duration-200">
                <ChevronRight />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="w-full">
                {item.items?.map((subItem, index) => (
                  <motion.div
                    key={subItem.title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 0.5,
                      delay: index * 0.05,
                    }}
                  >
                    <SidebarMenuSubItem className="w-full">
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === subItem.url}
                      >
                        <Link to={subItem.url}>
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </motion.div>
                ))}
              </SidebarMenuSub>
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
