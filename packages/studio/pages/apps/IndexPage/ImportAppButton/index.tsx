import {
  Button,
  FileUpload,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
} from '@appsemble/react-components';
import { OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../../../../components/UserProvider/index.js';

export function ImportAppButton({ className }: { readonly className?: string }): ReactNode {
  const { organizations } = useUser();
  const [uploadingImportFile, setUploadingImportFile] = useState<File>(null);

  const navigate = useNavigate();
  const { hash } = useLocation();

  const openModal = useCallback(() => {
    navigate({ hash: 'import' }, { replace: true });
  }, [navigate]);

  const closeModal = useCallback(() => {
    navigate({ hash: null }, { replace: true });
    setUploadingImportFile(null);
  }, [navigate]);

  const active = hash === '#import';

  const organizationIndex = organizations?.findIndex((org) =>
    checkOrganizationRoleOrganizationPermissions(org.role, [OrganizationPermission.CreateApps]),
  );

  const createOrganizations = organizations?.filter((org) =>
    checkOrganizationRoleOrganizationPermissions(org.role, [OrganizationPermission.CreateApps]),
  );

  const defaultValues = {
    importfile: null as File,
    selectedOrganization: organizationIndex,
  };

  const onSubmitImport = useCallback(
    async ({ selectedOrganization }: typeof defaultValues) => {
      const config = {
        headers: {
          'Content-Type': 'application/zip',
        },
      };
      await axios.post(
        `/api/organizations/${organizations[selectedOrganization].id}/apps/import`,
        uploadingImportFile,
        config,
      );
      closeModal();
    },
    [uploadingImportFile, closeModal, organizations],
  );

  const onImportFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUploadingImportFile(event.target.files[0]);
  }, []);
  return (
    <>
      <Button
        className={className}
        disabled={createOrganizations?.length === 0}
        onClick={openModal}
      >
        <FormattedMessage {...messages.importFile} />
      </Button>
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={closeModal}
            submitLabel={<FormattedMessage {...messages.submit} />}
          />
        }
        isActive={active}
        onClose={closeModal}
        onSubmit={onSubmitImport}
        title={<FormattedMessage {...messages.submit} />}
      >
        <SimpleFormError>
          {({ error }) =>
            axios.isAxiosError(error) && error.response?.status === 409 ? (
              <FormattedMessage {...messages.nameConflict} />
            ) : (
              <FormattedMessage {...messages.error} />
            )
          }
        </SimpleFormError>
        <SimpleFormField
          accept="application/zip"
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.import} />}
          fileLabel={uploadingImportFile?.name ?? <FormattedMessage {...messages.noFile} />}
          label={<FormattedMessage {...messages.import} />}
          name="importFile"
          onChange={onImportFileChange}
          required
        />
        <SimpleFormField
          component={SelectField}
          disabled={createOrganizations?.length === 1}
          label={<FormattedMessage {...messages.organization} />}
          name="selectedOrganization"
          required
        >
          {createOrganizations?.map((organization, index) => (
            <option key={organization.id} value={index}>
              {organization.id}
            </option>
          ))}
        </SimpleFormField>
      </ModalCard>
    </>
  );
}
