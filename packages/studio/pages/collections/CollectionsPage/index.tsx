import {
  Button,
  InputField,
  Loader,
  Message,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { type ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AddCollectionModal } from './AddCollectionModal/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { CollectionCard } from '../../../components/CollectionCard/index.js';
import { HeaderControl } from '../../../components/HeaderControl/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';

interface CollectionsPageProps {
  readonly organizationId?: string;
}

export function CollectionsPage({ organizationId }: CollectionsPageProps): ReactElement {
  const { formatMessage } = useIntl();
  const target = organizationId
    ? `/api/organizations/${organizationId}/appCollections`
    : '/api/appCollections';
  const {
    data: collections,
    error: collectionsError,
    loading: collectionsLoading,
    setData: setCollections,
  } = useData<AppCollection[]>(target);

  const onCollectionCreated = useCallback(
    (newCollection: AppCollection) => setCollections([...collections, newCollection]),
    [collections, setCollections],
  );

  const createCollectionModal = useToggle();

  const { organizations } = useUser();

  const mayCreateCollections =
    organizationId != null &&
    checkRole(
      organizations?.find((org) => org.id === organizationId).role,
      Permission.CreateCollections,
    );

  return (
    <>
      {collectionsLoading ? (
        <Loader />
      ) : collectionsError ? (
        <Message color="danger">
          <FormattedMessage {...messages.collectionsError} />
        </Message>
      ) : (
        <>
          <div className={`is-flex-desktop ${styles.gap}`}>
            <InputField
              className="mb-0"
              icon="search"
              name="search"
              placeholder={formatMessage(messages.search)}
            />
            <Button
              disabled={!mayCreateCollections}
              onClick={createCollectionModal.enable}
              title={mayCreateCollections ? undefined : formatMessage(messages.notAllowed)}
            >
              <FormattedMessage {...messages.createCollection} />
            </Button>
          </div>
          <HeaderControl control level={4}>
            <FormattedMessage {...messages.collections} />
          </HeaderControl>
          <div>
            {collections?.map((collection) => (
              <CollectionCard collection={collection} key={collection.id} />
            ))}
          </div>
        </>
      )}
      {organizationId ? (
        <AddCollectionModal onCreated={onCollectionCreated} state={createCollectionModal} />
      ) : null}
    </>
  );
}
