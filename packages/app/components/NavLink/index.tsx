import { type ComponentChildren, type JSX, type VNode } from 'preact';
import { Link, useLocation } from 'wouter-preact';

interface NavLinkProps extends Omit<
  JSX.HTMLAttributes<HTMLAnchorElement>,
  'children' | 'className' | 'ref'
> {
  readonly children?: ComponentChildren | ((isActive: boolean) => ComponentChildren);

  /**
   * The CSS class to apply to the link, or a function that returns it.
   */
  readonly className?: string | ((isActive: boolean) => string);

  /**
   * If specified, the link is only considered active if it’s an exact match.
   */
  readonly end?: boolean;

  readonly to: string;
}

/**
 * A navigation link that is active while the current path is its target or below it.
 */
export function NavLink({ children, className, end, to, ...props }: NavLinkProps): VNode {
  const [location] = useLocation();
  const path = location.toLowerCase();
  const target = to.toLowerCase();
  const isActive = path === target || (!end && path.startsWith(`${target}/`));

  return (
    <Link
      {...props}
      aria-current={isActive ? 'page' : undefined}
      className={typeof className === 'function' ? className(isActive) : className}
      to={to}
    >
      {typeof children === 'function' ? children(isActive) : children}
    </Link>
  );
}
