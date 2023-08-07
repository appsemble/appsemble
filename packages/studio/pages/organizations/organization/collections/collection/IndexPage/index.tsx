import { Button, Content, useConfirmation, useData, useToggle } from '@appsemble/react-components';
import { type App, type AppCollection } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectionHeader } from './CollectionHeader/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AppList } from '../../../../../../components/AppList/index.js';
import {
  AppListControls,
  type AppSortFunctionName,
  sortFunctions,
} from '../../../../../../components/AppListControls/index.js';
import { usePageHeader } from '../../../../../../components/PageHeader/index.js';
import { useUser } from '../../../../../../components/UserProvider/index.js';
import { checkRole } from '../../../../../../utils/checkRole.js';

interface IndexPageProps {
  readonly collection: AppCollection;
}

export function IndexPage({ collection }: IndexPageProps): ReactElement {
  const { formatMessage } = useIntl();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: AppSortFunctionName; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });

  const appsResult = useData<App[]>(`/api/appCollections/${collection.id}/apps`);

  const onSortChange = useCallback((name: AppSortFunctionName, reverse: boolean) => {
    setSort({ name, reverse });
  }, []);

  const onDelete = useConfirmation({
    body: <FormattedMessage {...messages.deleteAppFromCollectionBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.confirm} />,
    title: <FormattedMessage {...messages.deleteAppFromCollection} />,
    async action(app: App) {
      await axios.delete(`/api/appCollections/${collection.id}/apps/${app.id}`);
      appsResult.setData((apps) => apps.filter((a) => a.id !== app.id));
    },
  });

  usePageHeader(collection && <CollectionHeader collection={collection} />);

  const { organizations } = useUser();
  const userOrganization = organizations?.find((org) => org.id === collection.OrganizationId);
  const mayEdit = userOrganization && checkRole(userOrganization.role, Permission.EditCollections);

  const editMode = useToggle();

  return (
    <Content className={styles.content} main>
      <AppListControls
        actionControl={
          mayEdit ? (
            <Button onClick={editMode.toggle}>
              {editMode.enabled ? (
                <FormattedMessage {...messages.stopEditing} />
              ) : (
                <FormattedMessage {...messages.edit} />
              )}
            </Button>
          ) : null
        }
        filter={filter}
        onFilterChange={setFilter}
        onSortChange={onSortChange}
        reverse={sort?.reverse}
        sort={sort?.name}
      />
      <AppList
        editMode={editMode}
        editModeCardControls={(app) => (
          <Button
            className="has-text-danger"
            icon="trash-can"
            onClick={() => onDelete(app)}
            title={formatMessage(messages.deleteAppFromCollection)}
          />
        )}
        filter={filter}
        result={appsResult}
        reverse={sort?.reverse}
        sortFunction={sortFunctions[sort?.name]}
      />
    </Content>
  );
}
