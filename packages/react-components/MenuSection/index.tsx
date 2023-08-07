import classNames from 'classnames';
import { Children, type ReactElement, type ReactNode } from 'react';

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
  readonly children: ReactNode;

  /**
   * An optional label to render on top of the menu list.
   */
  readonly label?: ReactNode;
}

/**
 * Render a Bulma styled menu list.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuSection({ children, className, label }: MenuSectionProps): ReactElement {
  return (
    <>
      {label ? <p className={`menu-label pl-1 ${styles.label}`}>{label}</p> : null}
      <ul className={classNames('menu-list', { [className]: className })}>
        {Children.map(children, (child) => (
          <li>{child}</li>
        ))}
      </ul>
    </>
  );
}
