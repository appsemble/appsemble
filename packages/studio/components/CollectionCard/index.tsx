import { Subtitle, Title } from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import styles from './index.module.css';

interface CollectionCardProps {
  /**
   * The collection to render a card for.
   */
  readonly collection: AppCollection;
}

export function CollectionCard({ collection }: CollectionCardProps): ReactNode {
  return (
    <Link className="card" title={collection.name} to={`../../../collections/${collection.id}`}>
      <div className="card-content is-flex">
        <div className="media">
          <figure className={`image is-128x128 is-flex is-clipped is-rounded ${styles.figure}`}>
            <img
              alt={collection.name}
              className={`card ${styles.image}`}
              src={collection.headerImage}
            />
          </figure>
        </div>
        <div className="ml-3">
          <Title className={`${styles.ellipsis} ${styles.title}`} size={5}>
            {collection.name}
          </Title>
          <Subtitle className={`mb-0 ${styles.ellipsis}`} size={6}>
            {collection.$expert.name}
          </Subtitle>
        </div>
      </div>
    </Link>
  );
}
