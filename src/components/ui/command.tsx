"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/icon";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-overlay text-overlay-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/** A key in a footer button of the command dialog. */
const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-current/25 px-1.5 font-sans text-[11px] leading-none">
    {children}
  </kbd>
);

type FooterAction = { id: string; content: React.ReactNode; onPress: () => void };

/** The space between the track and the thumb, the same as `SegmentedControl`. */
const FOOTER_PAD = 4;

/**
 * The buttons of the footer, in a pill like the theme switch
 * (`SegmentedControl`). The button under the pointer (or with keyboard focus)
 * gets the thumb of a selected segment: the accent at 18 %. The thumb is one
 * shape: it slides from one button to the other in 200 ms. It fades in where
 * the pointer enters, and fades out when the pointer leaves the pill.
 */
const FooterPill = ({ actions }: { actions: FooterAction[] }) => {
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = React.useState<number | null>(null);
  // The last place of the thumb, so that it fades out where it was.
  const [thumb, setThumb] = React.useState({ left: 0, width: 0 });
  // No slide when the thumb appears: it fades in under the button.
  const [slides, setSlides] = React.useState(false);

  const show = (index: number) => {
    const button = buttons.current[index];
    if (!button) return;
    setSlides(active !== null);
    setThumb({ left: button.offsetLeft, width: button.offsetWidth });
    setActive(index);
  };

  return (
    <div
      className="relative flex items-center rounded-full bg-background shadow-field"
      style={{ padding: FOOTER_PAD }}
      onMouseLeave={() => setActive(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(null);
      }}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full motion-reduce:transition-none",
          slides
            ? "transition-[transform,width,opacity] duration-200 ease-out"
            : "transition-opacity duration-200 ease-out",
        )}
        style={{
          top: FOOTER_PAD,
          bottom: FOOTER_PAD,
          left: 0,
          width: thumb.width,
          transform: `translateX(${thumb.left}px)`,
          opacity: active === null ? 0 : 1,
          backgroundColor: "color-mix(in oklch, var(--accent) 18%, transparent)",
        }}
      />
      {actions.map((action, index) => (
        <button
          key={action.id}
          ref={(el) => {
            buttons.current[index] = el;
          }}
          type="button"
          // Keep the focus in the search box, so the selected item stays selected.
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => show(index)}
          onFocus={() => show(index)}
          onClick={action.onPress}
          className={cn(
            "relative z-10 flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-focus",
            active === index ? "text-accent-soft-foreground" : "text-muted",
          )}
        >
          {action.content}
        </button>
      ))}
    </div>
  );
};

/*
 * The search bar and the footer float over the list. Below each one, a layer
 * blurs the items that scroll behind it and fades out, so the items show
 * through. The list has room at the top (72 px) and at the bottom (64 px), so
 * no item is hidden before a scroll. The scrollbar of the list stays between
 * the two bars (`.command-list` in globals.css).
 */
const COMMAND_DIALOG_LAYOUT = cn(
  "relative bg-transparent",
  // The search bar: above the blur layer of the top.
  "[&_[cmdk-input-wrapper]]:absolute [&_[cmdk-input-wrapper]]:inset-x-0 [&_[cmdk-input-wrapper]]:top-0 [&_[cmdk-input-wrapper]]:z-20",
  "[&_[cmdk-input-wrapper]]:h-16 [&_[cmdk-input-wrapper]]:border-b-0 [&_[cmdk-input-wrapper]]:px-5",
  "[&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-16 [&_[cmdk-input]]:text-lg [&_[cmdk-input]]:tracking-tight",
  // The list.
  "[&_[cmdk-list]]:max-h-[456px] [&_[cmdk-list]]:pt-[72px] [&_[cmdk-list]]:pb-16",
  "[&_[cmdk-list]]:scroll-pt-[72px] [&_[cmdk-list]]:scroll-pb-16",
  // Groups and items.
  "[&_[cmdk-group]]:px-0 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-2",
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
  "[&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5",
);

/** A layer that blurs the items behind a bar, then fades out toward the list. */
const BLUR_LAYER =
  "pointer-events-none absolute left-0 right-3 z-10 bg-overlay/40 backdrop-blur-md";

const CommandDialog = ({ children, onOpenChange, ...props }: DialogProps) => {
  const rootRef = React.useRef<HTMLDivElement>(null);

  // cmdk opens the selected item on Enter in the search box.
  const openSelected = () =>
    rootRef.current
      ?.querySelector("[cmdk-input]")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      <DialogContent
        hideClose
        className="w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden rounded-3xl p-0"
      >
        {/* Radix needs a title for screen readers; the search box is the visible one. */}
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a page or an action, then press Enter.
        </DialogDescription>
        <Command ref={rootRef} className={COMMAND_DIALOG_LAYOUT}>
          <div
            aria-hidden
            className={`${BLUR_LAYER} top-0 h-[88px] [mask-image:linear-gradient(to_bottom,#000_60px,transparent)]`}
          />
          <div
            aria-hidden
            className={`${BLUR_LAYER} bottom-0 h-20 [mask-image:linear-gradient(to_top,#000_52px,transparent)]`}
          />
          {children}
          <div className="absolute bottom-3 right-3 z-20">
            <FooterPill
              actions={[
                {
                  id: "open",
                  content: (
                    <>
                      Open <Key>↵</Key>
                    </>
                  ),
                  onPress: openSelected,
                },
                {
                  id: "close",
                  content: (
                    <>
                      Close <Key>esc</Key>
                    </>
                  ),
                  onPress: () => onOpenChange?.(false),
                },
              ]}
            />
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-separator px-3" cmdk-input-wrapper="">
    <Icon name="search-outline" size={16} className="mr-2 shrink-0 text-muted" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 leading-none text-base sm:text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "command-list max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scroll-py-2 [&>[cmdk-list-sizer]]:relative",
      className
    )}
    {...props}
  >
    <SelectionHighlight />
    {children}
  </CommandPrimitive.List>
));

type HighlightBox = { x: number; y: number; width: number; height: number; danger: boolean };

/**
 * The highlight of the selected item (by the pointer or the arrow keys). It
 * is one shape: it slides from one item to the next in 200 ms, as the thumb
 * of the footer pill. It fades in on the first item and stays in the list,
 * so it scrolls with the items. An item with `data-tone="danger"` gets the
 * soft red.
 */
function SelectionHighlight() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<HighlightBox | null>(null);
  const [slides, setSlides] = React.useState(false);

  React.useLayoutEffect(() => {
    const list = ref.current?.closest("[cmdk-list]");
    if (!list) return;
    let shown = false;
    const update = () => {
      const item = list.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]');
      if (!item || item.offsetParent === null) {
        shown = false;
        setBox(null);
        return;
      }
      setSlides(shown);
      shown = true;
      setBox({
        x: item.offsetLeft,
        y: item.offsetTop,
        width: item.offsetWidth,
        height: item.offsetHeight,
        danger: item.dataset.tone === "danger",
      });
    };
    update();
    // cmdk changes `data-selected`, hides groups, and moves items as you type.
    const mutations = new MutationObserver(update);
    mutations.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-selected", "hidden"],
    });
    const resizes = new ResizeObserver(update);
    resizes.observe(list);
    return () => {
      mutations.disconnect();
      resizes.disconnect();
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-0 top-0 -z-10 rounded-2xl ease-out motion-reduce:transition-none",
        slides
          ? "transition-[transform,width,height,opacity,background-color] duration-200"
          : "transition-opacity duration-200",
        box?.danger ? "bg-danger-soft" : "bg-default",
      )}
      style={{
        width: box?.width ?? 0,
        height: box?.height ?? 0,
        transform: `translate(${box?.x ?? 0}px, ${box?.y ?? 0}px)`,
        opacity: box ? 1 : 0,
      }}
    />
  );
}

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-2 my-1 h-px bg-separator", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer gap-2 select-none items-center rounded-2xl px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
