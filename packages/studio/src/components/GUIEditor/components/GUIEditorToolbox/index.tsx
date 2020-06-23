import { Content, Loader, Message, Title, useData } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import classNames from 'classnames';
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
    <div className={styles.root}>
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
        <div className={classNames('container is-fluid notification', styles.marginBottom)}>
          <article className="media">
            <div className="media-content">
              <Title level={4}>{stripBlockName(selectedBlock.name)}</Title>
              {selectedBlock.description}
            </div>
            <div className="media-right">
              <a href={`./blocks/${selectedBlock.name}`} rel="noopener noreferrer" target="_blank">
                <FormattedMessage {...messages.moreInfo} />
              </a>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
