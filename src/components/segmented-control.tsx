"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Radio, RadioGroup } from "react-aria-components";

export type SegmentedOption = {
  value: string;
  /** For screen readers, and the visible text when there is no `content`. */
  label: string;
  /** What the segment shows, for example an icon. */
  content?: ReactNode;
};

/** The space between the track and the thumb, the same as the app (4 px). */
const PAD = 4;

/**
 * The segmented pill of the mobile app (realstay-prod
 * `components/segmented-control`): a pill track, and a pill thumb in the
 * accent color at 18 % that slides to the selected segment in 200 ms. The
 * selected label has the soft accent text color; the others are muted.
 */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  surface = "surface",
  segmentWidth = 36,
  height = 32,
  className,
}: {
  label: string;
  options: SegmentedOption[];
  /** No thumb shows when the value matches no option. */
  value: string | undefined;
  onChange: (value: string) => void;
  /** The color under the control: the track takes the other one, so it shows. */
  surface?: "surface" | "background";
  segmentWidth?: number;
  height?: number;
  className?: string;
}) {
  const index = options.findIndex((o) => o.value === value);

  return (
    <RadioGroup
      aria-label={label}
      orientation="horizontal"
      value={index >= 0 ? value : null}
      onChange={onChange}
      className={clsx(
        "relative flex shrink-0 rounded-full",
        surface === "surface" ? "bg-background" : "bg-surface",
        className,
      )}
      style={{ padding: PAD, height, width: options.length * segmentWidth + PAD * 2 }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{
          top: PAD,
          left: PAD,
          width: segmentWidth,
          height: height - PAD * 2,
          opacity: index >= 0 ? 1 : 0,
          transform: `translateX(${Math.max(index, 0) * segmentWidth}px)`,
          backgroundColor: "color-mix(in oklch, var(--accent) 18%, transparent)",
        }}
      />
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className={({ isSelected, isFocusVisible }) =>
            clsx(
              "relative z-10 flex cursor-pointer items-center justify-center rounded-full text-xs font-semibold outline-none transition-colors duration-200",
              isSelected ? "text-accent-soft-foreground" : "text-muted hover:text-foreground",
              isFocusVisible && "ring-2 ring-focus",
            )
          }
          style={{ width: segmentWidth }}
        >
          {option.content ?? option.label}
        </Radio>
      ))}
    </RadioGroup>
  );
}
