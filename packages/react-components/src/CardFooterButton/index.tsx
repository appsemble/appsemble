import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, ReactElement } from 'react';

import Button from '../Button';
import styles from './index.css';

export default function CardFooterButton({
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
