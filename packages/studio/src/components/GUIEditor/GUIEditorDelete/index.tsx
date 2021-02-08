import { Button, useConfirmation } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import { editor, Range } from 'monaco-editor';
import { ReactElement, ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { EditLocation } from '../types';
import { applyMonacoEdits } from '../utils/applyMonacoEdits';
import { messages } from './messages';

interface GUIEditorDeleteProps {
  app: App;
  editLocation: EditLocation;
  monacoEditor: editor.IStandaloneCodeEditor;
  disabled: boolean;
}

export function GUIEditorDelete({
  app,
  disabled,
  editLocation,
  monacoEditor,
}: GUIEditorDeleteProps): ReactElement {
  const [range, body] = useMemo<[Range, ReactNode]>(() => {
    if (!app.definition?.pages?.length || !editLocation) {
      return [null, null];
    }
    const { blockName, editRange, pageName, parents } = editLocation;

    const blocks = getAppBlocks(app.definition);
    let blocksInPage = 0;
    let subBlockSelected = false;
    const selectedPageId = String(app.definition.pages.findIndex((page) => page.name === pageName));

    Object.keys(blocks).forEach((key) => {
      const [, pageId, ...splitKey] = key.split('.');
      if (selectedPageId !== pageId) {
        return;
      }
      if (splitKey.indexOf('blocks') === splitKey.lastIndexOf('blocks')) {
        blocksInPage += 1;
        return;
      }
      if (blocks[key].type === blockName) {
        subBlockSelected = true;
      }
    });

    if (blocksInPage === 1 && !subBlockSelected) {
      return [
        new Range(parents[parents.length - 2].line, 1, editRange.endLineNumber, 1),
        <FormattedMessage
          key={null}
          {...messages.deletePageWarning}
          values={{ blockName, pageName }}
        />,
      ];
    }

    if (subBlockSelected) {
      return [
        new Range(editRange.startLineNumber - 1, 1, editRange.endLineNumber, 1),
        <FormattedMessage key={null} {...messages.deleteSubBlockWarning} values={{ blockName }} />,
      ];
    }

    return [
      editRange,
      <FormattedMessage key={null} {...messages.deleteWarning} values={{ blockName, pageName }} />,
    ];
  }, [app, editLocation]);

  const action = useCallback((): void => {
    const edits: editor.IIdentifiedSingleEditOperation[] = [
      {
        range,
        text: null,
        forceMoveMarkers: true,
      },
    ];

    applyMonacoEdits(monacoEditor, edits);
  }, [monacoEditor, range]);

  const onClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: (
      <FormattedMessage {...messages.deleteBlock} values={{ blockName: editLocation?.blockName }} />
    ),
    action,
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
      <FormattedMessage {...messages.deleteBlock} values={{ blockName: editLocation?.blockName }} />
    </Button>
  );
}
