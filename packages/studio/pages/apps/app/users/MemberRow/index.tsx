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
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { useApp } from '../../index.js';
import { AnnotationsTable } from '../../teams/team/AnnotationsTable/index.js';
import { type AppMember } from '../index.js';

interface AppMemberRowProperties {
  readonly member: AppMember;
  readonly onChange: (member: AppMember) => void;
}

export function MemberRow({ member, onChange }: AppMemberRowProperties): ReactNode {
  const { app } = useApp();
  const { organizations, userInfo } = useUser();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const editModal = useToggle();

  const organization = organizations?.find((org) => org.id === app?.OrganizationId);
  const editRolesPermission = checkRole(organization.role, Permission.ManageRoles);

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
        const { data } = await axios.post<AppMember>(
          `/api/apps/${app.id}/members/${member.userId}`,
          {
            role,
            properties: Object.fromEntries(defaultValues.annotations),
          },
        );

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: data.name || data.primaryEmail || data.memberId,
            role,
          }),
        });
        onChange(data);
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [app.id, defaultValues.annotations, formatMessage, member.userId, onChange, push],
  );

  const editProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const { data } = await axios.post<AppMember>(`/api/apps/${app.id}/members/${member.userId}`, {
        role: member.role,
        properties: Object.fromEntries(annotations),
      });
      editModal.disable();
      onChange(data);
    },
    [app, member, editModal, onChange],
  );

  return (
    <>
      <tr key={member.memberId}>
        <td className={styles.noWrap}>
          <span>
            {member.name
              ? member.primaryEmail
                ? `${member.name} (${member.primaryEmail})`
                : member.name
              : member.primaryEmail || member.memberId}
          </span>
          <div className="tags is-inline ml-2">
            {member.userId === userInfo.sub && (
              <span className="tag is-success">
                <FormattedMessage {...messages.you} />
              </span>
            )}
          </div>
        </td>
        <td className={styles.propertyRow}>
          <div className="is-flex is-justify-content-space-between is-flex-grow-1">
            {member.properties && Object.keys(member.properties).length ? (
              <span className={styles.property}>{JSON.stringify(member.properties)}</span>
            ) : (
              <span className="is-unselectable has-text-grey">
                (<FormattedMessage {...messages.empty} />)
              </span>
            )}
            <Button color="primary" icon="edit" onClick={editModal.enable} />
          </div>
        </td>
        <td className="has-text-right">
          <div className="control is-inline">
            <AsyncSelect disabled={!editRolesPermission} onChange={onChangeRole}>
              {Object.keys(app.definition.security.roles).map((role) => (
                <option key={role} selected={role === member.role} value={role}>
                  {app.messages?.app?.[`app.roles.${role}`] || role}
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
        onSubmit={editProperties}
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
