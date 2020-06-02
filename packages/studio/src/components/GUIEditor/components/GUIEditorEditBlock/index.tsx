import { Loader, Title } from '@appsemble/react-components';
import type { App, BasicPageDefinition, BlockDefinition, BlockManifest } from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import indentString from 'indent-string';
import yaml, { safeLoad } from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import JSONSchemaEditor from '../../../JSONSchemaEditor';
import type { EditLocation } from '../../types';
import { GuiEditorStep } from '../../types';
import Stepper from '../Stepper';
import styles from './index.css';
import messages from './messages';

interface GUIEditorEditBlockProps {
  selectedBlock: BlockManifest;
  setEditorStep: (value: GuiEditorStep) => void;
  app: App;
  editLocation: EditLocation;
  setSelectedBlock: (value: BlockManifest) => void;
  monacoEditor: editor.IStandaloneCodeEditor;
  setApp: (app: App) => void;
  setRecipe: (value: string) => void;
}

export default function GUIEditorEditBlock({
  app,
  editLocation,
  monacoEditor,
  selectedBlock,
  setApp,
  setEditorStep,
  setRecipe,
  setSelectedBlock,
}: GUIEditorEditBlockProps): React.ReactElement {
  const [editingResource, setEditingResource] = React.useState<BlockDefinition>(undefined);
  const [editExistingBlock, setEditExistingBlock] = React.useState(false);

  const onChange = React.useCallback(
    (_event: any, value: any) => {
      setEditingResource({ ...editingResource, parameters: { ...value } });
    },
    [editingResource],
  );

  const save = (editedParams: BlockDefinition): void => {
    const blockParent = editLocation.parents
      .slice()
      .reverse()
      .find((x) => x.name === 'blocks:');

    const range = editExistingBlock
      ? editLocation.editRange
      : new Range(blockParent.line + 1, 1, blockParent.line + 1, 1);

    const text = indentString(
      yaml.safeDump(
        [
          {
            type: stripBlockName(selectedBlock.name),
            version: selectedBlock.version,
            parameters: editedParams.parameters,
            actions: editedParams.actions,
            events: editedParams.events,
          },
        ],
        { skipInvalid: true },
      ),
      blockParent.indent + 1,
    );

    monacoEditor.updateOptions({ readOnly: false });
    monacoEditor.executeEdits('GUIEditor-saveBlock', [
      {
        range,
        text,
        forceMoveMarkers: true,
      },
    ]);
    monacoEditor.updateOptions({ readOnly: true });
    const recipe = monacoEditor.getValue();
    setRecipe(recipe);
    setEditorStep(GuiEditorStep.SELECT);
    const definition = safeLoad(monacoEditor.getValue());
    setApp({ ...app, yaml: recipe, definition });
  };

  React.useEffect(() => {
    const getBlockParams = (): void => {
      app.definition.pages.forEach((page: BasicPageDefinition) => {
        if (!page.name.includes(editLocation.pageName)) {
          return;
        }
        page.blocks.forEach((block: BlockDefinition) => {
          if (!block.type.includes(editLocation.blockName) || editingResource) {
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

          setEditingResource(blockValues);
        });
      });
    };

    if (editExistingBlock === true) {
      getBlockParams();
    }
  }, [editExistingBlock, editingResource, editLocation.pageName, editLocation.blockName, app]);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      const normalizedBlockName = normalizeBlockName(editLocation.blockName);
      const { data } = await axios.get(`/api/blocks/${normalizedBlockName}`);
      setSelectedBlock(data);
      setEditExistingBlock(true);
    };
    if (selectedBlock === undefined) {
      getBlocks();
    }
  }, [setEditExistingBlock, editLocation, selectedBlock, setSelectedBlock]);

  if (selectedBlock === undefined) {
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
            schema={selectedBlock?.parameters as OpenAPIV3.SchemaObject}
            value={editingResource?.parameters}
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
      <Stepper
        leftOnClick={
          editExistingBlock
            ? () => {
                setEditorStep(GuiEditorStep.SELECT);
                setSelectedBlock(undefined);
              }
            : () => {
                setEditorStep(GuiEditorStep.ADD);
                setSelectedBlock(undefined);
              }
        }
        rightDisabled={!selectedBlock}
        rightMessage={<FormattedMessage {...messages.save} />}
        rightOnClick={() => {
          save(editingResource);
          setSelectedBlock(undefined);
        }}
      />
    </div>
  );
}
