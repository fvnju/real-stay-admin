"use client";

import React, { useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette } from "./cmdk";
import { useRouter } from "next/navigation";
import {
  adminMenuItems,
  logout,
  menuItems,
  profileMenuItem,
  type MenuItem,
} from "@/lib/dashboardMenu";

const DashboardCommandPalette = () => {
  const router = useRouter();
  const { isOpen, open, close } = useCommandPalette();

  const handleCommand = (callback: () => void) => {
    callback();
    close();
  };

  useEffect(() => {
    const button = document.getElementById("cmdk");
    button?.addEventListener("click", open);
    return () => button?.removeEventListener("click", open);
  }, [open]);

  const navItem = (item: MenuItem) => (
    <CommandItem
      key={item.path}
      onSelect={() => handleCommand(() => router.push(item.path))}
    >
      <Icon icon={item.icon} className="w-4 h-4" />
      <span>{item.label}</span>
    </CommandItem>
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="General">{menuItems.map(navItem)}</CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Admin Utility">
          {adminMenuItems.map(navItem)}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          {navItem(profileMenuItem)}
          <CommandItem onSelect={() => handleCommand(() => void logout())}>
            <Icon icon="hugeicons:logout-01" className="w-4 h-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default DashboardCommandPalette;
