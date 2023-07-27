import { type UseAxiosResult } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppCard } from '../AppCard/index.js';
import { AsyncDataView } from '../AsyncDataView/index.js';

export type AppSortFunction = (a: App, b: App) => number;

export interface AppListProps {
  /**
   * The result from a `useAxios()` hook.
   */
  readonly result: UseAxiosResult<App[]>;

  /**
   * The filter for the app’s name and organization ID.
   */
  readonly filter?: string;

  /**
   * The function used to sort the app list.
   */
  readonly sortFunction: AppSortFunction;

  /**
   * Whether the sort function should be reversed.
   */
  readonly reverse: boolean;
}

export function AppList({ filter, result, reverse, sortFunction }: AppListProps): ReactElement {
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
                  app.OrganizationId.toLowerCase().includes(
                    filter.toLowerCase().replaceAll('@', ''),
                  ),
              )
            : apps
        ).sort((a, b) => (reverse ? sortFunction(b, a) : sortFunction(a, b)));

        if (!filteredApps.length) {
          return null;
        }

        return (
          <div className={styles.list}>
            {filteredApps.map((app) => (
              <AppCard app={app} key={app.id} />
            ))}
          </div>
        );
      }}
    </AsyncDataView>
  );
}
