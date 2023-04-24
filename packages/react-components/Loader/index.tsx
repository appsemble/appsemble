import classNames from 'classnames';
import { type ElementType, type ReactElement } from 'react';

import styles from './index.module.css';

interface LoaderProps {
  className?: string;
  component?: ElementType;
}

export function Loader({
  className,
  component: Component = 'div',
  ...props
}: LoaderProps): ReactElement {
  return (
    <Component className={classNames(styles.loader, 'appsemble-loader', className)} {...props} />
  );
}
