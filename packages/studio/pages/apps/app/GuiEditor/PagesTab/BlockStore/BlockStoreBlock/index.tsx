import { Icon, Subtitle, Title } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { defaultLocale, parseBlockName } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The block store block (BSB) is the draggable block shown as a box with the block name in it.
 * On mouse down a copy of the BSB is attached to the mouse and folows it until mouse up.
 * If mouse up happens outside of the app preview the BSB is discarded.
 * If mouse up happens over the app preview the block corresponding to the held BSB is
 * appended to the app definition at the end of the blocks list.
 *
 * @returns BSB
 */

interface BlockStoreBlockProps {
  /**
   * The block to display.
   */
  block: BlockManifest;
}
export function BlockStoreBlock({ block }: BlockStoreBlockProps): ReactElement {
  const [org, name] = parseBlockName(block.name);
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className={`card is-flex ${styles.root}`} key={block.name} title={block.name}>
      <header className="px-2 py-2 is-flex">
        <figure className={`image is-64x64 ${styles.nogrow}`}>
          {block.iconUrl ? (
            <img alt={`${block.name} ${messages.blockLogo}`} src={block.iconUrl} />
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
    </div>
  );
}

export default BlockStoreBlock;
