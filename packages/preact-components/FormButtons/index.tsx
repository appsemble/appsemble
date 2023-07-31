import classNames from 'classnames';
import { type ComponentChildren, toChildArray, type VNode } from 'preact';

import styles from './index.module.css';

interface FormButtonsProps {
  readonly children: ComponentChildren;
  readonly className?: string;
}

/**
 * A wrapper for form buttons.
 *
 * If one element is padded, it’s aligned to the right. If more are defined, space is added between
 * them.
 */
export function FormButtons({ children, className }: FormButtonsProps): VNode {
  const multiple = toChildArray(children).length > 1;

  return (
    <div className={classNames(styles.root, multiple ? styles.multiple : styles.one, className)}>
      {children}
    </div>
  );
}
