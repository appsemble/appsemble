import {
  Button,
  InputField,
  Loader,
  Message,
  useConfirmation,
  useData,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { AddCollectionModal } from './AddCollectionModal/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { CollectionCard } from '../../../components/CollectionCard/index.js';
import { HeaderControl } from '../../../components/HeaderControl/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';
import { messages as settingsMessages } from '../collection/SettingsPage/messages.js';

interface CollectionsPageProps {
  readonly organizationId?: string;
}

export function CollectionsPage({ organizationId }: CollectionsPageProps): ReactNode {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const navigate = useNavigate();

  const target = organizationId
    ? `/api/organizations/${organizationId}/appCollections`
    : '/api/appCollections';
  const {
    data: collections,
    error: collectionsError,
    loading: collectionsLoading,
    setData: setCollections,
  } = useData<AppCollection[]>(target);

  const [filter, setFilter] = useState('');

  const onCollectionCreated = useCallback(
    (newCollection: AppCollection) => setCollections([newCollection, ...collections]),
    [collections, setCollections],
  );

  const createCollectionModal = useToggle();

  const { organizations } = useUser();

  const [mayCreateCollections, mayEditCollections, mayDeleteCollections] = [
    Permission.CreateCollections,
    Permission.EditCollections,
    Permission.DeleteCollections,
  ].map(
    (permission) =>
      organizationId != null &&
      checkRole(organizations?.find((org) => org.id === organizationId).role, permission),
  );

  const editCollection = useCallback(
    (collection: AppCollection) => {
      navigate(`../../../collections/${collection.id}/settings`);
    },
    [navigate],
  );

  const deleteCollection = useConfirmation({
    title: <FormattedMessage {...settingsMessages.deleteWarningTitle} />,
    confirmLabel: <FormattedMessage {...settingsMessages.delete} />,
    cancelLabel: <FormattedMessage {...settingsMessages.cancel} />,
    body: <FormattedMessage {...settingsMessages.deleteWarning} />,
    action(collection: AppCollection) {
      axios
        .delete(`/api/appCollections/${collection.id}`)
        .then(() => setCollections(collections.filter((c) => c.id !== collection.id)))
        .then(() => push({ color: 'info', body: formatMessage(settingsMessages.deleteSuccess) }))
        .catch(() => push({ color: 'danger', body: formatMessage(settingsMessages.deleteError) }));
    },
  });

  const filteredCollections = (collections ?? []).filter(
    (collection) =>
      collection.name.toLowerCase().includes(filter.toLowerCase()) ||
      collection.OrganizationName?.toLowerCase().includes(filter.toLowerCase()) ||
      collection.$expert.name.toLowerCase().includes(filter.toLowerCase()),
  );

  if (collectionsLoading) {
    return <Loader />;
  }

  if (collectionsError) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.collectionsError} />
      </Message>
    );
  }

  return (
    <>
      <div className={`is-flex-desktop ${styles.gap}`}>
        <InputField
          className="mb-0"
          icon="search"
          name="search"
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder={formatMessage(messages.search)}
          value={filter}
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
        {filteredCollections?.map((collection) => (
          <CollectionCard
            canDelete={mayDeleteCollections}
            canEdit={mayEditCollections}
            collection={collection}
            key={collection.id}
            onDelete={() => deleteCollection(collection)}
            onEdit={() => editCollection(collection)}
          />
        ))}
      </div>
      {organizationId ? (
        <AddCollectionModal onCreated={onCollectionCreated} state={createCollectionModal} />
      ) : null}
    </>
  );
}
