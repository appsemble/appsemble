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
      <div className="card-content">
        <div className="media-content">
          <p className="title is-4">{name}</p>
          <p className="subtitle is-6">{org}</p>
        </div>
        <div className={`content ${styles.description}`}>{block.description}</div>
      </div>
      <footer className={`card-footer ${styles.footer}`}>
        <Link className="card-footer-item" to={`${match.url}/${block.name}`}>
          <FormattedMessage {...messages.buttonDetails} />
        </Link>
      </footer>
    </div>
  );
}
