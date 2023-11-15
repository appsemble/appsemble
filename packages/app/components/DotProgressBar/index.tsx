import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';

interface DotProgressBarProps {
  readonly amount: number;
  readonly active: number;
}

export function DotProgressBar({ active, amount }: DotProgressBarProps): ReactNode {
  return (
    <div className={`${styles.dotContainer} mr-1`}>
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
