import { Subtitle, Title } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { ReactElement } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';

import styles from './index.css';
import { messages } from './messages';

interface BlockCardProps {
  /**
   * The block to display.
   */
  block: BlockManifest;

  /**
   * The class to apply to the component.
   */
  className?: string;
}

/**
 * Display a card that contains basic information of a block and a link to further documentation.
 */
export function BlockCard({ block, className }: BlockCardProps): ReactElement {
  const { url } = useRouteMatch();
  const [org, ...name] = block.name.split('/');

  return (
    <div className={`card ${className}`} key={block.name}>
      <header className="card-header">
        <div className="card-header-title">
          <article className="media">
            <figure className="media-left">
              <p className="image is-64x64">
                <img
                  alt={`@${org}${name} ${messages.blockLogo}`}
                  src={`/api/blocks/${org}/${name}/versions/${block.version}/icon`}
                />
              </p>
            </figure>
            <div className="media-content">
              <Title level={4}>{name}</Title>
              <Subtitle level={6}>{org}</Subtitle>
            </div>
            <div className={`media-right ${styles.version}`}>
              <span className="subtitle is-6 has-text-grey">{block.version}</span>
            </div>
          </article>
        </div>
      </header>
      <div className={styles.cardBody}>
        <div className="card-content">
          <div className="content mb-3">
            {block.description ?? (
              <span className="has-text-grey-light">{messages.noDescription}</span>
            )}
          </div>
        </div>
        <footer className="card-footer">
          <Link className="card-footer-item" to={`${url}/${block.name}`}>
            {messages.buttonDetails}
          </Link>
        </footer>
      </div>
    </div>
  );
}
