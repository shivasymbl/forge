"use client";

import { Search } from "lucide-react";
import { SidebarMenuButton } from "@multica/ui/components/ui/sidebar";
import { useSearchStore } from "./search-store";

export function SearchTrigger() {
  return (
    <SidebarMenuButton
      className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
      onClick={() => useSearchStore.getState().setOpen(true)}
    >
      <Search />
      <span>Search...</span>
      <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-0.5 rounded border border-sidebar-foreground/20 bg-sidebar-foreground/10 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/60">
        <span className="text-xs">⌘</span>K
      </kbd>
    </SidebarMenuButton>
  );
}
