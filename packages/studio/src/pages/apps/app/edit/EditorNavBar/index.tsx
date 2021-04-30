import { Button, Icon, Tab, Tabs } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';

import { useApp } from '../..';
import { getAppUrl } from '../../../../../utils/getAppUrl';
import { messages } from './messages';

interface EditorNavBarProps {
  dirty: boolean;
  onPreview: () => void;
  onUpload: () => void;
  valid: boolean;
}

export function EditorNavBar({
  dirty,
  onPreview,
  onUpload,
  valid,
}: EditorNavBarProps): ReactElement {
  const location = useLocation();
  const history = useHistory();
  const { app } = useApp();

  const changeTab = useCallback((event, hash: string) => history.push({ hash }), [history]);

  return (
    <>
      <div className="buttons">
        <Button disabled={!dirty || app.locked} icon="vial" onClick={onPreview}>
          <FormattedMessage {...messages.preview} />
        </Button>
        <Button disabled={!valid || dirty || app.locked} icon="save" onClick={onUpload}>
          <FormattedMessage {...messages.publish} />
        </Button>
        <Button
          component="a"
          href={getAppUrl(app.OrganizationId, app.path, app.domain)}
          icon="share-square"
          rel="noopener noreferrer"
          target="_blank"
        >
          <FormattedMessage {...messages.viewLive} />
        </Button>
      </div>
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
    </>
  );
}
