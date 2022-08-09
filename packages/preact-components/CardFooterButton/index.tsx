import classNames from 'classnames';
import { ComponentProps, VNode } from 'preact';

import { Button } from '../index.js';
import styles from './index.module.css';

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
