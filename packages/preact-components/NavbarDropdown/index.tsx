import classNames from 'classnames';
import { type ComponentChildren, type VNode } from 'preact';
import { useCallback, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { useClickOutside, useToggle } from '../index.js';

interface NavbarDropdownProps {
  /**
   * The children to render as menu items.
   *
   * Typically these are nodes that have the `dropdown-item` or `dropdown-divider` class.
   */
  readonly children: ComponentChildren;

  /**
   * An optional class name to add to the root element.
   */
  readonly className?: string;

  /**
   * The label to render on the menu toggle button.
   */
  readonly label: ComponentChildren;
}

export function NavbarDropdown({ children, className, label }: NavbarDropdownProps): VNode {
  const toggle = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle.disable();
      }
    },
    [toggle],
  );

  const onClick = useCallback(() => {
    toggle.toggle();
  }, [toggle]);

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, toggle.disable);

  return (
    <div
      className={classNames([
        'navbar-item',
        'has-dropdown',
        className,
        { 'is-active': toggle.enabled },
      ])}
      ref={ref}
    >
      <button className={`navbar-link ${styles.dropdown}`} onClick={onClick} type="button">
        {label}
      </button>
      <div
        className="navbar-dropdown is-right"
        onClick={toggle.disable}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
