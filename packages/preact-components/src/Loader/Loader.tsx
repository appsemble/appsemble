/** @jsx h */
import classNames from 'classnames';
import { ComponentType, h, VNode } from 'preact';

import styles from './Loader.css';

export interface LoaderProps {
  className?: string;
  component?: string | ComponentType<{ className: string }>;
}

export default function Loader({ className, component: Component = 'div' }: LoaderProps): VNode {
  return <Component className={classNames(styles.loader, className)} />;
}
