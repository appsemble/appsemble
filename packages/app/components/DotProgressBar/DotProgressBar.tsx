import classNames from 'classnames';
import React, { ReactNode } from 'react';

import styles from './DotProgressBar.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export default class DotProgressBar extends React.Component<DotProgressBarProps> {
  render(): ReactNode {
    const { active, amount } = this.props;

    return (
      <div className={styles.dotContainer}>
        {Array.from(Array(amount), (_, index) => (
          <div
            key={index}
            className={classNames(styles.dot, {
              [styles.previous]: index < active,
              [styles.active]: index === active,
            })}
          />
        ))}
      </div>
    );
  }
}
