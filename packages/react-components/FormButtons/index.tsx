import classNames from 'classnames';
import { Children, type ReactNode } from 'react';

import styles from './index.module.css';

interface FormButtonsProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * A wrapper for form buttons.
 *
 * If one element is padded, it’s aligned to the right. If more are defined, space is added between
 * them.
 */
export function FormButtons({ children, className }: FormButtonsProps): ReactNode {
  const { length } = Children.toArray(children).filter(Boolean);

  return (
    <div className={classNames(styles.root, length > 1 ? styles.multiple : styles.one, className)}>
      {children}
    </div>
  );
}
