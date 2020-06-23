import { Content, Loader, Message, Title, useData } from '@appsemble/react-components';
import type { App, BasicPageDefinition, BlockDefinition, BlockManifest } from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import React from 'react';
import { FormattedMessage } from 'react-intl';

// import type { NamedEvent } from '../../../../types';
import JSONSchemaEditor from '../../../JSONSchemaEditor';
import type { EditLocation } from '../../types';
import styles from './index.css';
import messages from './messages';

interface GUIEditorEditBlockProps {
  selectedBlock?: BlockManifest;
  app: App;
  editLocation: EditLocation;
  setSelectedBlock: (value: BlockManifest) => void;
  setBlockValue: (value: BlockDefinition) => void;
  blockValue: BlockDefinition;
}

export default function GUIEditorEditBlock({
  app,
  blockValue,
  editLocation,
  selectedBlock,
  setBlockValue,
  setSelectedBlock,
}: GUIEditorEditBlockProps): React.ReactElement {
  const onChange = React.useCallback(
    (_event: any, value: any) => {
      setBlockValue({ ...blockValue, parameters: { ...value } });
    },
    [blockValue, setBlockValue],
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
        setBlockValue(block);
      });
    });
  }, [setBlockValue, editLocation, app]);

  React.useEffect(() => {
    if (!loading && !selectedBlock) {
      setSelectedBlock(edittingBlock);
      initBlockParameters();
    }
  }, [loading, initBlockParameters, setSelectedBlock, edittingBlock, selectedBlock]);

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
    <div className={styles.root}>
      <Title level={2}>{stripBlockName(selectedBlock.name)}</Title>
      <div className={styles.main}>
        {selectedBlock?.parameters ? (
          <JSONSchemaEditor
            name={stripBlockName(selectedBlock.name)}
            onChange={onChange}
            schema={selectedBlock?.parameters}
            value={blockValue?.parameters}
          />
        ) : (
          <div>
            <FormattedMessage
              {...messages.noParameters}
              values={{ name: stripBlockName(selectedBlock.name) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
