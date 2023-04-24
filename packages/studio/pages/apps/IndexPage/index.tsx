import { Content, InputField, SelectField } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ChangeEvent, type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { CollapsibleAppList } from './CollapsibleAppList/index.js';
import { CreateAppButton } from './CreateAppButton/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../components/UserProvider/index.js';

const sortFunctions = {
  organization: (a: App, b: App) => a.OrganizationId.localeCompare(b.OrganizationId),
  rating(a: App, b: App) {
    const ratingA = a.rating ?? { average: 0, count: 0 };
    const ratingB = b.rating ?? { average: 0, count: 0 };

    return ratingA.average === ratingB.average
      ? ratingA.count - ratingB.count
      : ratingA.average - ratingB.average;
  },
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
  const { userInfo } = useUser();
  const { lang } = useParams<{ lang: string }>();

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
        {userInfo ? <CreateAppButton className={styles.createAppButton} /> : null}
      </div>

      {userInfo ? (
        <CollapsibleAppList
          filter={filter}
          reverse={sort?.reverse}
          sortFunction={sortFunctions[sort?.name]}
          target={`/api/user/apps?language=${lang}`}
          title={<FormattedMessage {...messages.myApps} />}
        />
      ) : null}
      <CollapsibleAppList
        filter={filter}
        reverse={sort?.reverse}
        sortFunction={sortFunctions[sort?.name]}
        target={`/api/apps?language=${lang}`}
        title={<FormattedMessage {...messages.allApps} />}
      />
    </Content>
  );
}
