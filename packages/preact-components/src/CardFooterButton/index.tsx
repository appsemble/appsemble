import classNames from 'classnames';
import { h, VNode } from 'preact';

import Button from '../Button';
import type { Props } from '../types';
import styles from './index.css';

export default function CardFooterButton({
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
