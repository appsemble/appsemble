import {
  Button,
  Content,
  Icon,
  useConfirmation,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { type App, type AppCollection, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { CollectionHeader } from './CollectionHeader/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AppList, type AppSortFunction } from '../../../../components/AppList/index.js';
import {
  AppListControls,
  type AppSortFunctionName,
  sortFunctions,
} from '../../../../components/AppListControls/index.js';
import { usePageHeader } from '../../../../components/PageHeader/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';

interface IndexPageProps {
  readonly collection: AppCollection;
}

type PinnableApp = App & { pinnedAt: string };

/**
 * Wraps a sort function to sort pinned apps first and desceending by date of pinning no matter how
 * the sort function sorts them.
 *
 * @param fn The sort function to wrap.
 * @param reverse Whether the wrapped sort function is reversed.
 * @returns The wrapped sort function.
 */
function pinnedFirstSortWrapper(
  fn: AppSortFunction<PinnableApp>,
  reverse: boolean,
): AppSortFunction<PinnableApp> {
  return (a, b) => {
    const direction = reverse ? -1 : 1;
    if (a.pinnedAt != null && b.pinnedAt == null) {
      return -1 * direction;
    }
    if (b.pinnedAt != null && a.pinnedAt == null) {
      return direction;
    }
    if (a.pinnedAt != null && b.pinnedAt != null) {
      return (new Date(a.pinnedAt).getTime() - new Date(b.pinnedAt).getTime()) * direction;
    }
    return fn(a, b);
  };
}

export function IndexPage({ collection }: IndexPageProps): ReactNode {
  const { formatMessage } = useIntl();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ name: AppSortFunctionName; reverse: boolean }>({
    name: 'rating',
    reverse: true,
  });
  const { lang } = useParams();

  const appsResult = useData<PinnableApp[]>(
    `/api/app-collections/${collection.id}/apps?language=${lang}`,
  );

  const onSortChange = useCallback((name: AppSortFunctionName, reverse: boolean) => {
    setSort({ name, reverse });
  }, []);

  const onDelete = useConfirmation({
    body: <FormattedMessage {...messages.deleteAppFromCollectionBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.confirm} />,
    title: <FormattedMessage {...messages.deleteAppFromCollection} />,
    async action(app: App) {
      await axios.delete(`/api/app-collections/${collection.id}/apps/${app.id}`);
      appsResult.setData((apps) => apps.filter((a) => a.id !== app.id));
    },
  });

  const onPin = useCallback(
    async (app: PinnableApp) => {
      if (app.pinnedAt == null) {
        const {
          data: { pinnedAt },
        } = await axios.post<{ pinnedAt: string }>(
          `/api/app-collections/${collection.id}/apps/${app.id}/pinned`,
        );
        appsResult.setData((apps) => apps.map((a) => (a.id === app.id ? { ...a, pinnedAt } : a)));
      } else {
        await axios.delete(`/api/app-collections/${collection.id}/apps/${app.id}/pinned`);
        appsResult.setData((apps) =>
          apps.map((a) => (a.id === app.id ? { ...a, pinnedAt: null } : a)),
        );
      }
    },
    [collection.id, appsResult],
  );

  usePageHeader(collection && <CollectionHeader collection={collection} />);

  const { organizations } = useUser();
  const userOrganization = organizations?.find((org) => org.id === collection.OrganizationId);
  const mayEdit =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.UpdateAppCollections,
    ]);

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
        actionControlImport={null}
        filter={filter}
        onFilterChange={setFilter}
        onSortChange={onSortChange}
        reverse={sort?.reverse}
        sort={sort?.name}
      />
      <AppList<PinnableApp>
        decorate={(app) =>
          app.pinnedAt == null ? null : <Icon className={styles.pinnedAppIcon} icon="thumbtack" />
        }
        editMode={editMode}
        editModeCardControls={(app) => (
          <>
            <Button
              className={app.pinnedAt ? 'has-text-primary' : ''}
              icon="thumbtack"
              onClick={() => onPin(app)}
              title={formatMessage(app.pinnedAt ? messages.unpinApp : messages.pinApp)}
            />
            <Button
              className="has-text-danger"
              icon="trash-can"
              onClick={() => onDelete(app)}
              title={formatMessage(messages.deleteAppFromCollection)}
            />
          </>
        )}
        filter={filter}
        result={appsResult}
        reverse={sort.reverse}
        sortFunction={pinnedFirstSortWrapper(sortFunctions[sort.name], sort.reverse)}
      />
    </Content>
  );
}
