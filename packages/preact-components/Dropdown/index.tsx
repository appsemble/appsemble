import { Icon } from '@appsemble/preact-components';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { type ComponentChild, type ComponentChildren, type VNode } from 'preact';
import { useCallback, useRef } from 'preact/hooks';

import styles from './index.module.css';
import { Button, useClickOutside, useToggle } from '../index.js';

interface DropdownProps {
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
   * An optional class name to add to the icon element.
   */
  readonly iconClassName?: string;

  /**
   * The label to render on the menu toggle button.
   */
  readonly label: ComponentChild;

  /**
   * The icon to display next to the label.
   */
  readonly icon?: IconName;

  /**
   * Whether to render the dropdown trigger as a button.
   *
   * @default true
   */
  readonly asButton?: boolean;
}

/**
 * Render an aria compliant Bulma dropdown menu.
 */
export function Dropdown({
  asButton = true,
  children,
  className,
  icon,
  iconClassName,
  label,
}: DropdownProps): VNode {
  const ref = useRef<HTMLDivElement>();
  const { disable, enabled, toggle } = useToggle();

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        disable();
      }
    },
    [disable],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      toggle();
    },
    [toggle],
  );

  useClickOutside(ref, disable);

  return (
    <div
      className={classNames('dropdown', className, { 'is-active': enabled })}
      data-testid="dropdown"
      ref={ref}
    >
      <div className="dropdown-trigger">
        {asButton ? (
          <Button aria-haspopup icon={icon} onClick={handleClick} onKeyDown={onKeyDown}>
            {label}
          </Button>
        ) : (
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
          <div
            aria-haspopup
            onClick={handleClick}
            onKeyDown={onKeyDown}
            role="button"
            tabIndex={-1}
          >
            <Icon className={iconClassName} icon={icon} />
          </div>
        )}
      </div>
      <div
        className={classNames('dropdown-menu', styles['dropdown-menu'])}
        data-testid="dropdown-menu"
        onClick={handleClick}
        onKeyDown={onKeyDown}
        role="menu"
        tabIndex={0}
      >
        <div className="dropdown-content">{children}</div>
      </div>
    </div>
  );
}
