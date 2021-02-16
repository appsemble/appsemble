import { Button, useClickOutside, useToggle } from '@appsemble/react-components';
import classNames from 'classnames';
import { KeyboardEvent, ReactElement, ReactNode, useCallback, useRef } from 'react';

import styles from './index.css';

interface NavbarDropdownProps {
  /**
   * The children to render as menu items.
   *
   * Typically these are nodes that have the `dropdown-item` or `dropdown-divicer` class.
   */
  children: ReactNode;

  /**
   * An optional class name to add to the root element.
   */
  className?: string;

  /**
   * The label to render on the menu toggle button.
   */
  label: ReactNode;
}

export function NavbarDropdown({ children, className, label }: NavbarDropdownProps): ReactElement {
  const toggle = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggle.disable();
      }
    },
    [toggle],
  );

  const ref = useRef<HTMLDivElement>();
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
      <Button
        className={`navbar-link ${styles.dropdown}`}
        color="dark"
        onClick={toggle.toggle}
        type="button"
      >
        {label}
      </Button>
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
