import classNames from 'classnames';
import * as React from 'react';

import styles from './Loader.css';

export interface LoaderProps {
  className?: string;
  component?: React.ElementType;
}

export default function Loader({
  className,
  component: Component = 'div',
  ...props
}: LoaderProps): React.ReactElement {
  return <Component className={classNames(styles.loader, className)} {...props} />;
}
