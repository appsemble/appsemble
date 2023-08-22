import {
  Loader,
  MenuItem,
  MenuSection,
  Message,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Route, useParams } from 'react-router-dom';

import { ExpertPage } from './ExpertPage/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { SettingsPage } from './SettingsPage/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';

interface CollectionRoutesProps {
  readonly fallbackCollectionId?: number;
}

export function CollectionRoutes({ fallbackCollectionId }: CollectionRoutesProps): ReactElement {
  const { collectionId, lang } = useParams<{
    lang: string;
    organizationId: string;
    collectionId: string;
  }>();
  const id = Number.parseInt(collectionId) || fallbackCollectionId;
  const {
    data: collection,
    error,
    loading,
    setData: setCollection,
  } = useData<AppCollection>(`/api/appCollections/${id}`);

  const { organizations } = useUser();
  const organizationId = collection?.OrganizationId;
  const userOrganization = organizations?.find((org) => org.id === organizationId);

  const mayEdit = userOrganization && checkRole(userOrganization.role, Permission.EditCollections);

  const url = `/${lang}/collections/${collectionId}`;

  useSideMenu(
    collection && (
      <MenuSection label={<span className="ml-2">{collection.name}</span>}>
        <MenuItem exact icon="folder" to={url}>
          <FormattedMessage {...messages.apps} />
        </MenuItem>
        {mayEdit ? (
          <MenuItem icon="cog" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        ) : null}
      </MenuSection>
    ),
  );

  if (error) {
    return (
      <Message color="danger">
        {error.response?.status === 404 ? (
          <FormattedMessage {...messages.notFound} />
        ) : error.response?.status === 401 ? (
          <FormattedMessage {...messages.permissionError} />
        ) : (
          <FormattedMessage {...messages.uncaughtError} />
        )}
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <MetaSwitch title={collection?.name}>
      <Route
        element={<SettingsPage collection={collection} setCollection={setCollection} />}
        path="/settings"
      />
      <Route element={<ExpertPage collection={collection} />} path="/expert" />
      <Route element={<IndexPage collection={collection} />} path="/" />
    </MetaSwitch>
  );
}
