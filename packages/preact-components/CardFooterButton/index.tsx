import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';

import styles from './index.module.css';
import { Button } from '../index.js';

export function CardFooterButton({
  className,
  color = 'white',
  ...props
}: ComponentProps<typeof Button>): VNode {
  return (
    <Button
      className={classNames(`card-footer-item ${styles.root}`, className)}
      color={color}
      {...props}
    />
  );
}
