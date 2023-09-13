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
import { type App, type AppCollection } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { checkRole } from '../../utils/checkRole.js';
import { useUser } from '../UserProvider/index.js';

interface AppToCollectionButtonProps {
  /**
   * The app to add to a collection.
   */
  readonly app: App;
}

const defaultValues = {
  collectionId: '',
};

/**
 * Render a button that can be used to add an app to a collection.
 */
export function AddToCollectionButton({ app }: AppToCollectionButtonProps): ReactElement {
  const { organizations, userInfo } = useUser();

  const [availableCollections, setAvailableCollections] = useState<AppCollection[]>([]);
  useEffect(() => {
    const fetchCollections = async (): Promise<void> => {
      const collections = (
        await Promise.all(
          organizations
            ?.filter((org) => checkRole(org.role, Permission.EditCollections))
            .map((org) =>
              axios.get<AppCollection[]>(`/api/organizations/${org.id}/appCollections`),
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
      await axios.post(`/api/appCollections/${collectionId}/apps`, {
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
      <Button className="ml-4" onClick={modalToggle.enable}>
        <FormattedMessage {...messages.addToCollection} />
      </Button>
      {userInfo ? (
        <ModalCard
          component={SimpleForm}
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
