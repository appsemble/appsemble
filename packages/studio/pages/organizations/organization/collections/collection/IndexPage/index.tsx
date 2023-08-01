import { Content, useData } from '@appsemble/react-components';
import { type App, type AppCollection } from '@appsemble/types';
import { type ReactElement, useCallback, useState } from 'react';

import { CollectionHeader } from './CollectionHeader/index.js';
import styles from './index.module.css';
import { AppList } from '../../../../../../components/AppList/index.js';
import {
  AppListControls,
  type AppSortFunctionName,
  sortFunctions,
} from '../../../../../../components/AppListControls/index.js';
import { usePageHeader } from '../../../../../../components/PageHeader/index.js';

interface IndexPageProps {
  readonly collection: AppCollection;
}

export function IndexPage({ collection }: IndexPageProps): ReactElement {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: AppSortFunctionName; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });

  const appsResult = useData<App[]>(`/api/appCollections/${collection.id}/apps`);

  const onSortChange = useCallback((name: AppSortFunctionName, reverse: boolean) => {
    setSort({ name, reverse });
  }, []);

  usePageHeader(collection && <CollectionHeader collection={collection} />);

  return (
    <Content className={styles.content} main>
      <AppListControls
        actionControl={null}
        filter={filter}
        onFilterChange={setFilter}
        onSortChange={onSortChange}
        reverse={sort?.reverse}
        sort={sort?.name}
      />
      <AppList
        filter={filter}
        result={appsResult}
        reverse={sort?.reverse}
        sortFunction={sortFunctions[sort?.name]}
      />
    </Content>
  );
}
