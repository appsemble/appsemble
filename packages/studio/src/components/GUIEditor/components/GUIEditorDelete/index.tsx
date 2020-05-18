import { CardFooterButton, Modal } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import type { editor } from 'monaco-editor';
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

enum deleteWarnings {
  'DELETEPAGE',
  'DELETESUBBLOCKS',
  'DELETEBLOCK',
}

export default function GUIEditorDelete({
  app,
  editLocation,
  monacoEditor,
  setEditorStep,
  setRecipe,
}: GUIEditorDeleteProps): React.ReactElement {
  const intl = useIntl();

  const getDeleteWarningType = React.useCallback((): deleteWarnings => {
    const blocks = getAppBlocks(app.definition);
    let blocksInPage = 0;
    let hasSubblocks = false;
    const selectedPageId = app.definition.pages
      .findIndex((page) => page.name === editLocation.pageName)
      .toString();

    Object.keys(blocks).map((key) => {
      const splitKey = key.split('.');
      const pageId = splitKey[1];
      if (selectedPageId === pageId) {
        blocksInPage += 1;
        if (splitKey.indexOf('blocks') !== splitKey.lastIndexOf('blocks')) {
          hasSubblocks = true;
        }
      }
      return pageId;
    });

    if (hasSubblocks) {
      return deleteWarnings.DELETESUBBLOCKS;
    }
    if (blocksInPage === 1) {
      return deleteWarnings.DELETEPAGE;
    }
    return deleteWarnings.DELETEBLOCK;
  }, [app, editLocation]);

  const remove = (): void => {
    const text = '';
    const op = {
      identifier: { major: 1, minor: 1 },
      range: editLocation.editRange,
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
      {getDeleteWarningType() === deleteWarnings.DELETESUBBLOCKS
        ? intl.formatMessage(messages.deleteSubBlockWarning, {
            blockname: editLocation.blockName,
          })
        : ''}
      {getDeleteWarningType() === deleteWarnings.DELETEPAGE
        ? intl.formatMessage(messages.deletePageWarning, {
            blockname: editLocation.blockName,
            pagename: editLocation.pageName,
          })
        : ''}
      {getDeleteWarningType() === deleteWarnings.DELETEBLOCK
        ? intl.formatMessage(messages.deleteWarning, {
            blockname: editLocation.blockName,
            pagename: editLocation.pageName,
          })
        : ''}
    </Modal>
  );
}
