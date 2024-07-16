import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';

interface LogViewerProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly className?: string;
}

export function LogViewer({ children, className, title }: LogViewerProps): ReactNode {
  return (
    <div className={classNames(styles['log-field'], 'is-family-monospace', className)}>
      <h1 className={styles.title}>{title}</h1>
      {children}
    </div>
  );
}
