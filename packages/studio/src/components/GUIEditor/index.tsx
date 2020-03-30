import { Range } from 'monaco-editor';
import React from 'react';

import { GuiEditorStep } from '../Editor';
import GUIEditorEditBlock from '../GUIEditorEditBlock';
import GUIEditorToolbox from '../GUIEditorToolbox';
import { Block } from '../GUIEditorToolboxBlock';

export default function GUIEditor(params: any): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<Block>();
  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>(params.editorStep);

  function tab(tabsize: number): string {
    const indent = ' ';
    return indent.repeat(tabsize);
  }

  const saveBlock = (edittedParams: any[any]): void => {
    const { blockParent } = params.selectedBlockParent;

    const parentIndent = blockParent.indent - 1;
    const { line } = blockParent;
    const range = new Range(line + 1, 1, line + 1, 1);
    const id = { major: 1, minor: 1 };

    const typeText = `${tab(parentIndent + 2)}- type: ${selectedBlock.id.split('/')[1]}\n`;
    // TODO: dynamic versioning
    const versionText = `${tab(parentIndent + 4)}version: 0.11.6\n${tab(
      parentIndent + 4,
    )}parameters:\n`;
    let parametersText = '';

    Object.keys(edittedParams).map((item: any) => {
      parametersText += `${tab(parentIndent + 6)}${item}: ${edittedParams[item]}\n`;
      return parametersText;
    });
    const text = typeText + versionText + parametersText;
    const op = {
      identifier: id,
      range,
      text,
      forceMoveMarkers: true,
    };

    params.editor.executeEdits('GUIEditor-saveBlock', [op]);
    params.setRecipe(params.editor.getValue());
    params.save();
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
