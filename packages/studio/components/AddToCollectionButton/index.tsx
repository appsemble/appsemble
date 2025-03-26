import {
  Button,
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
}

const defaultValues = {
  collectionId: '',
};

/**
 * Render a button that can be used to add an app to a collection.
 */
export function AddToCollectionButton({ app, className }: AppToCollectionButtonProps): ReactNode {
  const { organizations, userInfo } = useUser();

  const [availableCollections, setAvailableCollections] = useState<AppCollection[]>([]);
  useEffect(() => {
    const fetchCollections = async (): Promise<void> => {
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
    };
    fetchCollections();
  }, [organizations]);

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

  if (availableCollections.length === 0) {
    return null;
  }

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
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancel} />}
              onClose={modalToggle.disable}
              submitLabel={<FormattedMessage {...messages.addToCollection} />}
            />
          }
          isActive={modalToggle.enabled}
          onClose={modalToggle.disable}
          onSubmit={onSubmit}
          title={<FormattedMessage {...messages.addToCollection} />}
        >
          <SimpleFormError>
            {({ error }) =>
              axios.isAxiosError(error) && error.response.status === 409 ? (
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
        </ModalCard>
      ) : null}
    </>
  );
}
