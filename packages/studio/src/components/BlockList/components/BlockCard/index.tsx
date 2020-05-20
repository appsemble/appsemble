import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import styles from './index.css';
import messages from './messages';

interface BlockCardProps {
  block: BlockManifest;
}

export default function BlockCard({ block }: BlockCardProps): React.ReactElement {
  const match = useRouteMatch();
  const [org, ...name] = block.name.split('/');

  return (
    <div key={block.name} className="card">
      <header className="card-header">
        <p className="card-header-title">
          <div className="media-content">
            <p className="title is-4">{name}</p>
            <p className="subtitle is-6">{org}</p>
          </div>
          <div className={`media-right ${styles.version}`}>
            <span className="subtitle is-6 has-text-grey">{block.version}</span>
          </div>
        </p>
      </header>
      <div className={styles.cardBody}>
        <div className="card-content">
          <div className={`content ${styles.description}`}>
            {block.description ?? (
              <span className="has-text-grey-light">
                <FormattedMessage {...messages.noDescription} />
              </span>
            )}
          </div>
        </div>
        <footer className={`card-footer ${styles.footer}`}>
          <Link className="card-footer-item" to={`${match.url}/${block.name}`}>
            <FormattedMessage {...messages.buttonDetails} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
