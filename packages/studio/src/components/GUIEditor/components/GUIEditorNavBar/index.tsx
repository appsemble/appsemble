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
  onChangeEditorStep: (value: GuiEditorStep) => void;
  editLocation: EditLocation;
  app: App;
  monacoEditor: editor.IStandaloneCodeEditor;
}

export default function GUIEditorNavBar({
  app,
  editLocation,
  editorStep,
  monacoEditor,
  onChangeEditorStep,
}: GUIEditorNavBarProps): React.ReactElement {
  const location = useLocation();

  return (
    <div className={editorStep === GuiEditorStep.SELECT ? 'tabs is-boxed mb-0' : 'is-hidden'}>
      <ul>
        <li className={classNames({ 'is-active': location.hash === '#editor' })} value="editor">
          <Link to="#editor">
            <Icon icon="file-code" />
            <FormattedMessage {...messages.recipe} />
          </Link>
        </li>
        <li className="ml-1" value="addblock">
          <Button
            color="success"
            disabled={editLocation?.blockName === undefined}
            icon="plus"
            onClick={() => onChangeEditorStep(GuiEditorStep.ADD)}
          >
            <FormattedMessage {...messages.addBlock} />
          </Button>
        </li>
        <li className="mx-1" value="editblock">
          <Button
            className={styles.guiEditorButton}
            color="warning"
            disabled={editLocation?.blockName === undefined}
            icon="edit"
            onClick={() => onChangeEditorStep(GuiEditorStep.EDIT)}
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
