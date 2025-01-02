import classNames from 'classnames';
import { type ComponentType, type JSX, type VNode } from 'preact';

import styles from './index.module.css';

export interface LoaderProps {
  readonly className?: string;
  readonly component?: ComponentType<{ className: string }> | keyof JSX.IntrinsicElements;
}

export function Loader({ className, component: Component = 'div' }: LoaderProps): VNode {
  return (
    <Component
      className={classNames(styles.loader, 'appsemble-loader', className)}
      data-testid="loader-comp"
    />
  );
}
