import { useEffect, useState } from 'react';

interface Classes {
  /**
   * The class to use when the element is open.
   *
   * Typically this has the following CSS:
   *
   * ```css
   * .open {
   *   opacity: 1;
   * }
   * ```
   */
  open?: string;

  /**
   * The class to use when the element is open.
   *
   * Typically this has the following CSS:
   *
   * ```css
   * .opening {
   *   opacity: 0;
   * }
   * ```
   */
  opening?: string;

  /**
   * The class to use when the element is open.
   *
   * Typically this is omitted. Otherwise this probaby has the following CSS:
   *
   * ```css
   * .closed {
   *   opacity: 0;
   * }
   * ```
   */
  closed?: string;

  /**
   * The class to use when the element is open.
   *
   * Typically this has the following CSS:
   *
   * ```css
   * .closing {
   *   opacity: 0;
   * }
   * ```
   */
  closing?: string;
}

/**
 * Use a delayed value based on a boolean state.
 *
 * This can be used to realize a CSS transition.
 *
 * @param isActive Whether the value should be active eventually.
 * @param duration The duraction of the CSS transition.
 * @param classes The CSS classes to use for each state.
 * @returns The CSS class that indicates the state of the animation.
 */
export function useAnimation(
  isActive: boolean,
  duration: number,
  { closed, closing, open, opening }: Classes,
): string | undefined {
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
      return;
    }

    // The timeout must match the CSS transition length.
    const timeout = setTimeout(setIsOpen, duration, false);
    return () => clearTimeout(timeout);
  }, [duration, isActive]);

  if (isActive) {
    if (isOpen) {
      return open;
    }
    return opening;
  }
  if (isOpen) {
    return closing;
  }
  return closed;
}
