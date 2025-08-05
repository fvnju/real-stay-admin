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
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPalette } from "./cmdk";
import { useRouter } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { safeReturn } from "@/utils/errorHandler";
import { toast } from "react-toastify";

const ExampleCommandPalette = () => {
  const router = useRouter();
  const { isOpen, open, close } = useCommandPalette();

  const handleCommand = (callback: () => void) => {
    callback();
    close();
  };

  useEffect(() => {
    document.getElementById("cmdk")?.addEventListener("click", () => open());
  }, []);

  return (
    <>
      <CommandDialog open={isOpen} onOpenChange={close}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Navigating to dashboard..."))
              }
            >
              <Icon icon="hugeicons:home-09" className="w-4 h-4" />
              <span>Go to Dashboard</span>
              <CommandShortcut>⌘H</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Opening profile..."))
              }
            >
              <Icon icon="hugeicons:user" className="w-4 h-4" />
              <span>View Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Opening settings..."))
              }
            >
              <Icon icon="hugeicons:settings-02" className="w-4 h-4" />
              <span>Settings</span>
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Opening search..."))
              }
            >
              <Icon icon="hugeicons:search-01" className="w-4 h-4" />
              <span>Search Documents</span>
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Apps">
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Opening calendar..."))
              }
            >
              <Icon icon="hugeicons:calendar-03" className="w-4 h-4" />
              <span>Open Calendar</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                handleCommand(() => console.log("Opening mail..."))
              }
            >
              <Icon icon="hugeicons:mail-01" className="w-4 h-4" />
              <span>Check Mail</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Help">
            <CommandItem
              onSelect={() =>
                handleCommand(() =>
                  window.open("https://docs.example.com", "_blank")
                )
              }
            >
              <Icon icon="hugeicons:file-02" className="w-4 h-4" />
              <span>Documentation</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() =>
                handleCommand(async () => {
                  const data = await safeReturn(
                    fetch("api/auth/logout", { method: "POST" })
                  );
                  if (data.error !== null) {
                    toast.error("Could not logout");
                  }
                  router.push("/sign-in");
                })
              }
            >
              <Icon icon="hugeicons:logout-01" className="w-4 h-4" />
              <span>Sign Out</span>
              <CommandShortcut>⌘Q</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default ExampleCommandPalette;
