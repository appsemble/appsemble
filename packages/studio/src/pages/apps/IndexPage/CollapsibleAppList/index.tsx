import { useData } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { AppCard } from '../../../../components/AppCard';
import { AsyncDataView } from '../../../../components/AsyncDataView';
import { CollapsibleList } from '../../../../components/CollapsibleList';
import styles from './index.module.css';
import { messages } from './messages';

interface CollapsibleAppListProps {
  target: string;
  title: ReactElement | string;
  filter?: string;
  sortFunction: (a: App, b: App) => number;
  reverse: boolean;
}

export function CollapsibleAppList({
  filter,
  reverse,
  sortFunction,
  target,
  title,
}: CollapsibleAppListProps): ReactElement {
  const result = useData<App[]>(target);

  return (
    <AsyncDataView
      emptyMessage={<FormattedMessage {...messages.emptyApps} />}
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(apps) => {
        const filteredApps = (filter
          ? apps.filter(
              (app) =>
                app.definition.name.toLowerCase().includes(filter.toLowerCase()) ||
                app.OrganizationId.toLowerCase().includes(filter.toLowerCase().replace(/@/g, '')),
            )
          : apps
        ).sort((a, b) => (reverse ? sortFunction(b, a) : sortFunction(a, b)));

        if (!filteredApps.length) {
          return <FormattedMessage {...messages.noApps} />;
        }

        return (
          <CollapsibleList title={title}>
            <div className={styles.list}>
              {filteredApps.map((app) => (
                <AppCard app={app} key={app.id} />
              ))}
            </div>
          </CollapsibleList>
        );
      }}
    </AsyncDataView>
  );
}
