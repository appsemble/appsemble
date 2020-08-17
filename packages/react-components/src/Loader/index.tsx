import classNames from 'classnames';
import React, { ElementType, ReactElement } from 'react';

import styles from './index.css';

interface LoaderProps {
  className?: string;
  component?: ElementType;
}

export function Loader({
  className,
  component: Component = 'div',
  ...props
}: LoaderProps): ReactElement {
  return <Component className={classNames(styles.loader, className)} {...props} />;
}
