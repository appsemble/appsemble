import { Stepper } from '@appsemble/react-components';
import type { App, BlockDefinition, BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import indentString from 'indent-string';
import yaml from 'js-yaml';
import type { editor } from 'monaco-editor';
import { Range } from 'monaco-editor';
import React from 'react';

import GUIEditorEditBlock from './components/GUIEditorEditBlock';
import GUIEditorNavBar from './components/GUIEditorNavBar';
import GUIEditorSelect from './components/GUIEditorSelect';
import GUIEditorToolbox from './components/GUIEditorToolbox';
import { EditLocation, GuiEditorStep } from './types';
import applyMonacoEdits from './utils/applyMonacoEdits';

interface GUIEditorProps {
  app: App;
  editorStep: GuiEditorStep;
  setEditorStep: (step: GuiEditorStep) => void;
  monacoEditor: editor.IStandaloneCodeEditor;
}

export default function GUIEditor({
  app,
  editorStep,
  monacoEditor,
  setEditorStep,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<BlockManifest>(undefined);
  const [editLocation, setEditLocation] = React.useState<EditLocation>(undefined);
  const [editedBlockValues, setEditedBlockValues] = React.useState<BlockDefinition>(undefined);
  const [decorationList, setDecorationList] = React.useState<string[]>([]);

  const onCancel = React.useCallback((): void => {
    setEditorStep(GuiEditorStep.SELECT);
    setSelectedBlock(null);
    setEditedBlockValues(undefined);
  }, [setEditorStep]);

  const save = React.useCallback(
    (editExistingBlock: boolean): void => {
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
              parameters: editedBlockValues.parameters,
              actions: editedBlockValues.actions,
              events: editedBlockValues.events,
            },
          ],
          { skipInvalid: true },
        ),
        blockParent.indent + 1,
      );
      const edits: editor.IIdentifiedSingleEditOperation[] = [
        {
          range,
          text,
          forceMoveMarkers: true,
        },
      ];
      applyMonacoEdits(monacoEditor, edits);
      onCancel();
    },
    [editLocation, monacoEditor, selectedBlock, editedBlockValues, onCancel],
  );

  switch (editorStep) {
    case GuiEditorStep.ADD:
      return (
        <Stepper onCancel={onCancel} onFinish={() => save(false)}>
          <GUIEditorToolbox selectedBlock={selectedBlock} setSelectedBlock={setSelectedBlock} />
          <GUIEditorEditBlock
            app={app}
            blockValue={editedBlockValues}
            editLocation={editLocation}
            onChangeBlockValue={setEditedBlockValues}
            onChangeSelectedBlock={setSelectedBlock}
            selectedBlock={selectedBlock}
          />
        </Stepper>
      );

    case GuiEditorStep.EDIT:
      return (
        <Stepper onCancel={onCancel} onFinish={() => save(true)}>
          <GUIEditorEditBlock
            app={app}
            blockValue={editedBlockValues}
            editLocation={editLocation}
            onChangeBlockValue={setEditedBlockValues}
            onChangeSelectedBlock={setSelectedBlock}
            selectedBlock={selectedBlock}
          />
        </Stepper>
      );

    default:
      return (
        <>
          <GUIEditorNavBar
            app={app}
            editLocation={editLocation}
            editorStep={editorStep}
            monacoEditor={monacoEditor}
            onChangeEditorStep={setEditorStep}
          />
          <GUIEditorSelect
            decorationList={decorationList}
            monacoEditor={monacoEditor}
            onChangeDecorationList={setDecorationList}
            onChangeEditLocation={setEditLocation}
          />
        </>
      );
  }
}
