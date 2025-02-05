import classNames from 'classnames';
import { type ComponentType, type JSX, type VNode } from 'preact';

import styles from './index.module.css';

export interface LoaderProps {
  readonly className?: string;
  readonly component?: ComponentType<{ className: string }> | JSX.ElementType;
}

export function Loader({ className, component: Component = 'div' }: LoaderProps): VNode {
  if (typeof Component === 'string') {
    // Typescript hack to avoid incompatible types error
    const C = Component as 'div';
    return (
      <C
        className={classNames(styles.loader, 'appsemble-loader', className)}
        data-testid="loader-comp"
      />
    );
  }
  return (
    <Component
      className={classNames(styles.loader, 'appsemble-loader', className)}
      data-testid="loader-comp"
    />
  );
}
