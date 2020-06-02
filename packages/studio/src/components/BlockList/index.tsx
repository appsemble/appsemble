import { Loader, Message } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import BlockCard from './components/BlockCard';
import styles from './index.css';
import messages from './messages';

/**
 * Display a list of cards representing the available blocks.
 */
export default function BlockList(): React.ReactElement {
  const [blocks, setBlocks] = React.useState<BlockManifest[]>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    axios
      .get<BlockManifest[]>('/api/blocks')
      .then((result) => setBlocks(result.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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

  const appsembleBlocks = blocks.filter((b) => b.name.startsWith('@appsemble'));
  const thirdPartyBlocks = blocks.filter((b) => !b.name.startsWith('@appsemble'));

  return (
    <>
      <HelmetIntl title={messages.title} />
      <div className={styles.blockList}>
        {appsembleBlocks.map((block) => (
          <BlockCard key={block.name} block={block} />
        ))}
        {thirdPartyBlocks.map((block) => (
          <BlockCard key={block.name} block={block} />
        ))}
      </div>
    </>
  );
}
