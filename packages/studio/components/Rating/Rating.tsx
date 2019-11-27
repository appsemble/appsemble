import classNames from 'classnames';
import React from 'react';

import styles from './Rating.css';

export interface RatingProps {
  className?: string;
  count?: number;
  value: number;
  onClick?: (value: number) => void;
}

export default function Rating({
  className,
  count,
  value,
  onClick,
}: RatingProps): React.ReactElement {
  const [localRating, setLocalRating] = React.useState(value);
  const resetRating = (): void => setLocalRating(value);

  const inactiveIcons = [];
  const activeIcons = [];

  for (let i = 0; i < 5; i += 1) {
    if (onClick !== undefined) {
      activeIcons.push(
        <button
          key={`active${i + 1}`}
          className={`icon ${styles.starButton} is-medium`}
          onClick={() => onClick(i + 1)}
          onMouseEnter={() => setLocalRating(i + 1)}
          onMouseLeave={resetRating}
          type="button"
        >
          <i className="fas fa-star fa-2x" />
        </button>,
      );
      inactiveIcons.push(
        <button
          key={`inActive${i + 1}`}
          className={`icon ${styles.starButton} is-medium`}
          onClick={() => onClick(i + 1)}
          onMouseEnter={() => setLocalRating(i + 1)}
          onMouseLeave={resetRating}
          type="button"
        >
          <i className="far fa-star fa-2x" />
        </button>,
      );
    } else {
      activeIcons.push(
        <span key={`active${i + 1}`} className="icon">
          <i className="fas fa-star" />
        </span>,
      );
      inactiveIcons.push(
        <span key={`inActive${i + 1}`} className="icon">
          <i className="far fa-star" />
        </span>,
      );
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
