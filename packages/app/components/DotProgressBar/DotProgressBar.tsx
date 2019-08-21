import React, { ReactNode } from 'react';

import styles from './DotProgressBar.css';

interface DotProgressBarProps {
  amount: number;
  active: number;
}

export default class DotProgressBar extends React.Component<DotProgressBarProps> {
  createNodes = (): JSX.Element[] => {
    const { active, amount } = this.props;
    const nodes = [];
    for (let i = 0; i < amount; i += 1) {
      nodes.push(
        <div
          key={i}
          className={`${styles.dot} ${i < active && styles.previous} ${i === active &&
            styles.active}`}
        />,
      );
    }

    return nodes;
  };

  render(): ReactNode {
    return <div className={styles.dotContainer}>{this.createNodes()}</div>;
  }
}
