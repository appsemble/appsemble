import { Loader, Message, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockStoreBlock } from './BlockStoreBlock/index.js';
import { messages } from './messages.js';

/**
 * The Block Store houses all available blocks as a grid.
 * Each block is shown as a container with its name in it.
 * Each block has a on hover and on mouse down class.
 *
 * On mouse down a copy of the block is attached to the mouse and folows it until mouse up.
 * If mouse up happens outside of the app preview the block is discarded.
 * If mouse up happens over the app preview the held block is appended to the app definition
 * at the end of the blocks list.
 *
 * @returns A grid of available blocks that can be dragged and dropped into the app preview.
 */

export function BlockStore(): ReactElement {
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
    <div className="BlockStore">
      {appsembleBlocks.map((block) => (
        <BlockStoreBlock block={block} key={block.name} />
      ))}
    </div>
  );
}

export default BlockStore;
