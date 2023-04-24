import { useData } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppCard } from '../../../../components/AppCard/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { Collapsible } from '../../../../components/Collapsible/index.js';

interface CollapsibleAppListProps {
  /**
   * The URL to fetch the data from.
   */
  target: string;

  /**
   * The clickable title used to toggle displaying or hiding the apps.
   */
  title: ReactElement | string;

  /**
   * The filter for the app’s name and organization ID.
   */
  filter?: string;

  /**
   * The function used to sort the app list.
   */
  sortFunction: (a: App, b: App) => number;

  /**
   * Whether the sort function should be reversed.
   */
  reverse: boolean;
}

/**
 * Fetch and display a collapsible list of apps.
 */
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
        const filteredApps = (
          filter
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
          <Collapsible title={title}>
            <div className={styles.list}>
              {filteredApps.map((app) => (
                <AppCard app={app} key={app.id} />
              ))}
            </div>
          </Collapsible>
        );
      }}
    </AsyncDataView>
  );
}
