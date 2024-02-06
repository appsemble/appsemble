import { InputField, Loader, Message, useData } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { BlockCard } from '../../../components/BlockCard/index.js';

/**
 * Display a list of cards representing the available blocks.
 */
export function IndexPage(): ReactNode {
  const [filter, setFilter] = useState('');
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

  const filteredAppsembleBlocks = filter
    ? appsembleBlocks.filter((block) => block.name.toLowerCase().includes(filter))
    : appsembleBlocks;
  const filteredThirdPartyBlocks = filter
    ? thirdPartyBlocks.filter((block) => block.name.toLowerCase().includes(filter))
    : thirdPartyBlocks;

  return (
    <div>
      <div className="columns is-centered">
        <div className="column is-half">
          <InputField
            className="is-half is-centered"
            icon="search"
            name="search"
            onChange={({ currentTarget: { value } }) => setFilter(value)}
            type="search"
            value={filter}
          />
        </div>
      </div>
      <div className={styles.blockList}>
        {filteredAppsembleBlocks.map((block) => (
          <BlockCard block={block} key={block.name} />
        ))}
        {filteredThirdPartyBlocks.map((block) => (
          <BlockCard block={block} key={block.name} />
        ))}
      </div>
    </div>
  );
}
