import { Loader, Title } from '@appsemble/react-components';
import type { App, BasicPage, Block } from '@appsemble/types';
import { normalizeBlockName, stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import indentString from 'indent-string';
import yaml, { safeLoad } from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { EditLocation, SelectedBlockManifest } from '../..';
import { GuiEditorStep } from '../..';
import JSONSchemaEditor from '../../../JSONSchemaEditor';
import ActionEditor from '../ActionEditor';
import Stepper from '../Stepper';
import styles from './index.css';
import messages from './messages';

interface Resource {
  parameters: { [key: string]: any };
  actions: { [key: string]: any };
  events: { [key: string]: any };
}

interface GUIEditorEditBlockProps {
  selectedBlock: SelectedBlockManifest;
  setEditorStep: (value: GuiEditorStep) => void;
  app: App;
  editLocation: EditLocation;
  setSelectedBlock: (value: SelectedBlockManifest) => void;
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
  const [editingResource, setEditingResource] = React.useState<Resource>(undefined);
  const [editExistingBlock, setEditExistingBlock] = React.useState(false);

  const onChange = React.useCallback(
    (_event: any, value: any) => {
      setEditingResource({ ...editingResource, parameters: { ...value } });
    },
    [editingResource],
  );

  const onChangeAction = React.useCallback(
    (_event: any, value: any) => {
      setEditingResource({ ...editingResource, actions: { ...value } });
    },
    [editingResource],
  );

  const save = React.useCallback((): void => {
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
            parameters: editingResource.parameters,
            actions: editingResource.actions,
            events: editingResource.events,
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
  }, [
    app,
    editExistingBlock,
    editLocation,
    selectedBlock,
    setRecipe,
    setEditorStep,
    setApp,
    editingResource,
    monacoEditor,
  ]);

  React.useEffect(() => {
    const getBlockParams = (): void => {
      app.definition.pages.forEach((page: BasicPage) => {
        if (!page.name.includes(editLocation.pageName)) {
          return;
        }
        page.blocks.forEach((block: Block) => {
          if (!block.type.includes(editLocation.blockName) || editingResource) {
            return;
          }
          let blockValues: Resource;

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
          <>
            <Title level={3}>
              <FormattedMessage {...messages.parameters} />
            </Title>
            <JSONSchemaEditor
              name={stripBlockName(selectedBlock.name)}
              onChange={onChange}
              schema={selectedBlock?.parameters as OpenAPIV3.SchemaObject}
              value={editingResource?.parameters}
            />
          </>
        ) : (
          <div>
            <FormattedMessage
              {...messages.noParameters}
              values={{ name: stripBlockName(selectedBlock.name) }}
            />
          </div>
        )}
        {selectedBlock?.actions && (
          <>
            <Title className={styles.marginTop} level={3}>
              <FormattedMessage {...messages.actions} />
            </Title>
            <ActionEditor
              actions={selectedBlock?.actions}
              app={app}
              onChange={onChangeAction}
              value={editingResource?.actions}
            />
          </>
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
          save();
          setSelectedBlock(undefined);
        }}
      />
    </div>
  );
}
