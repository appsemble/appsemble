import { Content, Loader, Message, Title, useData } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
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
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onChange = React.useCallback(
    (_event: React.ChangeEvent, block: BlockManifest): void => {
      setSelectedBlock(block);
    },
    [setSelectedBlock],
  );

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          <FormattedMessage {...messages.error} />
        </Message>
      </Content>
    );
  }

  if (loading) {
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
          name={selectedBlock?.name}
          onChange={onChange}
          value={selectedBlock}
        />
      </div>
      {selectedBlock && (
        <div className={styles.marginBottom}>
          <Title level={4}>{stripBlockName(selectedBlock.name)}</Title>
          {selectedBlock.description}
          <a href={`./blocks/${selectedBlock.name}`} rel="noopener noreferrer" target="_blank">
            <FormattedMessage {...messages.moreInfo} />
          </a>
        </div>
      )}
    </div>
  );
}
