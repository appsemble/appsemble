import { Button, useConfirmation } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import { safeLoad } from 'js-yaml';
import { editor, Range } from 'monaco-editor';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { EditLocation } from '../../types';
import messages from './messages';

interface GUIEditorDeleteProps {
  app: App;
  editLocation: EditLocation;
  monacoEditor: editor.IStandaloneCodeEditor;
  setApp: (app: App) => void;
  setRecipe: (value: string) => void;
  disabled: boolean;
}

enum deleteWarnings {
  'DELETEPAGE',
  'DELETESUBBLOCKS',
  'DELETEBLOCK',
}

export default function GUIEditorDelete({
  app,
  disabled,
  editLocation,
  monacoEditor,
  setApp,
  setRecipe,
}: GUIEditorDeleteProps): React.ReactElement {
  const getDeleteWarningType = React.useCallback((): deleteWarnings => {
    if (app.definition.pages.length === 0) {
      return null;
    }

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

  const remove = React.useCallback((): void => {
    const warningType = getDeleteWarningType();
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

    monacoEditor.updateOptions({ readOnly: false });
    monacoEditor.executeEdits('GUIEditor', [
      {
        range,
        text: null,
        forceMoveMarkers: true,
      },
    ]);
    monacoEditor.updateOptions({ readOnly: true });

    const definition = safeLoad(monacoEditor.getValue());
    setApp({ ...app, yaml: monacoEditor.getValue(), definition });
    setRecipe(monacoEditor.getValue());
  }, [app, monacoEditor, editLocation, getDeleteWarningType, setApp, setRecipe]);

  const messageBody = React.useCallback((): React.ReactElement => {
    switch (getDeleteWarningType()) {
      case deleteWarnings.DELETESUBBLOCKS:
        return (
          <FormattedMessage
            {...messages.deleteSubBlockWarning}
            values={{ blockname: editLocation.blockName }}
          />
        );
      case deleteWarnings.DELETEPAGE:
        return (
          <FormattedMessage
            {...messages.deletePageWarning}
            values={{ blockname: editLocation.blockName, pagename: editLocation.pageName }}
          />
        );
      default:
        return (
          <FormattedMessage
            {...messages.deleteWarning}
            values={{ blockname: editLocation.blockName, pagename: editLocation.pageName }}
          />
        );
    }
  }, [editLocation, getDeleteWarningType]);

  const onClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: editLocation?.blockName && editLocation?.pageName ? messageBody() : 'error',
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: (
      <FormattedMessage {...messages.deleteBlock} values={{ name: editLocation?.blockName }} />
    ),
    action: remove,
  });

  if (editLocation?.blockName === undefined || editLocation?.pageName === undefined) {
    return (
      <Button color="danger" disabled={disabled} icon="trash-alt">
        <FormattedMessage {...messages.delete} />
      </Button>
    );
  }

  return (
    <Button color="danger" disabled={disabled} icon="trash-alt" onClick={onClick}>
      <FormattedMessage {...messages.deleteBlock} values={{ name: editLocation.blockName }} />
    </Button>
  );
}
