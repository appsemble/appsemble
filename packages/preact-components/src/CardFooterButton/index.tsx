import classNames from 'classnames';
import { h, VNode } from 'preact';

import { Button, Props } from '..';
import styles from './index.css';

export function CardFooterButton({
  className,
  color = 'white',
  ...props
}: Props<typeof Button>): VNode {
  return (
    <Button
      className={classNames(`card-footer-item ${styles.root}`, className)}
      color={color}
      {...props}
    />
  );
}
