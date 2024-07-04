import { Button, Message, useData } from '@appsemble/react-components';
import { type App, type Quota } from '@appsemble/types';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface Dismissal {
  id: number;
  reset: string;
}

function getDismissedApps(): Dismissal[] {
  const dismissed = localStorage.getItem('dismissedEmailQuotaBanners');
  if (!dismissed) {
    return [];
  }
  const parsed = JSON.parse(dismissed);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter(({ id, reset }) => id && reset)
    .filter(({ reset }) => new Date(reset).getTime() > Date.now());
}

interface BannerProps {
  readonly app: App;
  readonly onDismiss: (d: Dismissal) => void;
}

function Banner({ app, onDismiss }: BannerProps): ReactNode {
  const { data } = useData<Quota | null>(`/api/apps/${app.id}/quotas/email`);

  if (!data || data.used < data.limit) {
    return null;
  }

  return (
    <Message color="warning">
      <div className="is-flex is-justify-content-space-between is-align-items-center">
        <span>
          <FormattedMessage
            values={{ app: app.definition.name }}
            {...messages.appEmailQuotaExceeded}
          />
        </span>
        <Button onClick={() => onDismiss({ id: app.id, reset: data.reset })}>
          <FormattedMessage {...messages.dismissQuotaBanner} />
        </Button>
      </div>
    </Message>
  );
}

export function EmailQuotaBanners(): ReactNode {
  const [dismissed, setDismissed] = useState(getDismissedApps());

  const { data } = useData<App[]>('/api/users/current/apps');

  const onDismiss = useCallback(
    (dismissal: Dismissal) => {
      setDismissed((prev) => [...prev, dismissal]);
      localStorage.setItem('dismissedEmailQuotaBanners', JSON.stringify([...dismissed, dismissal]));
    },
    [dismissed],
  );

  if (!data) {
    return null;
  }

  const activeBanners = data.filter((app) => !dismissed.some(({ id }) => id === app.id));

  return (
    <>
      {activeBanners.map((app) => (
        <Banner app={app} key={app.id} onDismiss={onDismiss} />
      ))}
    </>
  );
}
