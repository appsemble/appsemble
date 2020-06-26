import classNames from 'classnames';
import React from 'react';

import styles from './index.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export default function DotProgressBar({
  active,
  amount,
}: DotProgressBarProps): React.ReactElement {
  return (
    <div className={styles.dotContainer}>
      {Array.from(Array(amount), (_, index) => (
        <div
          key={index}
          className={classNames('is-inline-block my-0 mx-1 pr-4 pt-4', styles.dot, {
            [styles.previous]: index < active,
            [styles.active]: index === active,
          })}
        />
      ))}
    </div>
  );
}
