import { Button, Icon, Subtitle, Title } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { defaultLocale, parseBlockName } from '@appsemble/utils';
import { DragEvent, ReactElement } from 'react';

import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The draggable block shown as a box with the block name in it.
 * On mouse down the handleDragStart method is called and the block is
 * attached to the mouse until mouseW up.
 *
 * @returns BlockStoreElement
 */
interface BlockStoreElementProps {
  block: BlockManifest;
}
export function BlockStoreElement({ block }: BlockStoreElementProps): ReactElement {
  const [org, name] = parseBlockName(block.name);
  const blockSchema = block.parameters.$schema;

  // Attach the DragElement to the mouse
  const handleDragStart = (e: DragEvent): void => {
    e.dataTransfer.setData('block', JSON.stringify(blockSchema));
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
