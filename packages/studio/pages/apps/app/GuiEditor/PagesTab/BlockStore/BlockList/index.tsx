import { parseBlockName } from '@appsemble/lang-sdk';
import { Loader, useData } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { BlockStoreElement } from '../BlockStoreElement/index.js';

interface BlockListProps {
  /**
   * The drag and drop event listener
   *
   * @param data The block that is being dragged
   */
  readonly dragEventListener: (data: BlockManifest) => void;

  /**
   * The filter for the app’s name and organization ID.
   */
  readonly filter?: string;
}

/**
 * Fetch and display a list of apps.
 */
export function BlockList({ dragEventListener, filter }: BlockListProps): ReactNode {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  if (error) {
    return <FormattedMessage {...messages.error} />;
  }

  if (loading) {
    return <Loader />;
  }

  const appsembleBlocks: BlockManifest[] = blocks
    .filter((b) => b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));
  const thirdPartyBlocks: BlockManifest[] = blocks
    .filter((b) => !b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allBlocks = appsembleBlocks.concat(thirdPartyBlocks);

  const filteredBlocks = filter
    ? allBlocks.filter(
        (block: BlockManifest) =>
          parseBlockName(block.name)[1].toLowerCase().includes(filter.toLowerCase()) ||
          parseBlockName(block.name)[0]
            .toLowerCase()
            .includes(filter.toLowerCase().replaceAll('@', '')),
      )
    : allBlocks;

  if (!filteredBlocks.length) {
    return (
      <div className={styles.formatedMessage}>
        <FormattedMessage {...messages.noBlocks} />
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {filteredBlocks.map((block) => (
        <BlockStoreElement block={block} dragEventListener={dragEventListener} key={block.name} />
      ))}
    </div>
  );
}
