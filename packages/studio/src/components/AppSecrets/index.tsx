import {
  Button,
  Content,
  Loader,
  Message,
  Title,
  useData,
  useToggle,
} from '@appsemble/react-components';
import type { AppOAuth2Secret } from '@appsemble/types';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import AppSecretCard from './components/AppSecretCard';
import messages from './messages';

const initialSecret: AppOAuth2Secret = {
  authorizationUrl: '',
  clientId: '',
  clientSecret: '',
  icon: 'user',
  name: '',
  scope: 'email openid profile',
  tokenUrl: '',
};

export default function AppSecrets(): React.ReactElement {
  const { app } = useApp();

  const { data: secrets, error, loading, setData: setSecrets } = useData<AppOAuth2Secret[]>(
    `/api/apps/${app.id}/secrets/oauth2`,
  );
  const adding = useToggle();

  const onUpdated = React.useCallback(
    (newSecret: AppOAuth2Secret, oldSecret: AppOAuth2Secret) => {
      setSecrets(secrets.map((s) => (s === oldSecret ? newSecret : s)));
    },
    [secrets, setSecrets],
  );

  const onAdded = React.useCallback(
    (newSecret: AppOAuth2Secret) => {
      setSecrets([...secrets, newSecret]);
      adding.disable();
    },
    [adding, secrets, setSecrets],
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message>
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  return (
    <Content>
      <HelmetIntl title={messages.title} />
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>

      {secrets.length ? (
        secrets.map((secret) => (
          <AppSecretCard key={secret.id} onUpdated={onUpdated} secret={secret} />
        ))
      ) : (
        <FormattedMessage {...messages.noSecrets} />
      )}
      {adding.enabled ? (
        <AppSecretCard onUpdated={onAdded} secret={initialSecret} />
      ) : (
        <Button icon="plus" onClick={adding.enable}>
          <FormattedMessage {...messages.addNew} />
        </Button>
      )}
    </Content>
  );
}
