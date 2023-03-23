import { ReactElement } from 'react';

import styles from './index.module.css';

interface SidebarProps {
  children: ReactElement[];
  type: 'left' | 'right';
  isOpen: boolean;
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
