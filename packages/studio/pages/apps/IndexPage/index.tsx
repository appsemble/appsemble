import { Content, useData } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppList } from '../../../components/AppList/index.js';
import {
  AppListControls,
  type AppSortFunctionName,
  sortFunctions,
} from '../../../components/AppListControls/index.js';
import { Collapsible } from '../../../components/Collapsible/index.js';
import { useUser } from '../../../components/UserProvider/index.js';

export function IndexPage(): ReactElement {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: AppSortFunctionName; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });
  const { userInfo } = useUser();
  const { lang } = useParams<{ lang: string }>();
  const myAppsResult = useData<App[]>(`/api/user/apps?language=${lang}`);
  const appsResult = useData<App[]>(`/api/apps?language=${lang}`);
  const onSortChange = useCallback((name: AppSortFunctionName, reverse: boolean) => {
    setSort({ name, reverse });
  }, []);

  return (
    <Content className={styles.content} main>
      <AppListControls
        filter={filter}
        onFilterChange={setFilter}
        onSortChange={onSortChange}
        reverse={sort?.reverse}
        sort={sort?.name}
      />

      {userInfo ? (
        <Collapsible title={<FormattedMessage {...messages.myApps} />}>
          <AppList
            filter={filter}
            result={myAppsResult}
            reverse={sort?.reverse}
            sortFunction={sortFunctions[sort?.name]}
          />
        </Collapsible>
      ) : null}
      <br />
      <Collapsible title={<FormattedMessage {...messages.allApps} />}>
        <AppList
          filter={filter}
          result={appsResult}
          reverse={sort?.reverse}
          sortFunction={sortFunctions[sort?.name]}
        />
      </Collapsible>
    </Content>
  );
}
