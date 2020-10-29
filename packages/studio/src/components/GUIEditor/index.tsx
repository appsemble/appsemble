import { Stepper } from '@appsemble/react-components';
import { App, BlockDefinition, BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import indentString from 'indent-string';
import yaml from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import React, { ReactElement, useCallback, useState } from 'react';

import { GUIEditorEditBlock } from './GUIEditorEditBlock';
import { GUIEditorNavBar } from './GUIEditorNavBar';
import { GUIEditorSelect } from './GUIEditorSelect';
import { GUIEditorToolbox } from './GUIEditorToolbox';
import { EditLocation, GuiEditorStep } from './types';
import { applyMonacoEdits } from './utils/applyMonacoEdits';

interface GUIEditorProps {
  app: App;
  editorStep: GuiEditorStep;
  onChangeEditorStep: (step: GuiEditorStep) => void;
  monacoEditor: editor.IStandaloneCodeEditor;

  /**
   * Save decorations even when editor is disposed
   */
  decorationList: string[];
  onChangeDecorationList: (value: string[]) => void;
}
export function GUIEditor({
  app,
  decorationList,
  editorStep,
  monacoEditor,
  onChangeDecorationList,
  onChangeEditorStep,
}: GUIEditorProps): ReactElement {
  const [selectedBlock, setSelectedBlock] = useState<BlockManifest>();
  const [editLocation, setEditLocation] = useState<EditLocation>();
  const [editedBlockValues, setEditedBlockValues] = useState<BlockDefinition>();

  const onCancel = useCallback((): void => {
    onChangeEditorStep(GuiEditorStep.SELECT);
    setSelectedBlock(null);
    setEditedBlockValues(null);
  }, [onChangeEditorStep]);

  const save = useCallback(
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
            onChangeEditorStep={onChangeEditorStep}
          />
          <GUIEditorSelect
            decorationList={decorationList}
            monacoEditor={monacoEditor}
            onChangeDecorationList={onChangeDecorationList}
            onChangeEditLocation={setEditLocation}
          />
        </>
      );
  }
}
