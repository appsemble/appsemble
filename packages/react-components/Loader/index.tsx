import classNames from 'classnames';
import { type ElementType, type ReactNode } from 'react';

import styles from './index.module.css';

interface LoaderProps {
  readonly className?: string;
  readonly component?: ElementType;
}

export function Loader({
  className,
  component: Component = 'div',
  ...props
}: LoaderProps): ReactNode {
  return (
    <Component className={classNames(styles.loader, 'appsemble-loader', className)} {...props} />
  );
}
