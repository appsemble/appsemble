import { defaultLocale, parseBlockName } from '@appsemble/lang-sdk';
import { Button, Icon, Subtitle, Title } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type ReactNode } from 'react';

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
export function BlockStoreElement({ block, dragEventListener }: BlockStoreElementProps): ReactNode {
  const [org, name] = parseBlockName(block.name);

  // Transfer the block manifest to the pages tab and activate dropzone
  const handleDragStart = (): void => {
    dragEventListener(block);
  };

  return (
    <Button
      className={styles.root}
      draggable
      key={name}
      onDoubleClick={() =>
        window.open(`../../../../blocks/${block.name}/${block.version}`, '_blank')
      }
      onDragStart={handleDragStart}
      title={block.description}
    >
      <header className="px-2 py-2 is-flex">
        <div className={`pl-1 pr-1 ${styles.header} ${styles.ellipsis}`}>
          <Title className={styles.ellipsis} lang={defaultLocale} level={6} size={6}>
            {name}
          </Title>
          <figure className={`${styles.centerFigure} image is-64x64`}>
            {block.iconUrl ? (
              <img alt={`${name} ${messages.blockLogo}`} draggable={false} src={block.iconUrl} />
            ) : (
              <Icon className={styles.iconFallback} icon="cubes" />
            )}
          </figure>
          <Subtitle className={styles.ellipsis} lang={defaultLocale} level={6} size={6}>
            <div className={styles.link}>{`@${org}`}</div>
          </Subtitle>
        </div>
      </header>
    </Button>
  );
}
