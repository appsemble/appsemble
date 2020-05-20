import { CardFooterButton, Modal } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import { safeLoad } from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { EditLocation } from '../..';
import { GuiEditorStep } from '../..';
import messages from './messages';

interface GUIEditorDeleteProps {
  setEditorStep: (step: GuiEditorStep) => void;
  setApp: (app: App) => void;
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
  setApp,
  setEditorStep,
}: GUIEditorDeleteProps): React.ReactElement {
  const intl = useIntl();

  const getDeleteWarningType = React.useCallback((): deleteWarnings => {
    const blocks = getAppBlocks(app.definition);
    let blocksInPage = 0;
    let subBlockSelected = false;
    const selectedPageId = app.definition.pages
      .findIndex((page) => page.name === editLocation.pageName)
      .toString();

    Object.keys(blocks).map((key) => {
      const splitKey = key.split('.');
      const pageId = splitKey[1];
      if (selectedPageId === pageId) {
        blocksInPage += 1;
        if (splitKey.indexOf('blocks') !== splitKey.lastIndexOf('blocks')) {
          blocksInPage -= 1;
          if (blocks[key].type === editLocation.blockName) {
            subBlockSelected = true;
          }
        }
      }
      return pageId;
    });

    if (blocksInPage === 1 && subBlockSelected === false) {
      return deleteWarnings.DELETEPAGE;
    }
    if (subBlockSelected) {
      return deleteWarnings.DELETESUBBLOCKS;
    }
    return deleteWarnings.DELETEBLOCK;
  }, [app, editLocation]);

  const remove = (): void => {
    const warningType = getDeleteWarningType();
    const text = '';
    let range: Range;
    if (warningType === deleteWarnings.DELETEPAGE) {
      range = new Range(
        editLocation.parents[editLocation.parents.length - 2].line,
        1,
        editLocation.editRange.endLineNumber,
        1,
      );
    } else if (warningType === deleteWarnings.DELETESUBBLOCKS) {
      range = new Range(
        editLocation.editRange.startLineNumber - 1,
        1,
        editLocation.editRange.endLineNumber,
        1,
      );
    } else {
      range = editLocation.editRange;
    }

    const options = {
      identifier: { major: 1, minor: 1 },
      range,
      text,
      forceMoveMarkers: true,
    };

    monacoEditor.updateOptions({ readOnly: false });
    monacoEditor.executeEdits('GUIEditor-saveBlock', [options]);
    monacoEditor.updateOptions({ readOnly: true });

    const definition = safeLoad(monacoEditor.getValue());
    setApp({ ...app, yaml: monacoEditor.getValue(), definition });
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
