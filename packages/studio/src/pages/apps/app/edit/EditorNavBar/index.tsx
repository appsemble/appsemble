import { Button, Icon, Tab, Tabs } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';

import { useApp } from '../..';
import { GuiEditorStep } from '../../../../../components/GUIEditor/types';
import { getAppUrl } from '../../../../../utils/getAppUrl';
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
            <Button disabled={!dirty || app.locked} icon="vial" type="submit">
              <FormattedMessage {...messages.preview} />
            </Button>
          </span>
          <span className="navbar-item">
            <Button disabled={!valid || dirty || app.locked} icon="save" onClick={onUpload}>
              <FormattedMessage {...messages.publish} />
            </Button>
          </span>
          <span className="navbar-item">
            <Button
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              icon="share-square"
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.viewLive} />
            </Button>
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
            <FormattedMessage {...messages.app} />
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
