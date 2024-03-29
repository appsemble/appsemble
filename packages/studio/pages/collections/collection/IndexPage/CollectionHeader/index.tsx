import { type AppCollection } from '@appsemble/types';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { ExpertCard } from '../../ExpertCard/index.js';

interface CollectionHeaderProps {
  readonly collection: AppCollection;
}

export function CollectionHeader({ collection }: CollectionHeaderProps): ReactNode {
  return (
    <header className="has-background-primary is-flex is-flex-wrap-wrap">
      <div
        className={`is-flex-grow-1 is-flex ${styles.headerImage}`}
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          backgroundImage: `url(${collection.headerImage})`,
        }}
      >
        <h1
          className={`has-text-weight-semibold is-size-1 has-text-white m-auto ${styles.headerTitle}`}
        >
          {collection.name}
        </h1>
      </div>
      <Link className="m-auto" to={`collections/${collection.id}/expert`}>
        <ExpertCard expert={collection.$expert} />
      </Link>
    </header>
  );
}
