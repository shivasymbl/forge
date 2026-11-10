import type { CSSProperties } from "react";
import { cn } from "../../lib/utils";

export type MulticaIconMode =
  /** The mark at rest. */
  | "static"
  /** An agent at work, loading, or waiting. The Asymbl mark does not animate. */
  | "think"
  /** App launch and sign-in. The Asymbl mark does not animate. */
  | "intro"
  /** `intro`, then `think` until whatever is loading unmounts it. */
  | "launch";

interface MulticaIconProps extends Omit<React.ComponentProps<"span">, "mode"> {
  mode?: MulticaIconMode;
  /** `circle` is the avatar form. */
  shape?: "square" | "circle";
  /**
   * Rendered size in px. Omit to size with `className` (1em default).
   */
  size?: number;
  /** Accessible name. Without one the mark is decorative. */
  title?: string;
  /** Accepted for API compatibility with the prior spinning mark — no visual effect. */
  animate?: boolean;
  /** Accepted for API compatibility with the prior spinning mark — no visual effect. */
  noSpin?: boolean;
  /** If true, wrap the mark in a bordered rounded square. */
  bordered?: boolean;
}

const ASSET_SRC = "/brand/asymbl-mark.png";

/**
 * Forge brand mark. Keeps the upstream MulticaIcon props (`mode`, `shape`,
 * numeric `size`, `title`) so loading and avatar call sites type-check, and
 * paints the Asymbl bracket-and-dot asset instead of the upstream star.
 */
export function MulticaIcon({
  mode: _mode = "static",
  shape = "square",
  size,
  title,
  animate: _animate,
  noSpin: _noSpin,
  bordered = false,
  className,
  style,
  ...props
}: MulticaIconProps) {
  const dimension: CSSProperties | undefined =
    size != null ? { width: size, height: size } : undefined;
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        size == null && "size-[1em]",
        shape === "circle" && "overflow-hidden rounded-full",
        bordered && "rounded-md border border-border",
        className,
      )}
      style={{ ...dimension, ...style }}
      {...props}
    >
      <img src={ASSET_SRC} alt="" className="block size-full object-contain" />
    </span>
  );
}

/** Backwards-compatible name for the Asymbl mark. */
export const AsymblLogo = MulticaIcon;
