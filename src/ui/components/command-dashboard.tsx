"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  adminMenuItems,
  logout,
  menuItems,
  profileMenuItem,
  type MenuItem,
} from "@/lib/dashboardMenu";

/** The command palette: Cmd+K (Ctrl+K) or the Search button of the header. */
const DashboardCommandPalette = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onOpenChange]);

  const run = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const navItem = (item: MenuItem) => (
    <CommandItem
      key={item.path}
      onSelect={() => run(() => router.push(item.path))}
    >
      <Icon name={item.icon} size={18} className="text-muted" />
      <span>{item.label}</span>
    </CommandItem>
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages and actions" />
      <CommandList>
        <CommandEmpty>Nothing matches your search.</CommandEmpty>
        <CommandGroup heading="General">{menuItems.map(navItem)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Admin">{adminMenuItems.map(navItem)}</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {navItem(profileMenuItem)}
          <CommandItem onSelect={() => run(() => void logout())}>
            <Icon name="exit-outline" size={18} className="text-danger" />
            <span className="text-danger">Log out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default DashboardCommandPalette;
