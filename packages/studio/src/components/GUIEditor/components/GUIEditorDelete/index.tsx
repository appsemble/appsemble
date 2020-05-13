import { CardFooterButton, Modal } from '@appsemble/react-components';
import type { editor } from 'monaco-editor';
import { Range } from 'monaco-editor';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { GuiEditorStep } from '../..';
import type { EditLocation } from '../../../MonacoEditor';
import messages from './messages';

interface GUIEditorDeleteProps {
  setEditorStep: (step: GuiEditorStep) => void;
  setRecipe: (value: string) => void;
  monacoEditor: editor.IStandaloneCodeEditor;
  editLocation: EditLocation;
}

export default function GUIEditorDelete({
  editLocation,
  monacoEditor,
  setEditorStep,
  setRecipe,
}: GUIEditorDeleteProps): React.ReactElement {
  const remove = (): void => {
    const blockParent =
      editLocation.parents[editLocation.parents.findIndex((x) => x.name === 'blocks:')];
    const range = new Range(blockParent.line + 1, 1, editLocation.topParentLine + 1, 1);

    const text = '';
    const op = {
      identifier: { major: 1, minor: 1 },
      range,
      text,
      forceMoveMarkers: true,
    };

    monacoEditor.executeEdits('GUIEditor-saveBlock', [op]);
    setRecipe(monacoEditor.getValue());
    setEditorStep(GuiEditorStep.SELECT);
  };

  const onClose = React.useCallback(() => {
    setEditorStep(GuiEditorStep.SELECT);
  }, [setEditorStep]);

  return (
    <Modal
      footer={
        <>
          <CardFooterButton onClick={onClose}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="danger" onClick={remove}>
            <FormattedMessage {...messages.delete} />
          </CardFooterButton>
        </>
      }
      isActive
      onClose={onClose}
      title={<FormattedMessage {...messages.deleteWarningTitle} />}
    >
      <FormattedMessage {...messages.deleteWarning} />
    </Modal>
  );
}
