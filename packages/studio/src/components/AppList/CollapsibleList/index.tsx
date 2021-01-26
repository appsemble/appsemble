import { Button, Title, useData, useToggle } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { AsyncDataView } from '../../AsyncDataView';
import { AppCard } from '../AppCard';
import styles from './index.css';
import { messages } from './messages';

interface CollapsibleListProps {
  target: string;
  title: string | ReactElement;
  filter?: string;
  sortFunction: (a: App, b: App) => number;
  reverse: boolean;
}

export function CollapsibleList({
  filter,
  reverse,
  sortFunction,
  target,
  title,
}: CollapsibleListProps): ReactElement {
  const result = useData<App[]>(target);
  const collapsed = useToggle();

  return (
    <>
      <div className={`${styles.titleContainer} is-flex mb-5`}>
        <Button
          className={`${styles.toggle} pl-0`}
          icon={collapsed.enabled ? 'chevron-right' : 'chevron-down'}
          iconPosition="right"
          onClick={collapsed.toggle}
        >
          <Title className="mb-0" size={4}>
            {title}
          </Title>
        </Button>
      </div>
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

          return filteredApps.length ? (
            <div className={classNames([styles.appList, { 'is-hidden': collapsed.enabled }])}>
              {filteredApps.map((app) => (
                <AppCard app={app} key={app.id} />
              ))}
            </div>
          ) : (
            <FormattedMessage {...messages.noApps} />
          );
        }}
      </AsyncDataView>
    </>
  );
}
