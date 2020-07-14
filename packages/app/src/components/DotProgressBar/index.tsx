import classNames from 'classnames';
import React, { ReactElement } from 'react';

import styles from './index.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export default function DotProgressBar({ active, amount }: DotProgressBarProps): ReactElement {
  return (
    <div className={styles.dotContainer}>
      {Array.from(Array(amount), (_, index) => (
        <div
          key={index}
          className={classNames('is-inline-block mx-1', styles.dot, {
            [styles.previous]: index < active,
            [styles.active]: index === active,
          })}
        />
      ))}
    </div>
  );
}
