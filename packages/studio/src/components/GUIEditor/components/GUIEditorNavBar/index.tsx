import { Button, Icon } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import classNames from 'classnames';
import type { editor } from 'monaco-editor';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import { EditLocation, GuiEditorStep } from '../../types';
import GUIEditorDelete from '../GUIEditorDelete';
import styles from './index.css';
import messages from './messages';

interface GUIEditorNavBarProps {
  editorStep: GuiEditorStep;
  setEditorStep: (value: GuiEditorStep) => void;
  editLocation: EditLocation;
  app: App;
  monacoEditor: editor.IStandaloneCodeEditor;
}

export default function GUIEditorNavBar({
  app,
  editLocation,
  editorStep,
  monacoEditor,
  setEditorStep,
}: GUIEditorNavBarProps): React.ReactElement {
  const location = useLocation();

  return (
    <div
      className={
        editorStep === GuiEditorStep.SELECT ? `tabs is-boxed ${styles.editorTabs}` : 'is-hidden'
      }
    >
      <ul>
        <li className={classNames({ 'is-active': location.hash === '#editor' })} value="editor">
          <Link to="#editor">
            <Icon icon="file-code" />
            <FormattedMessage {...messages.recipe} />
          </Link>
        </li>
        <li value="addblock">
          <Button
            color="success"
            disabled={editLocation?.blockName === undefined}
            icon="plus"
            onClick={() => setEditorStep(GuiEditorStep.ADD)}
          >
            <FormattedMessage {...messages.addBlock} />
          </Button>
        </li>
        <li value="editblock">
          <Button
            className={styles.guiEditorButton}
            color="warning"
            disabled={editLocation?.blockName === undefined}
            icon="edit"
            onClick={() => setEditorStep(GuiEditorStep.EDIT)}
          >
            <FormattedMessage {...messages.editBlock} />
            {editLocation?.blockName ? editLocation.blockName : ''}
          </Button>
        </li>
        <li value="removeblock">
          <GUIEditorDelete
            app={app}
            disabled={editLocation?.blockName === undefined}
            editLocation={editLocation}
            monacoEditor={monacoEditor}
          />
        </li>
      </ul>
    </div>
  );
}
