import { Content, Loader, Message, Title, useData } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import React, { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { GUIEditorToolboxBlock } from '../GUIEditorToolboxBlock';
import styles from './index.css';
import { messages } from './messages';

interface GUIEditorToolboxProps {
  setSelectedBlock: (block: BlockManifest) => void;
  selectedBlock: BlockManifest;
}

export function GUIEditorToolbox({
  selectedBlock,
  setSelectedBlock,
}: GUIEditorToolboxProps): ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onChange = useCallback(
    (_event: ChangeEvent, block: BlockManifest): void => {
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
    <div className={`mx-2 is-flex ${styles.root}`}>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <GUIEditorToolboxBlock
        blocks={blocks}
        name={selectedBlock?.name}
        onChange={onChange}
        value={selectedBlock}
      />
      {selectedBlock && (
        <div className="container is-fluid notification mb-2">
          <article className="media">
            <div className="media-content">
              <Title level={4}>{stripBlockName(selectedBlock.name)}</Title>
              {selectedBlock.description}
            </div>
            <div className="media-right">
              <Link rel="noopener noreferrer" target="_blank" to={`/blocks/${selectedBlock.name}`}>
                <FormattedMessage {...messages.moreInfo} />
              </Link>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
