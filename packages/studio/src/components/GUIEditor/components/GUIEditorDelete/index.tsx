import { CardFooterButton, Modal } from '@appsemble/react-components';
import type { App, BasicPage } from '@appsemble/types';
import type { editor } from 'monaco-editor';
import { Range } from 'monaco-editor';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { GuiEditorStep } from '../..';
import type { EditLocation } from '../../../MonacoEditor';
import messages from './messages';

interface GUIEditorDeleteProps {
  setEditorStep: (step: GuiEditorStep) => void;
  setRecipe: (value: string) => void;
  monacoEditor: editor.IStandaloneCodeEditor;
  editLocation: EditLocation;
  app: App;
}

export default function GUIEditorDelete({
  app,
  editLocation,
  monacoEditor,
  setEditorStep,
  setRecipe,
}: GUIEditorDeleteProps): React.ReactElement {
  const intl = useIntl();

  const deletePage = (): boolean => {
    const selectedPage = app.definition.pages[
      app.definition.pages.findIndex((page) => page.name === editLocation.pageName)
    ] as BasicPage;
    if (selectedPage.blocks.length === 1) {
      return true;
    }
    return false;
  };

  const remove = (): void => {
    let range;
    const blockParentIndex = editLocation.parents.findIndex((x) => x.name === 'blocks:');
    if (!deletePage()) {
      const selectBlockParent = editLocation.parents[blockParentIndex - 1];
      range = new Range(selectBlockParent.line, 1, editLocation.topParentLine + 1, 1);
    } else {
      const selectedPageParent = editLocation.parents[blockParentIndex + 1];
      range = new Range(selectedPageParent.line, 1, editLocation.topParentLine + 1, 1);
    }

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
      {deletePage()
        ? intl.formatMessage(messages.deletePageWarning, {
            blockname: editLocation.blockName,
            pagename: editLocation.pageName,
          })
        : intl.formatMessage(messages.deleteWarning, {
            blockname: editLocation.blockName,
            pagename: editLocation.pageName,
          })}
    </Modal>
  );
}
