import { Button, Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import getAppUrl from '../../../../utils/getAppUrl';
import { useApp } from '../../../AppContext';
import { GuiEditorStep } from '../../../GUIEditor/types';
import styles from './index.css';
import messages from './messages';

interface EditorNavBarProps {
  dirty: boolean;
  editorStep: GuiEditorStep;
  setEditorStep: (value: GuiEditorStep) => void;
  onUpload: () => void;
  valid: boolean;
}

export default function EditorNavBar({
  dirty,
  editorStep,
  onUpload,
  setEditorStep,
  valid,
}: EditorNavBarProps): React.ReactElement {
  const location = useLocation();
  const { app } = useApp();

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
            <a
              className="button"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
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
      {editorStep === GuiEditorStep.YAML ? (
        <div className={`tabs is-boxed ${styles.editorTabs}`}>
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
        </div>
      ) : null}
    </>
  );
}
