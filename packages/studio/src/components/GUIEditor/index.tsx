import { stripBlockName } from '@appsemble/utils';
import yaml from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import React from 'react';

import { GuiEditorStep } from '../Editor';
import GUIEditorEditBlock from '../GUIEditorEditBlock';
import GUIEditorToolbox from '../GUIEditorToolbox';
import { Block } from '../GUIEditorToolboxBlock';
import { SelectedBlockParent, SelectedItem } from '../MonacoEditor';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const indentString = require('indent-string');

interface GUIEditorProps {
  appRecipe: string;
  editorStep: GuiEditorStep;
  monacoEditor: editor.IStandaloneCodeEditor;
  save: () => void;
  selectedBlockParent: SelectedBlockParent;
  selectedItem: SelectedItem;
  setRecipe: (value: string) => void;
}

export default function GUIEditor({
  monacoEditor,
  save,
  selectedBlockParent,
  setRecipe,
}: GUIEditorProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<Block>();
  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>();

  const saveBlock = (edittedParams: object[]): void => {
    const blockParent = Object.values(selectedBlockParent)[0];

    const parentIndent = blockParent.indent - 1;
    const { line } = blockParent;
    const range = new Range(line + 1, 1, line + 1, 1);
    const id = { major: 1, minor: 1 };

    let edittedParameters = '';

    Object.keys(edittedParams).map((item: any) => {
      edittedParameters += `${item}: ${edittedParams[item]}\n`;
      return edittedParameters;
    });

    const text = indentString(
      yaml
        .safeDump([
          {
            type: stripBlockName(selectedBlock.name),
            version: '0.11.6',
            parameters: edittedParameters,
          },
        ])
        .replace('|', ''),
      parentIndent + 2,
    );

    const op = {
      identifier: id,
      range,
      text,
      forceMoveMarkers: true,
    };

    monacoEditor.executeEdits('GUIEditor-saveBlock', [op]);
    setRecipe(monacoEditor.getValue());
    save();
    setEditorStep(GuiEditorStep.ADD);
  };

  switch (editorStep) {
    case GuiEditorStep.ADD:
    default:
      return (
        <GUIEditorToolbox
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
          setSelectedBlock={(block: Block) => setSelectedBlock(block)}
        />
      );
    case GuiEditorStep.EDIT:
      return (
        <GUIEditorEditBlock
          save={(edittedParams: any[any]) => saveBlock(edittedParams)}
          selectedBlock={selectedBlock}
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
        />
      );
  }
}
