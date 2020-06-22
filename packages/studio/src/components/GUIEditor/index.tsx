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
  setEditor?: (value: editor.IStandaloneCodeEditor) => void;
  setEditorStep: (step: GuiEditorStep) => void;
  value?: string;
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

  const save = (editExistingBlock: boolean): void => {
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

    setEditorStep(GuiEditorStep.SELECT);
  };

  switch (editorStep) {
    case GuiEditorStep.SELECT:
    default:
      return (
        <>
          <GUIEditorNavBar
            app={app}
            editLocation={editLocation}
            editorStep={editorStep}
            monacoEditor={monacoEditor}
            setEditorStep={setEditorStep}
          />
          <GUIEditorSelect monacoEditor={monacoEditor} setEditLocation={setEditLocation} />
        </>
      );

    case GuiEditorStep.ADD:
      return (
        <Stepper onCancel={() => setEditorStep(GuiEditorStep.SELECT)} onFinish={() => save(false)}>
          <GUIEditorToolbox selectedBlock={selectedBlock} setSelectedBlock={setSelectedBlock} />
          <GUIEditorEditBlock
            app={app}
            blockValue={editedBlockValues}
            editLocation={editLocation}
            selectedBlock={selectedBlock}
            setBlockValue={setEditedBlockValues}
            setSelectedBlock={setSelectedBlock}
          />
        </Stepper>
      );

    case GuiEditorStep.EDIT:
      return (
        <Stepper onCancel={() => setEditorStep(GuiEditorStep.SELECT)} onFinish={() => save(true)}>
          <GUIEditorEditBlock
            app={app}
            blockValue={editedBlockValues}
            editLocation={editLocation}
            selectedBlock={selectedBlock}
            setBlockValue={setEditedBlockValues}
            setSelectedBlock={setSelectedBlock}
          />
        </Stepper>
      );
  }
}
