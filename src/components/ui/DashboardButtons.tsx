"use client";
import { adminMenuItems, menuItems } from "@/lib/dashboardMenu";
import { Icon } from "@iconify/react/dist/iconify.js";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import {
  Fragment,
  memo,
  SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

export function DashboardButtonsGeneral({
  isCollapsed,
}: {
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const x of menuItems) {
      router.prefetch(x.path);
    }
  }, [router]);

  return (
    <Fragment>
      {menuItems.map((val) => (
        <button
          key={val.path}
          disabled={pathname === val.path}
          onClick={() => router.push(val.path)}
          className={clsx(
            `flex gap-2 p-3 items-center w-full rounded-xl text-sm leading-none font-semibold transition-all duration-200`,
            pathname === val.path ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
          )}
        >
          <Icon
            width={16}
            height={16}
            color="white"
            icon={val.icon}
            className="flex-shrink-0"
          />
          <span
            className="hide transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
            }}
          >
            {val.label}
          </span>
        </button>
      ))}
    </Fragment>
  );
}

export function DashboardButtonsAdmin({
  isCollapsed,
}: {
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const x of adminMenuItems) {
      router.prefetch(x.path);
    }
  }, [router]);

  return (
    <Fragment>
      {adminMenuItems.map((val) => (
        <button
          key={val.path}
          disabled={pathname === val.path}
          onClick={() => router.push(val.path)}
          className={clsx(
            `flex gap-2 p-3 items-center w-full rounded-xl text-sm leading-none font-semibold transition-all duration-200`,
            pathname === val.path ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
          )}
        >
          <Icon
            width={16}
            height={16}
            color="white"
            icon={val.icon}
            className="flex-shrink-0"
          />
          <span
            className="hide transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
            }}
          >
            {val.label}
          </span>
        </button>
      ))}
    </Fragment>
  );
}

export function AccountMenu({ isCollapsed }: { isCollapsed: boolean }) {
  const [isClicked, setIsClicked] = useState(false);

  // Always use the same layout regardless of collapsed state
  return (
    <Fragment>
      <div className="flex flex-1" />
      <motion.div className="flex flex-col w-full transition-all duration-700">
        {/* Hide the "Realstay super-admin" text and image */}
        <div
          className="text-xs font-semibold text-[#979797] tracking-wide leading-none ml-3 flex hide transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
            display: isCollapsed ? "none" : "block",
          }}
        >
          <div className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">
            <p className="flex items-center opacity-60 gap-1">
              <Image
                alt="realstay logo"
                src={"/splash.svg"}
                width={16}
                height={16}
              />
              {"Realstay super-admin"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsClicked((prev) => !prev);
          }}
          className="mt-3 p-2 w-full bg-white/[0.01] hover:bg-white/[0.05] rounded-[1rem] flex items-center gap-2 transition-all duration-200"
        >
          <div className="w-[1.75rem] aspect-square rounded-full bg-orange-900 flex-shrink-0 relative">
            {/* Online status indicator */}
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#181818]" />
          </div>

          <div
            className="flex flex-col gap-1 flex-1 justify-start text-left transition-all duration-300 ease-in-out hide whitespace-nowrap overflow-hidden"
            style={{
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
            }}
          >
            <p className="text-sm font-semibold tracking-wide leading-none">
              {"Favours G"}
            </p>
            <p className="text-xs tracking-wide leading-none opacity-70">
              {"seeing.things@fr.com"}
            </p>
          </div>

          <div
            className="transition-all duration-300 ease-in-out hide"
            style={{
              transform: `rotate(${isClicked ? "90deg" : "0deg"})`,
              opacity: isCollapsed ? 0 : 1,
            }}
          >
            <Icon
              icon={"hugeicons:arrow-right-double"}
              width={16}
              height={16}
              color="white"
            />
          </div>
        </button>

        <AnimatePresence>
          {isClicked && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0, originY: 0 }}
              animate={{
                opacity: 1,
                scaleY: 1,
                transition: {
                  duration: 0.25,
                  ease: [0.4, 0.0, 0.2, 1],
                },
              }}
              exit={{
                opacity: 0,
                scaleY: 0,
                transition: {
                  duration: 0.2,
                  ease: [0.4, 0.0, 0.2, 1],
                },
              }}
              className="mt-3 bg-[#181818] flex flex-col gap-3 rounded-3xl border border-[#262626] text-sm font-semibold p-3"
            >
              <button className="p-2 gap-2 text-left flex items-center hover:bg-white/5 hover:pl-4 rounded-xl transition-all duration-200">
                <Icon
                  icon={"hugeicons:user"}
                  width={16}
                  height={16}
                  className="flex-shrink-0"
                />
                <span
                  className="hide transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
                  style={{
                    opacity: isCollapsed ? 0 : 1,
                    transform: isCollapsed
                      ? "translateX(-10px)"
                      : "translateX(0)",
                  }}
                >
                  Account
                </span>
              </button>
              <button className="p-2 gap-2 text-left flex items-center hover:bg-white/5 hover:pl-4 rounded-xl transition-all duration-200">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path
                    d="M12 13.3333C12.7364 13.3333 13.3333 12.7364 13.3333 12V3.99996C13.3333 3.26358 12.7364 2.66663 12 2.66663"
                    stroke="#F59292"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.66663 4.56518V11.4349C2.66663 12.497 2.66663 13.028 2.97629 13.3984C3.28595 13.7688 3.80939 13.8638 4.85627 14.0538L6.85629 14.4168C8.31336 14.6812 9.04196 14.8134 9.52096 14.4144C9.99996 14.0154 9.99996 13.2762 9.99996 11.7979V4.20221C9.99996 2.72389 9.99996 1.98473 9.52096 1.5857C9.04196 1.18667 8.31336 1.31889 6.85629 1.58334L4.85627 1.94631C3.80939 2.13631 3.28595 2.2313 2.97629 2.60167C2.66663 2.97203 2.66663 3.50309 2.66663 4.56518Z"
                    stroke="#F59292"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.66663 7.99885V7.99219"
                    stroke="#F59292"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="hide transition-all text-[#F59292] duration-300 ease-in-out whitespace-nowrap overflow-hidden"
                  style={{
                    opacity: isCollapsed ? 0 : 1,
                    transform: isCollapsed
                      ? "translateX(-10px)"
                      : "translateX(0)",
                  }}
                >
                  Log out
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Fragment>
  );
}

import { useTransitionRouter } from "next-view-transitions";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "./drawer";

const Menu01Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color={"#000000"}
    fill={"none"}
    {...props}
  >
    <path
      d="M4 5L20 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M4 12L20 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M4 19L20 19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);

export const MobileDashboardButtons = ({
  name = "Administrator",
}: {
  name?: string;
}) => {
  const pathname = usePathname();
  const router = useTransitionRouter();
  const [open, setOpen] = useState(false);

  const allItems = useMemo(() => [...menuItems, ...adminMenuItems], []);
  const itemsComp = useCallback(() => {
    return allItems.map(
      (val) =>
        val.path !== pathname && (
          <button
            key={`mobile-${val}`}
            onClick={() => {
              setOpen(false);
              setTimeout(() => router.push(val.path), 100);
            }}
            className="bg-white/[0.01] flex items-center text-left min-h-12 pl-6 rounded-[0.625rem] text-sm font-medium hover:bg-white/80 focus:outline-none focus:ring-0 focus:ring-offset-2 focus:ring-offset-white/50"
          >
            <Icon icon={val.icon} className="mr-4" />
            {val.label}
          </button>
        )
    );
  }, [allItems, pathname]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="md:hidden mr-6">
        <Menu01Icon width={20} height={20} />
      </DrawerTrigger>
      <DrawerContent className="md:hidden p-6 pt-8 rounded-t-3xl">
        <h4 className="text-2xl font-semibold mt-2">{`Welcome, ${name}`}</h4>
        <p className="text-sm mt-2 text-muted-foreground">Navigate to:</p>
        <div className="flex flex-col gap-4 overflow-clip mt-3 max-h-[27rem]">
          {itemsComp()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
