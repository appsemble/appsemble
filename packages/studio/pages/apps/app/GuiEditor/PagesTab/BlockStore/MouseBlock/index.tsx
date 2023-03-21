import { Icon, Subtitle, Title } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { defaultLocale, parseBlockName } from '@appsemble/utils';
import { ReactElement } from 'react';

import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The dragged block shown as a box with the block name in it.
 * It exists as long as the left mousebutton is held down and follows the mouse it until mouse up.
 * If mouse up happens outside of the app preview the MouseBlock is discarded.
 * If mouse up happens over the app preview the block corresponding to the held BSB is
 * appended to the app definition at the end of the blocks list.
 *
 * @returns MouseBlock
 */

interface MouseBlockProps {
  block: BlockManifest;
}

export function MouseBlock({ block }: MouseBlockProps): ReactElement {
  const [org, name] = parseBlockName(block.name);

  return (
    <div
      className={`card is-flex ${styles.root} ${styles.BlockStoreBlock}`}
      key={name}
      title={name}
    >
      <header className="px-2 py-2 is-flex">
        <figure className={`image is-64x64 ${styles.nogrow}`}>
          {block.iconUrl ? (
            <img alt={`${name} ${messages.blockLogo}`} src={block.iconUrl} />
          ) : (
            <Icon className={styles.iconFallback} icon="cubes" />
          )}
        </figure>
        <div className={`pl-3 pr-1 ${styles.header} ${styles.ellipsis}`}>
          <Title
            className={`${styles.ellipsis} ${styles.title}`}
            lang={defaultLocale}
            level={6}
            size={6}
          >
            {name}
          </Title>
          <Subtitle className={styles.ellipsis} lang={defaultLocale} level={6} size={6}>
            <div className={styles.linkColor}>{`@${org}`}</div>
          </Subtitle>
        </div>
        <span className={`${styles.versionNr} has-text-grey ${styles.nogrow}`}>
          {block.version}
        </span>
      </header>
    </div>
  );
}
