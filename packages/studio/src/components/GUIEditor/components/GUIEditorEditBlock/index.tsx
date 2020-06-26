import { Content, Loader, Message, Tabs, Title, useData } from '@appsemble/react-components';
import type {
  ActionDefinition,
  App,
  BasicPageDefinition,
  BlockDefinition,
  BlockManifest,
} from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { JsonObject } from 'type-fest';

import type { NamedEvent } from '../../../../types';
import JSONSchemaEditor from '../../../JSONSchemaEditor';
import type { EditLocation } from '../../types';
import ActionEditor from '../ActionEditor';
import styles from './index.css';
import messages from './messages';

interface GUIEditorEditBlockProps {
  selectedBlock?: BlockManifest;
  app: App;
  editLocation: EditLocation;
  onChangeSelectedBlock: (value: BlockManifest) => void;
  onChangeBlockValue: (value: BlockDefinition) => void;
  blockValue: BlockDefinition;
}

export default function GUIEditorEditBlock({
  app,
  blockValue,
  editLocation,
  onChangeBlockValue,
  onChangeSelectedBlock,
  selectedBlock,
}: GUIEditorEditBlockProps): React.ReactElement {
  const intl = useIntl();
  const onChangeParameter = React.useCallback(
    (_event: NamedEvent, parameters: JsonObject) => {
      onChangeBlockValue({ ...blockValue, parameters });
    },
    [blockValue, onChangeBlockValue],
  );

  const onChangeAction = React.useCallback(
    (_event: NamedEvent, actions: { [action: string]: ActionDefinition }) => {
      onChangeBlockValue({ ...blockValue, actions });
    },
    [blockValue, onChangeBlockValue],
  );

  const { data: edittingBlock, error, loading } = useData<BlockManifest>(
    `/api/blocks/${normalizeBlockName(editLocation.blockName)}`,
  );

  const initBlockParameters = React.useCallback(() => {
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

  React.useEffect(() => {
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
      <Tabs
        tabs={[
          {
            disabled: selectedBlock.parameters === null,
            name: intl.formatMessage(messages.parameters),
            content: (
              <JSONSchemaEditor
                name={stripBlockName(selectedBlock.name)}
                onChange={onChangeParameter}
                schema={selectedBlock?.parameters}
                value={blockValue?.parameters}
              />
            ),
          },
          {
            disabled: selectedBlock.actions === null,
            name: intl.formatMessage(messages.actions),
            content: (
              <ActionEditor
                actions={selectedBlock?.actions}
                app={app}
                onChange={onChangeAction}
                value={blockValue?.actions}
              />
            ),
          },
          {
            disabled: selectedBlock.events === null,
            name: intl.formatMessage(messages.events),
            content: <>Coming soon</>,
          },
        ]}
      />
    </div>
  );
}
