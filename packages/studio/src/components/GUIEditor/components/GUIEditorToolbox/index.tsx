import { Loader, Title } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import GUIEditorToolboxBlock from '../GUIEditorToolboxBlock';
import styles from './index.css';
import messages from './messages';

interface GUIEditorToolboxProps {
  setSelectedBlock: (block: BlockManifest) => void;
  selectedBlock: BlockManifest;
}

export default function GUIEditorToolbox({
  selectedBlock,
  setSelectedBlock,
}: GUIEditorToolboxProps): React.ReactElement {
  const [blocks, setBlocks] = React.useState<BlockManifest[]>(undefined);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      const { data } = await axios.get('/api/blocks');
      setBlocks(data);
    };
    getBlocks();
  }, []);

  if (blocks === undefined) {
    return <Loader />;
  }

  return (
    <div className={styles.flexContainer}>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className={styles.maxHeight}>
        <GUIEditorToolboxBlock
          blocks={blocks}
          selectedBlock={selectedBlock}
          setSelectedBlock={setSelectedBlock}
        />
      </div>
      {selectedBlock && (
        <div className={styles.marginBottom}>
          <Title level={4}>{stripBlockName(selectedBlock.name)}</Title>
          {selectedBlock.description}
          <a
            href={`https://appsemble.dev/blocks/${stripBlockName(selectedBlock.name)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.moreInfo} />
          </a>
        </div>
      )}
    </div>
  );
}
