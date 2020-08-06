import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React, { ReactElement, useState } from 'react';

import styles from './index.css';

interface RatingProps {
  className?: string;
  count?: number;
  value: number;
  onClick?: (value: number) => void;
}

export default function Rating({ className, count, onClick, value }: RatingProps): ReactElement {
  const [localRating, setLocalRating] = useState(value);
  const resetRating = (): void => setLocalRating(value);

  const inactiveIcons = [];
  const activeIcons = [];

  for (let i = 0; i < 5; i += 1) {
    if (onClick !== undefined) {
      activeIcons.push(
        <button
          key={i}
          className={`icon ${styles.starButton} is-medium`}
          onClick={() => onClick(i + 1)}
          onMouseEnter={() => setLocalRating(i + 1)}
          onMouseLeave={resetRating}
          type="button"
        >
          <i className={`fas fa-star fa-2x ${styles.starIcon}`} />
        </button>,
      );
      inactiveIcons.push(
        <button
          key={i}
          className={`icon ${styles.starButton} is-medium`}
          onClick={() => onClick(i + 1)}
          onMouseEnter={() => setLocalRating(i + 1)}
          onMouseLeave={resetRating}
          type="button"
        >
          <i className={`far fa-star fa-2x ${styles.starIcon}`} />
        </button>,
      );
    } else {
      activeIcons.push(<Icon key={i} className={styles.starIcon} icon="star" prefix="fas" />);
      inactiveIcons.push(<Icon key={i} className={styles.starIcon} icon="star" prefix="far" />);
    }
  }

  return (
    <span className={classNames(styles.container, className)}>
      <div className={styles.wrapper}>
        <span className={styles.starsInactive}>{inactiveIcons}</span>
        <span className={styles.starsActive} style={{ width: `${localRating * 20}%` }}>
          {activeIcons}
        </span>
      </div>
      {count == null || <span>({count})</span>}
    </span>
  );
}
