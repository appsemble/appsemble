import {
  AsyncSelect,
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Title,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type AppMemberInfo } from '@appsemble/types';
import {
  assignAppMemberProperties,
  checkOrganizationRoleOrganizationPermissions,
  getAppRoles,
  OrganizationPermission,
} from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AnnotationsTable } from '../../../../../components/AnnotationsTable/index.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';

interface AppMemberRowProperties {
  readonly member: AppMemberInfo;
  readonly onChange: (member: AppMemberInfo) => void;
}

export function MemberRow({ member, onChange }: AppMemberRowProperties): ReactNode {
  const { app } = useApp();
  const { organizations, userInfo } = useUser();
  const { formatMessage } = useIntl();

  const push = useMessages();

  const editModal = useToggle();

  const userOrganization = organizations?.find((org) => org.id === app?.OrganizationId);

  const mayUpdateAppMemberRoles = checkOrganizationRoleOrganizationPermissions(
    userOrganization.role,
    [OrganizationPermission.UpdateAppMemberRoles],
  );

  const mayPatchAppMemberProperties = checkOrganizationRoleOrganizationPermissions(
    userOrganization.role,
    [OrganizationPermission.PatchAppMemberProperties],
  );

  const defaultValues = useMemo(
    () => ({
      annotations: Object.entries(
        Object.fromEntries(
          Object.entries(member.properties ?? {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ]),
        ) || {},
      ),
    }),
    [member],
  );

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
      event.preventDefault();
      const { value: role } = event.currentTarget;

      try {
        const { data } = await axios.put<AppMemberInfo>(`/api/app-members/${member.sub}/role`, {
          role,
        });

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: data.name || data.email || data.sub,
            role,
          }),
        });
        onChange(data);
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [formatMessage, member.sub, onChange, push],
  );

  const onUpdateProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const formData = new FormData();
      assignAppMemberProperties(Object.fromEntries(annotations), formData);

      const { data } = await axios.patch<AppMemberInfo>(
        `/api/app-members/${member.sub}/properties`,
        formData,
      );
      editModal.disable();
      onChange(data);
    },
    [member, editModal, onChange],
  );

  const roleKeys = getAppRoles(app);

  return (
    <>
      <tr key={member.sub}>
        <td className={styles.noWrap}>
          <span>
            {member.name
              ? member.email
                ? `${member.name} (${member.email})`
                : member.name
              : member.email || member.sub}
          </span>
          <div className="tags is-inline ml-2">
            {member.sub === userInfo.sub && (
              <span className="tag is-success">
                <FormattedMessage {...messages.you} />
              </span>
            )}
          </div>
        </td>
        <td className={styles.propertyRow}>
          <div className="is-flex is-justify-content-space-between is-flex-grow-1">
            {member.properties ? (
              <span className={styles.property}>{JSON.stringify(member.properties)}</span>
            ) : (
              <span className="is-unselectable has-text-grey">
                (<FormattedMessage {...messages.empty} />)
              </span>
            )}
            <Button
              color="primary"
              disabled={!mayPatchAppMemberProperties}
              icon="edit"
              onClick={editModal.enable}
            />
          </div>
        </td>
        <td className="has-text-right">
          <div className="control is-inline">
            <AsyncSelect
              defaultValue={member.role}
              disabled={!mayUpdateAppMemberRoles}
              onChange={onChangeRole}
            >
              {roleKeys.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </AsyncSelect>
          </div>
        </td>
      </tr>
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
            onClose={editModal.disable}
            submitLabel={<FormattedMessage {...messages.editButton} />}
          />
        }
        isActive={editModal.enabled}
        onClose={editModal.disable}
        onSubmit={onUpdateProperties}
        title={<FormattedMessage {...messages.editProperties} />}
      >
        <Title className="mb-0" level={5}>
          <FormattedMessage {...messages.properties} />
        </Title>
        <SimpleFormField component={AnnotationsTable} name="annotations" />
      </ModalCard>
    </>
  );
}
