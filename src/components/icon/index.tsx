import { memo, type CSSProperties } from "react";
import { ADMIN_GLYPHS } from "./admin-glyphs";
import { GLYPHS } from "./glyphs";

const ALL_GLYPHS = { ...GLYPHS, ...ADMIN_GLYPHS };

export type IconName = keyof typeof ALL_GLYPHS;

export type IconProps = {
  /**
   * The name of the icon, as in the mobile app (Ionicons names that draw
   * MingCute icons). "-outline" names draw the line style.
   */
  name: IconName;
  /** The side of the 24-grid box, in pixels. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** A label makes the icon visible to screen readers. */
  label?: string;
};

/**
 * An app icon. It uses the same glyphs as `Icon` of the mobile app
 * (`components/icon` in realstay-prod). The color is `currentColor`.
 */
export const Icon = memo(function Icon({
  name,
  size = 20,
  className,
  style,
  label,
}: IconProps) {
  const glyph: { d: string; stroke?: number; filled?: boolean } =
    ALL_GLYPHS[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ flexShrink: 0, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {glyph.stroke ? (
        <path
          d={glyph.d}
          fill={glyph.filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={glyph.stroke}
          strokeLinejoin="round"
        />
      ) : (
        <path d={glyph.d} fill="currentColor" />
      )}
    </svg>
  );
});
