import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import styles from './index.module.css';
import { Button } from '../index.js';

export function CardFooterButton({
  className,
  color = 'white',
  ...props
}: ComponentPropsWithoutRef<typeof Button>): ReactNode {
  return (
    <Button
      className={classNames(`card-footer-item ${styles.root}`, className)}
      color={color}
      {...props}
    />
  );
}
