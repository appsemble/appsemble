import { Loader, Title } from '@appsemble/react-components';
import type { App, BasicPageDefinition, BlockDefinition, BlockManifest } from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import JSONSchemaEditor from '../../../JSONSchemaEditor';
import type { EditLocation } from '../../types';
import styles from './index.css';
import messages from './messages';

interface GUIEditorEditBlockProps {
  selectedBlock: BlockManifest;
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

  const initBlockParameters = React.useCallback(() => {
    if (selectedBlock) {
      return;
    }
    app.definition.pages.forEach((page: BasicPageDefinition) => {
      if (!page.name.includes(editLocation.pageName)) {
        return;
      }
      page.blocks.forEach((block: BlockDefinition) => {
        if (!block.type.includes(editLocation.blockName) || blockValue) {
          return;
        }
        let blockValues: BlockDefinition;

        if (block.events) {
          blockValues = { ...blockValues, events: block.events };
        }
        if (block.actions) {
          blockValues = { ...blockValues, actions: block.actions };
        }
        if (block.parameters) {
          blockValues = { ...blockValues, parameters: block.parameters };
        }

        setBlockValue(blockValues);
      });
    });
  }, [selectedBlock, setBlockValue, blockValue, editLocation, app]);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      const normalizedBlockName = normalizeBlockName(editLocation.blockName);
      const { data } = await axios.get(`/api/blocks/${normalizedBlockName}`);
      setSelectedBlock(data);
    };
    if (selectedBlock === undefined) {
      getBlocks();
    }
  }, [editLocation, selectedBlock, setSelectedBlock]);

  if (selectedBlock === undefined) {
    initBlockParameters();
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
