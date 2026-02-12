import {
  Button,
  Loader,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  useToggle,
} from '@appsemble/react-components';
import { type App, type AppCollection, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../UserProvider/index.js';

interface AppToCollectionButtonProps {
  /**
   * The app to add to a collection.
   */
  readonly app: App;

  /*
   * Classname to be applied for the component
   */
  readonly className?: string;

  /**
   * Whether to trigger fetching collections.
   */
  readonly shouldFetch?: boolean;
}

const defaultValues = {
  collectionId: '',
};

/**
 * Render a button that can be used to add an app to a collection.
 */
export function AddToCollectionButton({
  app,
  className,
  shouldFetch = false,
}: AppToCollectionButtonProps): ReactNode {
  const { organizations, userInfo } = useUser();

  const [availableCollections, setAvailableCollections] = useState<AppCollection[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldFetch || availableCollections != null) {
      return;
    }

    const fetchCollections = async (): Promise<void> => {
      setLoading(true);
      try {
        const collections = (
          await Promise.all(
            organizations
              ?.filter((org) =>
                checkOrganizationRoleOrganizationPermissions(org.role, [
                  OrganizationPermission.UpdateAppCollections,
                ]),
              )
              .map((org) =>
                axios.get<AppCollection[]>(`/api/organizations/${org.id}/app-collections`),
              ),
          )
        ).flatMap((response) => response.data);
        setAvailableCollections(collections);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [shouldFetch, availableCollections, organizations]);

  const modalToggle = useToggle();

  const onSubmit = useCallback(
    async ({ collectionId }: typeof defaultValues) => {
      await axios.post(`/api/app-collections/${collectionId}/apps`, {
        AppId: app.id,
      });
      modalToggle.disable();
    },
    [app, modalToggle],
  );

  const hasCollections = availableCollections && availableCollections.length > 0;

  const organizationForCreate = organizations?.find((org) =>
    checkOrganizationRoleOrganizationPermissions(org.role, [
      OrganizationPermission.CreateAppCollections,
    ]),
  );

  return (
    <>
      <Button className={`mb-0 ${className && className}`} onClick={modalToggle.enable}>
        <FormattedMessage {...messages.addToCollection} />
      </Button>
      {userInfo ? (
        <ModalCard
          component={SimpleForm as typeof SimpleForm<typeof defaultValues>}
          defaultValues={defaultValues}
          footer={
            hasCollections ? (
              <SimpleModalFooter
                cancelLabel={<FormattedMessage {...messages.cancel} />}
                onClose={modalToggle.disable}
                submitLabel={<FormattedMessage {...messages.addToCollection} />}
              />
            ) : null
          }
          isActive={modalToggle.enabled}
          onClose={modalToggle.disable}
          onSubmit={onSubmit}
          title={<FormattedMessage {...messages.addToCollection} />}
        >
          {loading ? (
            <Loader />
          ) : hasCollections ? (
            <>
              <SimpleFormError>
                {({ error }) =>
                  axios.isAxiosError(error) && error.response?.status === 409 ? (
                    <FormattedMessage {...messages.alreadyInCollection} />
                  ) : (
                    <FormattedMessage {...messages.error} />
                  )
                }
              </SimpleFormError>
              <SimpleFormField component={SelectField} name="collectionId" required>
                <option className="is-hidden" disabled value="" />
                {availableCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </SimpleFormField>
            </>
          ) : (
            <p>
              <FormattedMessage {...messages.noCollections} />
              {organizationForCreate ? (
                <>
                  {' '}
                  <Link
                    onClick={modalToggle.disable}
                    to={`/organizations/${organizationForCreate.id}/collections`}
                  >
                    <FormattedMessage {...messages.createCollection} />
                  </Link>
                </>
              ) : null}
            </p>
          )}
        </ModalCard>
      ) : null}
    </>
  );
}
