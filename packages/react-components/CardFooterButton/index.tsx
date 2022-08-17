import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Button } from '../index.js';
import styles from './index.module.css';

export function CardFooterButton({
  className,
  color = 'white',
  ...props
}: ComponentPropsWithoutRef<typeof Button>): ReactElement {
  return (
    <Button
      className={classNames(`card-footer-item ${styles.root}`, className)}
      color={color}
      {...props}
    />
  );
}
