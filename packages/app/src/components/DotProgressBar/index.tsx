import classNames from 'classnames';
import { ReactElement } from 'react';

import styles from './index.module.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export function DotProgressBar({ active, amount }: DotProgressBarProps): ReactElement {
  return (
    <div className={styles.dotContainer}>
      {Array.from({ length: amount }, (unused, index) => (
        <div
          className={classNames('is-inline-block mx-1', styles.dot, {
            [styles.previous]: index < active,
            [styles.active]: index === active,
          })}
          key={index}
        />
      ))}
    </div>
  );
}
