import {
  Button,
  CardFooterButton,
  CheckboxField,
  DateTimeField,
  FormOutput,
  Loader,
  Message,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  useConfirmation,
  useData,
  useSimpleForm,
  useToggle,
} from '@appsemble/react-components';
import {
  OrganizationPermission,
  PredefinedOrganizationRole,
  predefinedOrganizationRoles,
} from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions, scopes } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { HeaderControl } from '../../../../components/HeaderControl/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type OrganizationServiceAccount } from '../../../../types.js';
import { messages as credentialMessages } from '../../../settings/client-credentials/messages.js';
import { messages as roleMessages } from '../MemberRow/messages.js';

type FormValues = Record<(typeof scopes)[number], boolean> &
  Pick<OrganizationServiceAccount, 'description' | 'expires' | 'role'>;

/**
 * The footer of the create form, which requires at least one scope.
 *
 * @param props The callback to close the form.
 * @returns The form footer.
 */
function CreateFooter({ onClose }: { readonly onClose: () => void }): ReactNode {
  const { values } = useSimpleForm();
  return (
    <SimpleModalFooter
      cancelLabel={<FormattedMessage {...credentialMessages.cancel} />}
      disabled={!scopes.some((scope) => values[scope])}
      onClose={onClose}
      submitLabel={<FormattedMessage {...credentialMessages.submit} />}
    />
  );
}

/**
 * The service accounts of an organization, which Owners create and revoke.
 */
export function ServiceAccounts(): ReactNode {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();
  const {
    data: serviceAccounts,
    error,
    loading,
    setData: setServiceAccounts,
  } = useData<OrganizationServiceAccount[]>(
    `/api/organizations/${organizationId}/service-accounts`,
  );
  const [credentials, setCredentials] = useState<string>(null);
  const modal = useToggle();
  const mayManage = checkOrganizationRoleOrganizationPermissions(
    organizations?.find((organization) => organization.id === organizationId)?.roles ?? [],
    [OrganizationPermission.UpdateOrganizations],
  );

  const closeModal = useCallback(() => {
    modal.disable();
    // The modal closing animation takes 300ms.
    setTimeout(() => setCredentials(null), 300);
  }, [modal]);

  const create = useCallback(
    async ({ description, expires, role, ...values }: FormValues) => {
      const { data } = await axios.post<OrganizationServiceAccount>(
        `/api/organizations/${organizationId}/service-accounts`,
        {
          description,
          expires: expires ? new Date(expires) : undefined,
          role,
          scopes: scopes.filter((scope) => values[scope]),
        },
      );
      setCredentials(`${data.id}:${data.secret}`);
      setServiceAccounts((accounts) => [...accounts, data]);
    },
    [organizationId, setServiceAccounts],
  );

  const revoke = useConfirmation({
    title: <FormattedMessage {...messages.revokeTitle} />,
    body: <FormattedMessage {...messages.revokeBody} />,
    cancelLabel: <FormattedMessage {...credentialMessages.cancel} />,
    confirmLabel: <FormattedMessage {...credentialMessages.revoke} />,
    async action(serviceAccount: OrganizationServiceAccount) {
      await axios.delete(
        `/api/organizations/${organizationId}/service-accounts/${serviceAccount.id}`,
      );
      setServiceAccounts((accounts) => accounts.filter(({ id }) => id !== serviceAccount.id));
    },
  });

  return (
    <>
      <HeaderControl
        className="mt-5"
        control={
          mayManage ? (
            <Button onClick={modal.enable}>
              <FormattedMessage {...messages.create} />
            </Button>
          ) : null
        }
        level={4}
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      <p className="content">
        <FormattedMessage {...messages.explanation} />
      </p>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message color="danger">
          <FormattedMessage {...messages.loadError} />
        </Message>
      ) : serviceAccounts.length ? (
        <Table>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...credentialMessages.description} />
              </th>
              <th>
                <FormattedMessage {...messages.role} />
              </th>
              <th>
                <FormattedMessage {...credentialMessages.scope} />
              </th>
              <th colSpan={mayManage ? 2 : 1}>
                <FormattedMessage {...credentialMessages.expires} />
              </th>
            </tr>
          </thead>
          <tbody>
            {serviceAccounts.map((serviceAccount) => (
              <tr key={serviceAccount.id}>
                <td>{serviceAccount.description}</td>
                <td>{formatMessage(roleMessages[serviceAccount.role])}</td>
                <td>{serviceAccount.scopes.join(', ')}</td>
                <td>
                  {serviceAccount.expires ? (
                    <FormattedDate value={serviceAccount.expires} />
                  ) : (
                    <FormattedMessage {...credentialMessages.never} />
                  )}
                </td>
                {mayManage ? (
                  <td align="right">
                    <Button color="danger" onClick={() => revoke(serviceAccount)}>
                      <FormattedMessage {...credentialMessages.revoke} />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>
          <FormattedMessage {...messages.empty} />
        </p>
      )}
      <ModalCard
        component={SimpleForm}
        defaultValues={{
          description: '',
          expires: '',
          role: PredefinedOrganizationRole.Member,
          ...Object.fromEntries(scopes.map((scope) => [scope, false])),
        }}
        footer={
          credentials ? (
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...credentialMessages.close} />
            </CardFooterButton>
          ) : (
            <CreateFooter onClose={closeModal} />
          )
        }
        isActive={modal.enabled}
        onClose={closeModal}
        onSubmit={create}
        resetOnSuccess
        title={<FormattedMessage {...messages.create} />}
      >
        {credentials ? (
          <FormOutput
            copyErrorMessage={formatMessage(credentialMessages.copiedError)}
            copySuccessMessage={formatMessage(credentialMessages.copiedSuccess)}
            help={<FormattedMessage {...credentialMessages.credentialsHelp} />}
            label={<FormattedMessage {...credentialMessages.credentials} />}
            name="clientCredentials"
            value={credentials}
          />
        ) : (
          <>
            <SimpleFormField
              help={<FormattedMessage {...credentialMessages.descriptionHelp} />}
              label={<FormattedMessage {...credentialMessages.description} />}
              maxLength={50}
              name="description"
              required
            />
            <SimpleFormField
              component={SelectField}
              label={<FormattedMessage {...messages.role} />}
              name="role"
              required
            >
              {predefinedOrganizationRoles
                .filter((role) => role !== PredefinedOrganizationRole.Owner)
                .map((role) => (
                  <option key={role} value={role}>
                    {formatMessage(roleMessages[role])}
                  </option>
                ))}
            </SimpleFormField>
            <SimpleFormField
              component={DateTimeField}
              help={<FormattedMessage {...credentialMessages.expiresHelp} />}
              iso
              label={<FormattedMessage {...credentialMessages.expires} />}
              name="expires"
              type="date"
            />
            {scopes.map((scope) => (
              <SimpleFormField
                component={CheckboxField}
                key={scope}
                label={scope}
                name={scope}
                title={<FormattedMessage {...credentialMessages[scope]} />}
              />
            ))}
          </>
        )}
      </ModalCard>
    </>
  );
}
