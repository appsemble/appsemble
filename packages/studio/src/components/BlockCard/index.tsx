import { Subtitle, Title } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages';

interface BlockCardProps {
  /**
   * The block to display.
   */
  block: BlockManifest;

  /**
   * The base URL to use for the link to the block details page.
   */
  baseUrl?: string;
}

/**
 * Display a card that contains basic information of a block and a link to further documentation.
 */
export function BlockCard({ baseUrl, block }: BlockCardProps): ReactElement {
  const { url } = useRouteMatch();
  const [org, ...name] = block.name.split('/');

  return (
    <div className={`card is-flex ${styles.root}`} key={block.name} title={block.name}>
      <header className="card-header">
        <div className="card-header-title">
          <div className={`media is-flex ${styles.header}`}>
            <div className={`media-left ${styles.nogrow}`}>
              <figure className="image is-64x64">
                <img
                  alt={`@${org}${name} ${messages.blockLogo}`}
                  src={`/api/blocks/${org}/${name}/versions/${block.version}/icon`}
                />
              </figure>
            </div>
            <div className={`media-content ${styles.headerContent}`}>
              <Title className={styles.ellipsis} lang={defaultLocale} level={5} size={4}>
                {name}
              </Title>
              <Subtitle className={styles.ellipsis} lang={defaultLocale} level={6}>
                {org}
              </Subtitle>
            </div>
            <div className={`media-right ${styles.nogrow}`}>
              <span className="subtitle is-6 has-text-grey">{block.version}</span>
            </div>
          </div>
        </div>
      </header>
      <div
        className={`card-content ${styles.description}`}
        lang={block.description ? defaultLocale : null}
      >
        {block.description ?? <span className="has-text-grey-light">{messages.noDescription}</span>}
      </div>
      <footer className="card-footer">
        <Link className="card-footer-item" to={`${baseUrl || url}/${block.name}`}>
          {messages.buttonDetails}
        </Link>
      </footer>
    </div>
  );
}
