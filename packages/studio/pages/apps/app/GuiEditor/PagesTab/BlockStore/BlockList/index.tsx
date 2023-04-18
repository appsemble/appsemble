import { Loader, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { parseBlockName } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockStoreElement } from '../BlockStoreElement/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface BlockListProps {
  /**
   * The drag and drop event listener
   *
   * @param data The block that is being dragged
   */
  dragEventListener: (data: BlockManifest) => void;

  /**
   * The filter for the app’s name and organization ID.
   */
  filter?: string;
}

/**
 * Fetch and display a list of apps.
 */
export function BlockList({ dragEventListener, filter }: BlockListProps): ReactElement {
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

  const filteredBlocks = filter
    ? appsembleBlocks.filter(
        (block: BlockManifest) =>
          parseBlockName(block.name)[1].toLowerCase().includes(filter.toLowerCase()) ||
          parseBlockName(block.name)[0]
            .toLowerCase()
            .includes(filter.toLowerCase().replace(/@/g, '')),
      )
    : appsembleBlocks;

  if (!filteredBlocks.length) {
    return (
      <div className={styles.formatedMessage}>
        <FormattedMessage {...messages.noBlocks} />
      </div>
    );
  }
  return (
    <div>
      {filteredBlocks.map((block) => (
        <BlockStoreElement block={block} dragEventListener={dragEventListener} key={block.name} />
      ))}
    </div>
  );
}
