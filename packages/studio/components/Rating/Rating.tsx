import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';

import styles from './Rating.css';

export interface RatingProps {
  className?: string;
  count?: number;
  value: number;
}

export default function Rating({ className, count, value }: RatingProps): React.ReactElement {
  return (
    <span className={classNames(styles.container, className)}>
      <div className={styles.wrapper}>
        <span className={styles.starsActive} style={{ width: `${value * 20}%` }}>
          <Icon icon="star" />
          <Icon icon="star" />
          <Icon icon="star" />
          <Icon icon="star" />
          <Icon icon="star" />
        </span>
        <span className={styles.starsInactive}>
          <Icon icon="star" prefix="far" />
          <Icon icon="star" prefix="far" />
          <Icon icon="star" prefix="far" />
          <Icon icon="star" prefix="far" />
          <Icon icon="star" prefix="far" />
        </span>
      </div>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}
