import { ModeToggle } from "@/components/mode-toggle";
import { useSidebar } from "@/components/ui/sidebar";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function NavSecondary() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem key="theme-toggle">
            <SidebarMenuButton asChild size="sm">
              <ModeToggle showLabel={!collapsed} />
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem key="sidebar-toggle">
            <SidebarMenuButton asChild size="sm">
              <SidebarTrigger 
                className="h-7 w-fit gap-2 px-2" 
                showLabel={!collapsed} 
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
