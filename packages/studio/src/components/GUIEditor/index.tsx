import React from 'react';

import { GuiEditorStep } from '../Editor';
import GUIEditorEditBlock from '../GUIEditorEditBlock';
import GUIEditorToolbox from '../GUIEditorToolbox';
import { Block } from '../GUIEditorToolboxBlock';

export default function GUIEditor(params: any): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<Block>();
  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>(params.editorStep);

  switch (editorStep) {
    case GuiEditorStep.ADD:
      return (
        <GUIEditorToolbox
          setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
          setSelectedBlock={(block: Block) => setSelectedBlock(block)}
        />
      );
    case GuiEditorStep.EDIT:
      return <GUIEditorEditBlock selectedBlock={selectedBlock} />;
    default:
      return <div>error</div>;
  }
}
