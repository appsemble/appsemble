import { type ReactElement } from 'react';

import styles from './index.module.css';

interface SidebarProps {
  readonly children: ReactElement | ReactElement[];
  readonly type: 'left' | 'right';
  readonly isOpen: boolean;
}

export function Sidebar({ children, isOpen, type }: SidebarProps): ReactElement {
  return (
    <div
      className={`${type === 'left' ? styles.leftBar : styles.rightBar}  ${
        isOpen ? styles.isOpen : styles.isClosed
      }`}
    >
      <div
        className={`${styles.root} ${
          type === 'left' ? styles.leftBarSlider : styles.rightBarSlider
        }`}
      >
        {children}
      </div>
    </div>
  );
}
