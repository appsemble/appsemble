import classNames from 'classnames';
import * as React from 'react';

import Button from '../Button';
import styles from './CardFooterButton.css';

export default function CardFooterButton({
  className,
  color = 'white',
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>): React.ReactElement {
  return (
    <Button
      className={classNames(`card-footer-item ${styles.root}`, className)}
      color={color}
      {...props}
    />
  );
}
