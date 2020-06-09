import { Button, Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import { EditLocation, GuiEditorStep } from '../../../GUIEditor/types';
import styles from './index.css';
import messages from './messages';

interface EditorNavBarProps {
  dirty: boolean;
  allowAdd: boolean;
  allowEdit: boolean;
  editorStep: GuiEditorStep;
  setEditorStep: (value: GuiEditorStep) => void;
  appUrl: string;
  editLocation: EditLocation;
  onUpload: () => void;
  valid: boolean;
}
export default function EditorNavBar({
  allowAdd,
  allowEdit,
  appUrl,
  dirty,
  editLocation,
  editorStep,
  onUpload,
  setEditorStep,
  valid,
}: EditorNavBarProps): React.ReactElement {
  const location = useLocation();

  const switchEditor = React.useCallback(() => {
    if (editorStep !== GuiEditorStep.YAML) {
      setEditorStep(GuiEditorStep.YAML);
    } else {
      setEditorStep(GuiEditorStep.SELECT);
    }
  }, [setEditorStep, editorStep]);
  return (
    <>
      <nav
        className={
          editorStep === GuiEditorStep.YAML || editorStep === GuiEditorStep.SELECT
            ? 'navbar'
            : 'is-hidden'
        }
      >
        <div className="navbar-brand">
          <span className="navbar-item">
            <Button disabled={!dirty} icon="vial" type="submit">
              <FormattedMessage {...messages.preview} />
            </Button>
          </span>
          <span className="navbar-item">
            <Button className="button" disabled={!valid || dirty} icon="save" onClick={onUpload}>
              <FormattedMessage {...messages.publish} />
            </Button>
          </span>
          <span className="navbar-item">
            <a className="button" href={appUrl} rel="noopener noreferrer" target="_blank">
              <Icon icon="share-square" />
              <span>
                <FormattedMessage {...messages.viewLive} />
              </span>
            </a>
          </span>
          <span className="navbar-item">
            <Button color="primary" icon="random" onClick={switchEditor}>
              {editorStep === GuiEditorStep.YAML ? (
                <FormattedMessage {...messages.switchGUI} />
              ) : (
                <FormattedMessage {...messages.switchManual} />
              )}
            </Button>
          </span>
        </div>
      </nav>
      <div
        className={
          editorStep === GuiEditorStep.YAML || editorStep === GuiEditorStep.SELECT
            ? `tabs is-boxed ${styles.editorTabs}`
            : 'is-hidden'
        }
      >
        {editorStep === GuiEditorStep.YAML ? (
          <ul>
            <li className={classNames({ 'is-active': location.hash === '#editor' })} value="editor">
              <Link to="#editor">
                <Icon icon="file-code" />
                <FormattedMessage {...messages.recipe} />
              </Link>
            </li>
            <li
              className={classNames({ 'is-active': location.hash === '#style-core' })}
              value="style-core"
            >
              <Link to="#style-core">
                <Icon icon="brush" />
                <FormattedMessage {...messages.coreStyle} />
              </Link>
            </li>
            <li
              className={classNames({ 'is-active': location.hash === '#style-shared' })}
              value="style-shared"
            >
              <Link to="#style-shared">
                <Icon icon="brush" />
                <FormattedMessage {...messages.sharedStyle} />
              </Link>
            </li>
          </ul>
        ) : (
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
                disabled={!allowAdd}
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
                disabled={!allowEdit}
                icon="edit"
                onClick={() => setEditorStep(GuiEditorStep.EDIT)}
              >
                <FormattedMessage {...messages.editBlock} />
                {editLocation?.blockName ? editLocation.blockName : ''}
              </Button>
            </li>
            <li value="removeblock">
              <Button
                className={styles.guiEditorButton}
                color="danger"
                disabled={!allowEdit}
                icon="trash-alt"
                onClick={() => setEditorStep(GuiEditorStep.DELETE)}
              >
                <FormattedMessage {...messages.deleteBlock} />
                {editLocation?.blockName ? editLocation.blockName : ''}
              </Button>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
