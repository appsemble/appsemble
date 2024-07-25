import { Button, Content, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { Main } from '../Main/index.js';
import { AppBar } from '../TitleBar/index.js';
import { useUser } from '../UserProvider/index.js';

/**
 * Page containing debugging options for an app
 */
export function AppDebug(): ReactNode {
  useMeta(messages.debug);
  const { snapshotId } = useAppDefinition();
  const { logout } = useUser();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const cleanState = async (): Promise<void> => {
    logout();

    localStorage.clear();
    sessionStorage.clear();

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const name of cacheKeys) {
        await caches.delete(name);
      }
    }

    if ('serviceWorker' in navigator) {
      const serviceWorkerRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of serviceWorkerRegistrations) {
        await registration.unregister();
      }
    }

    navigate('/Login');
    window.location.reload();
  };

  return (
    <Content padding>
      <AppBar>
        <FormattedMessage {...messages.debug} />
      </AppBar>
      <Main>
        <div className="mb-2">{formatMessage(messages.snapshot, { id: snapshotId })}</div>
        <Button onClick={cleanState}>{formatMessage(messages.clean)}</Button>
      </Main>
    </Content>
  );
}
