import classNames from 'classnames';
import { type ComponentType, type VNode } from 'preact';

import styles from './index.module.css';

export interface LoaderProps {
  className?: string;
  component?: ComponentType<{ className: string }> | string;
}

export function Loader({ className, component: Component = 'div' }: LoaderProps): VNode {
  return <Component className={classNames(styles.loader, 'appsemble-loader', className)} />;
}
