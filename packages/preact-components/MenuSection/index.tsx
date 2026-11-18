import classNames from 'classnames';
import { type ComponentChildren, toChildArray, type VNode } from 'preact';

import styles from './index.module.css';

interface MenuSectionProps {
  /**
   * The class that is applied to the list container.
   */
  readonly className?: string;

  /**
   * Menu items to render.
   *
   * Each child will be wrapped in a `<li>` element.
   */
  readonly children: ComponentChildren;

  /**
   * An optional label to render on top of the menu list.
   */
  readonly label?: ComponentChildren;

  /**
   * The data-testid to apply to the element. Used for Playwright testing.
   */
  readonly testId?: string;
}

/**
 * Render a Bulma styled menu list.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuSection({ children, className, label, testId }: MenuSectionProps): VNode {
  return (
    <>
      {label ? <p className={`menu-label pl-1 ${styles.label}`}>{label}</p> : null}
      <ul
        className={classNames('menu-list', { [className ?? '']: className })}
        data-testid={testId}
      >
        {toChildArray(children).map((child) => (
          <li key={(child as VNode).key}>{child}</li>
        ))}
      </ul>
    </>
  );
}
