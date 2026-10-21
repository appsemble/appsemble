import classNames from 'classnames';
import { type ComponentChildren, type ComponentType, type JSX, type VNode } from 'preact';

import styles from './index.module.css';

export interface LoaderProps {
  readonly className?: string;
  readonly component?:
    | ComponentType<{ children: ComponentChildren; className: string; role: string }>
    | JSX.ElementType;

  /**
   * The text announced to assistive technology while loading.
   */
  readonly label: string;
}

export function Loader({ className, component: Component = 'div', label }: LoaderProps): VNode {
  // Typescript hack to avoid incompatible types error
  const C = Component as 'div';
  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <C
      className={classNames(styles.loader, 'appsemble-loader', className)}
      data-testid="loader-comp"
      role="status"
    >
      <span className="is-sr-only">{label}</span>
    </C>
  );
}
