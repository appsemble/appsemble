import { Loader, Message, Title, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockStoreElement } from './BlockStoreElement/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The Block Store houses all available blocks as a grid.
 * Each block is shown as a container with its name in it.
 * Each block has a on hover and on mouse down class.
 *
 * On mouse down a copy of the block is attached to the mouse and follows it until mouse up.
 * If mouse up happens outside of the app preview the block is discarded.
 * If mouse up happens over the app preview the held block is appended to the app definition
 * at the end of the blocks list.
 *
 * @returns A grid of available blocks that can be dragged and dropped into the app preview.
 */

interface BlockStoreProps {
  dragEventListener: (data: BlockManifest) => void;
}

export function BlockStore({ dragEventListener }: BlockStoreProps): ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  const appsembleBlocks = blocks
    .filter((b) => b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.blockStore}>
      <div className={styles.blockStoreHeader}>
        <header className="px-2 py-2 is-flex">
          <div className={styles.title}>
            <Title
              className={`${styles.ellipsis} ${styles.title}`}
              lang={defaultLocale}
              level={5}
              size={4}
            >
              Block Store
            </Title>
          </div>
        </header>
      </div>
      {appsembleBlocks.map((block) => (
        <BlockStoreElement block={block} dragEventListener={dragEventListener} key={block.name} />
      ))}
    </div>
  );
}

export default BlockStore;
