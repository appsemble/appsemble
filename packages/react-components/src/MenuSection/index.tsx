import { Children, ReactElement, ReactNode } from 'react';

import styles from './index.css';

interface MenuSectionProps {
  /**
   * Menu items to render.
   *
   * Each child will be wrapped in a `<li>` element.
   */
  children: ReactNode;

  /**
   * An optional label to render on top of the menu list.
   */
  label?: ReactNode;
}

/**
 * Render a Bulma styled menu list.
 *
 * https://bulma.io/documentation/components/menu
 */
export function MenuSection({ children, label }: MenuSectionProps): ReactElement {
  return (
    <>
      {label && <p className={`menu-label pl-1 ${styles.label}`}>{label}</p>}
      <ul className="menu-list">
        {Children.map(children, (child) => (
          <li>{child}</li>
        ))}
      </ul>
    </>
  );
}
