import { Icon, Subtitle, Title } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { defaultLocale, parseBlockName } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';

interface BlockCardProps {
  /**
   * The block to display.
   */
  block: BlockManifest;
}

/**
 * Display a card that contains basic information of a block and a link to further documentation.
 */
export function BlockCard({ block }: BlockCardProps): ReactElement {
  const [org, name] = parseBlockName(block.name);
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className={`card is-flex ${styles.root}`} key={block.name} title={block.name}>
      <header className="px-2 py-2 is-flex">
        <figure className={`image is-64x64 ${styles.nogrow}`}>
          {block.iconUrl ? (
            <img alt={`${block.name} Logo`} src={block.iconUrl} />
          ) : (
            <Icon className={styles.iconFallback} icon="cubes" />
          )}
        </figure>
        <div className={`pl-3 pr-1 ${styles.header} ${styles.ellipsis}`}>
          <Title
            className={`${styles.ellipsis} ${styles.title}`}
            lang={defaultLocale}
            level={5}
            size={4}
          >
            {name}
          </Title>
          <Subtitle className={styles.ellipsis} lang={defaultLocale} level={6}>
            <Link to={`/${lang}/organizations/${org}`}>{`@${org}`}</Link>
          </Subtitle>
        </div>
        <span className={`subtitle is-6 has-text-grey ${styles.nogrow}`}>{block.version}</span>
      </header>
      <div
        className={`card-content ${styles.description}`}
        lang={block.description ? defaultLocale : null}
      >
        {block.description ?? (
          <span className="has-text-grey-light">(No description available)</span>
        )}
      </div>
      <footer className="card-footer">
        <Link className="card-footer-item" to={`/${lang}/blocks/${block.name}/${block.version}`}>
          View details
        </Link>
      </footer>
    </div>
  );
}
