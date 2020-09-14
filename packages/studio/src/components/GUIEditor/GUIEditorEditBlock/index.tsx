import { Content, Loader, Message, Tab, Tabs, Title, useData } from '@appsemble/react-components';
import type { App, BasicPageDefinition, BlockDefinition, BlockManifest } from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import type { NamedEvent } from '@appsemble/web-utils';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { JSONSchemaEditor } from '../../JSONSchemaEditor';
import { ActionsEditor } from '../ActionsEditor';
import type { EditLocation } from '../types';
import styles from './index.css';
import { messages } from './messages';

interface GUIEditorEditBlockProps {
  selectedBlock?: BlockManifest;
  app: App;
  editLocation: EditLocation;
  onChangeSelectedBlock: (value: BlockManifest) => void;
  onChangeBlockValue: (value: BlockDefinition) => void;
  blockValue: BlockDefinition;
}

export function GUIEditorEditBlock({
  app,
  blockValue,
  editLocation,
  onChangeBlockValue,
  onChangeSelectedBlock,
  selectedBlock,
}: GUIEditorEditBlockProps): ReactElement {
  const [tab, setTab] = useState('parameters');
  const onTabChange = useCallback((_, value: string) => setTab(value), []);

  const onChange = useCallback(
    (event: NamedEvent, value: any) => {
      onChangeBlockValue({ ...blockValue, [event.currentTarget.name]: value });
    },
    [blockValue, onChangeBlockValue],
  );

  const { data: edittingBlock, error, loading } = useData<BlockManifest>(
    `/api/blocks/${normalizeBlockName(editLocation.blockName)}`,
  );

  const initBlockParameters = useCallback(() => {
    app.definition.pages.forEach((page: BasicPageDefinition) => {
      if (!page.name.includes(editLocation.pageName)) {
        return;
      }
      page.blocks.forEach((block: BlockDefinition) => {
        if (!block.type.includes(editLocation.blockName)) {
          return;
        }
        onChangeBlockValue(block);
      });
    });
  }, [onChangeBlockValue, editLocation, app]);

  useEffect(() => {
    if (!loading && !selectedBlock) {
      onChangeSelectedBlock(edittingBlock);
      initBlockParameters();
    }
  }, [loading, initBlockParameters, onChangeSelectedBlock, edittingBlock, selectedBlock]);

  if (error && !selectedBlock) {
    return (
      <Content padding>
        <Message color="danger">
          <FormattedMessage
            {...messages.error}
            values={{ blockName: normalizeBlockName(editLocation.blockName) }}
          />
        </Message>
      </Content>
    );
  }

  if (loading || !selectedBlock) {
    return <Loader />;
  }

  return (
    <div className={`is-flex mx-2 ${styles.root}`}>
      <Title level={2}>{stripBlockName(selectedBlock.name)}</Title>
      <div>
        <Tabs onChange={onTabChange} value={tab}>
          {selectedBlock.parameters && (
            <Tab value="parameters">
              <FormattedMessage {...messages.parameters} />
            </Tab>
          )}
          {selectedBlock.actions && (
            <Tab value="actions">
              <FormattedMessage {...messages.actions} />
            </Tab>
          )}
        </Tabs>
        <Content padding>
          {tab === 'parameters' && (
            <JSONSchemaEditor
              name="parameters"
              onChange={onChange}
              schema={selectedBlock?.parameters}
              value={blockValue?.parameters}
            />
          )}
          {tab === 'actions' && (
            <ActionsEditor
              actions={selectedBlock?.actions}
              app={app}
              name="actions"
              onChange={onChange}
              value={blockValue?.actions}
            />
          )}
        </Content>
      </div>
    </div>
  );
}
