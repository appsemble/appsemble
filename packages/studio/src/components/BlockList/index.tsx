import { Loader, Message, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { HelmetIntl } from '../HelmetIntl';
import { BlockCard } from './BlockCard';
import styles from './index.css';
import { messages } from './messages';

/**
 * Display a list of cards representing the available blocks.
 */
export function BlockList(): ReactElement {
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
  const thirdPartyBlocks = blocks
    .filter((b) => !b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <HelmetIntl title={messages.title} />
      <div className={`${styles.blockList} px-2 py-2`}>
        {appsembleBlocks.map((block) => (
          <BlockCard block={block} className="mx-2 my-2" key={block.name} />
        ))}
        {thirdPartyBlocks.map((block) => (
          <BlockCard block={block} className="mx-2 my-2" key={block.name} />
        ))}
      </div>
    </>
  );
}
