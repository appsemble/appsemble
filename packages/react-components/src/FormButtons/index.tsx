import classNames from 'classnames';
import * as React from 'react';

import styles from './index.css';

interface FormButtonsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A wrapper for form buttons.
 *
 * If one element is padded, it’s aligned to the right. If more are defined, space is added between
 * them.
 */
export default function FormButtons({ children, className }: FormButtonsProps): React.ReactElement {
  const count = React.Children.count(children);

  return (
    <div className={classNames(styles.root, count > 1 ? styles.multiple : styles.one, className)}>
      {children}
    </div>
  );
}
