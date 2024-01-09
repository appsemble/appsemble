import { type ReactNode } from 'react';

import styles from './index.module.css';

interface SidebarProps {
  readonly children: ReactNode;
  readonly type: 'left' | 'right';
  readonly isOpen: boolean;
}

export function Sidebar({ children, isOpen, type }: SidebarProps): ReactNode {
  return (
    <div
      className={`${type === 'left' ? styles.leftBar : styles.rightBar}  ${
        isOpen ? styles.isOpen : styles.isClosed
      }`}
      id={String(type === 'left' ? 'leftBar' : 'rightBar')}
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
