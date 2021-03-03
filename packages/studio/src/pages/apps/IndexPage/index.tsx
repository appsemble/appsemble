import { Content, InputField, SelectField } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUser } from '../../../components/UserProvider';
import { checkRole } from '../../../utils/checkRole';
import { CollapsibleList } from './CollapsibleList';
import { CreateAppButton } from './CreateAppButton';
import styles from './index.module.css';
import { messages } from './messages';

const sortFunctions = {
  organization: (a: App, b: App) => a.OrganizationId.localeCompare(b.OrganizationId),
  rating: (a: App, b: App) =>
    a.rating.average === b.rating.average
      ? a.rating.count - b.rating.count
      : a.rating.average - b.rating.average,
  $created: (a: App, b: App) => a.$created.localeCompare(b.$created),
  $updated: (a: App, b: App) => a.$updated.localeCompare(b.$updated),
  name: (a: App, b: App) => a.definition.name.localeCompare(b.definition.name),
};

export function IndexPage(): ReactElement {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: keyof typeof sortFunctions; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });
  const { formatMessage } = useIntl();
  const { organizations, userInfo } = useUser();

  const onFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.currentTarget.value);
  }, []);

  const onSortChange = useCallback(
    ({ currentTarget: { value } }: ChangeEvent<HTMLSelectElement>): void => {
      const [name, direction] = value.split('.');
      setSort({ name: name as keyof typeof sortFunctions, reverse: direction === 'desc' });
    },
    [],
  );

  const createOrganizations =
    organizations?.filter((org) => checkRole(org.role, Permission.CreateApps)) ?? [];

  return (
    <Content className={styles.content} main>
      <div className="is-flex">
        <InputField
          className="mr-4 mb-0"
          icon="search"
          name="search"
          onChange={onFilterChange}
          placeholder={formatMessage(messages.search)}
          type="search"
        />
        <SelectField className="mb-0" icon="sort" name="sort" onChange={onSortChange}>
          <option hidden>{formatMessage(messages.sort)}</option>
          <option value="rating.asc">
            {`${formatMessage(messages.ratings)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="rating.desc">
            {`${formatMessage(messages.ratings)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="name.asc">
            {`${formatMessage(messages.name)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="name.desc">
            {`${formatMessage(messages.name)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="organization.asc">
            {`${formatMessage(messages.organization)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="organization.desc">
            {`${formatMessage(messages.organization)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="$created.asc">
            {`${formatMessage(messages.created)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="$created.desc">
            {`${formatMessage(messages.created)} (${formatMessage(messages.descending)})`}
          </option>
          <option value="$updated.asc">
            {`${formatMessage(messages.updated)} (${formatMessage(messages.ascending)})`}
          </option>
          <option value="$updated.desc">
            {`${formatMessage(messages.updated)} (${formatMessage(messages.descending)})`}
          </option>
        </SelectField>
        {createOrganizations.length >= 1 && <CreateAppButton className={styles.createAppButton} />}
      </div>

      {userInfo && (
        <CollapsibleList
          filter={filter}
          reverse={sort?.reverse}
          sortFunction={sortFunctions[sort?.name]}
          target="/api/apps/me"
          title={<FormattedMessage {...messages.myApps} />}
        />
      )}
      <CollapsibleList
        filter={filter}
        reverse={sort?.reverse}
        sortFunction={sortFunctions[sort?.name]}
        target="/api/apps"
        title={<FormattedMessage {...messages.allApps} />}
      />
    </Content>
  );
}
