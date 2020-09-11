import { Button, Icon, Tab, Tabs } from '@appsemble/react-components';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';

import { getAppUrl } from '../../../utils/getAppUrl';
import { useApp } from '../../AppContext';
import { GuiEditorStep } from '../../GUIEditor/types';
import { messages } from './messages';

interface EditorNavBarProps {
  dirty: boolean;
  editorStep: GuiEditorStep;
  setEditorStep: (value: GuiEditorStep) => void;
  onUpload: () => void;
  valid: boolean;
}

export function EditorNavBar({
  dirty,
  editorStep,
  onUpload,
  setEditorStep,
  valid,
}: EditorNavBarProps): ReactElement {
  const location = useLocation();
  const history = useHistory();
  const { app } = useApp();

  const changeTab = useCallback((event, hash: string) => history.push({ hash }), [history]);

  const switchEditor = useCallback(() => {
    if (editorStep === GuiEditorStep.YAML) {
      setEditorStep(GuiEditorStep.SELECT);
    } else {
      setEditorStep(GuiEditorStep.YAML);
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
      {editorStep === GuiEditorStep.YAML && (
        <Tabs boxed className="mb-0" onChange={changeTab} value={location.hash}>
          <Tab href="#editor" value="editor">
            <Icon icon="file-code" />
            <FormattedMessage {...messages.recipe} />
          </Tab>
          <Tab href="#style-core" value="style-core">
            <Icon icon="brush" />
            <FormattedMessage {...messages.coreStyle} />
          </Tab>
          <Tab href="#style-shared" value="style-shared">
            <Icon icon="brush" />
            <FormattedMessage {...messages.sharedStyle} />
          </Tab>
        </Tabs>
      )}
    </>
  );
}
