import { Loader, Message, useData } from '@appsemble/react-components';
import { BlockManifest } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { BlockCard } from '../../../components/BlockCard';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * Display a list of cards representing the available blocks.
 */
export function IndexPage(): ReactElement {
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
    <div className={styles.blockList}>
      {appsembleBlocks.map((block) => (
        <BlockCard block={block} key={block.name} />
      ))}
      {thirdPartyBlocks.map((block) => (
        <BlockCard block={block} key={block.name} />
      ))}
    </div>
  );
}
