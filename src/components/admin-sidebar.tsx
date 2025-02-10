import * as React from "react";
import { Command } from "lucide-react";
import { Outlet, useMatches } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { adminRoutes } from "@/router";
import { convertRoutesToMenuItems } from "@/lib/utils";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const matches = useMatches();

  const basePath =
    (matches.find((match) => match.handle) as any)?.handle?.basePath ||
    "/admin";

  const menuItems = React.useMemo(() => {
    return convertRoutesToMenuItems(adminRoutes, basePath);
  }, []);

  const hideMenu = React.useMemo(() => {
    return matches.some((match) => {
      const handle = match.handle as { hiddenMenu?: boolean } | undefined;
      return handle?.hiddenMenu;
    });
  }, [matches]);

  if (hideMenu) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <Sidebar variant="floating" {...props} collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Acme Inc</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={menuItems} />
          <NavSecondary />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
