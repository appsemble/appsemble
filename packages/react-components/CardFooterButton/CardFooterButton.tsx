import { BulmaColor } from '@appsemble/types';
import classNames from 'classnames';
import * as React from 'react';

import styles from './CardFooterButton.css';

interface CardFooterButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  color?: BulmaColor;
}

export default function CardFooterButton({
  className,
  color = 'white',
  type = 'button',
  ...props
}: CardFooterButtonProps): React.ReactElement {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      className={classNames(`card-footer-item button is-${color} ${styles.root}`, className)}
      type={type}
      {...props}
    />
  );
}
