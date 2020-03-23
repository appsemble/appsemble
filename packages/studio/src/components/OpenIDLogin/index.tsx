import { Button, Loader, Message, useQuery } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import axios from 'axios';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

export default function OpenIDLogin(): React.ReactElement {
  const qs = useQuery();

  const [appLoading, setAppLoading] = React.useState(true);
  const [app, setApp] = React.useState<App>();
  const [error, setError] = React.useState<React.ComponentPropsWithoutRef<typeof FormattedMessage>>(
    null,
  );
  const [generating, setGenerating] = React.useState(false);

  const responseType = qs.get('response_type');
  const scope = qs.get('scope');
  const clientId = qs.get('client_id');
  const state = qs.get('state');
  const redirectUri = qs.get('redirect_uri');

  const fetchCode = React.useCallback(async () => {
    setGenerating(true);
    const { data } = await axios.post('/api/oauth2/authorization-code', {
      appId: app.id,
      redirectUri,
    });
    const redirect = new URL(redirectUri);
    redirect.searchParams.set('code', data.code);
    if (state) {
      redirect.searchParams.set('state', state);
    }
    window.location.assign(`${redirect}`);
  }, [app, redirectUri, state]);

  React.useEffect(() => {
    if (!responseType) {
      setError(messages.missingResponseType);
      return;
    }

    if (!scope) {
      setError(messages.missingScope);
      return;
    }

    if (!clientId) {
      setError(messages.missingClientId);
      return;
    }

    if (!redirectUri) {
      setError(messages.missingRedirectUri);
      return;
    }

    if (responseType !== 'code') {
      setError({ ...messages.invalidResponseType, values: { responseType } });
      return;
    }

    if (scope !== 'openid') {
      setError({ ...messages.invalidScope, values: { scope } });
      return;
    }

    const appIdMatch = clientId.match(/^app:(\d+)$/);
    if (!appIdMatch) {
      setError({ ...messages.invalidClientId, values: { clientId } });
      return;
    }

    axios
      .get<App>(`/api/apps/${appIdMatch[1]}`)
      .then(({ data }) => {
        setApp(data);
        setAppLoading(false);
      })
      .catch(() => {
        setError(messages.unknownError);
        setAppLoading(false);
      });
  }, [clientId, redirectUri, responseType, scope]);

  if (appLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...error} />
      </Message>
    );
  }

  return (
    <div className={styles.root}>
      <HelmetIntl title={messages.title} titleValues={{ app: app.definition.name }} />
      <div className="content">
        <p>
          <FormattedMessage
            {...messages.prompt}
            values={{
              app: <span className="has-text-weight-bold is-italic">{app.definition.name}</span>,
            }}
          />
        </p>
        <ul>
          <li>
            <FormattedMessage {...messages.readProfile} />
          </li>
          {app.definition.resources
            ? Object.keys(app.definition.resources)
                .sort()
                .map(resource => (
                  <li key={resource}>
                    <FormattedMessage {...messages.manageResource} values={{ resource }} />
                  </li>
                ))
            : null}
        </ul>
      </div>
      <div className={styles.buttonWrapper}>
        <Button className={styles.button} disabled={generating}>
          <FormattedMessage {...messages.deny} />
        </Button>
        <Button
          className={styles.button}
          color="primary"
          disabled={generating}
          loading={generating}
          onClick={fetchCode}
        >
          <FormattedMessage {...messages.allow} />
        </Button>
      </div>
    </div>
  );
}
