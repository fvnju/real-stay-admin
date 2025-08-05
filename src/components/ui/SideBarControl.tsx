"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";

export default function SideBarControl({ initVal }: { initVal: boolean }) {
  const [isMini, setIsMini] = useState(initVal);

  return (
    <button
      onClick={() => {
        const sidebar = document.getElementById("sidebar")!;
        const hides = sidebar.getElementsByClassName("hide")!;

        if (isMini) {
          // Expand to full width
          sidebar.style.maxWidth = "17.1875rem";
          // Show elements with "hide" class when sidebar is large
          Array.from(hides).forEach((element) => {
            const el = element as HTMLElement;
            // Show the element first, then animate
            if (el.style.display === "none") {
              el.style.display = "block";
            }
            el.style.opacity = "1";
            el.style.transform = "translateX(0)";
          });
          document.cookie = "sidebar_shrink=";
        } else {
          // Hide elements with "hide" class when sidebar is small
          Array.from(hides).forEach((element) => {
            const el = element as HTMLElement;
            el.style.opacity = "0";
            el.style.transform = "translateX(-10px)";
          });
          // Shrink to mini width and hide elements after text fades out
          setTimeout(() => {
            sidebar.style.maxWidth = "4rem";
            Array.from(hides).forEach((element) => {
              const el = element as HTMLElement;
              if (el.style.opacity === "0") {
                el.style.display = "none";
              }
            });
          }, 150);
          document.cookie = "sidebar_shrink=1";
        }
        setIsMini((prev) => !prev);
      }}
      className="p-1 h-fit rounded-lg hover:bg-white/5 transition-colors"
    >
      <Icon className="w-4 h-4 md:block hidden" icon="hugeicons:sidebar-left" />
    </button>
  );
}
