import { Button, Icon, Subtitle, Title } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { defaultLocale, parseBlockName } from '@appsemble/utils';
import { type ReactElement } from 'react';

import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The draggable block shown as a thumbnail with the block name, icon and version.
 * On mouse down the handleDragStart method is called. In it the block is
 * attached to the mouse and the manifest is transferred to the pages tab until mouse up.
 *
 * @returns BlockStoreElement
 */
interface BlockStoreElementProps {
  readonly block: BlockManifest;
  readonly dragEventListener: (data: BlockManifest) => void;
}
export function BlockStoreElement({
  block,
  dragEventListener,
}: BlockStoreElementProps): ReactElement {
  const [org, name] = parseBlockName(block.name);

  // Transfer the block manifest to the pages tab and activate dropzone
  const handleDragStart = (): void => {
    dragEventListener(block);
  };

  return (
    <Button
      className={`card is-flex ${styles.root}`}
      draggable
      key={name}
      onDragStart={handleDragStart}
      title={name}
    >
      <header className="px-2 py-2 is-flex">
        <figure className={`image is-64x64 ${styles.nogrow}`}>
          {block.iconUrl ? (
            <img alt={`${name} ${messages.blockLogo}`} draggable={false} src={block.iconUrl} />
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
    </Button>
  );
}
