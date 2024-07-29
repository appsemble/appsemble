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
  appMemberRoles,
  checkOrganizationRoleOrganizationPermissions,
  OrganizationPermission,
} from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';
import { AnnotationsTable } from '../../teams/team/AnnotationsTable/index.js';

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

  const mayUpdateAppMembers = checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
    OrganizationPermission.UpdateAppMembers,
  ]);

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
        const { data } = await axios.post<AppMemberInfo>(
          `/api/apps/${app.id}/members/${member.sub}`,
          {
            role,
            properties: Object.fromEntries(defaultValues.annotations),
          },
        );

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
    [app.id, defaultValues.annotations, formatMessage, member.sub, onChange, push],
  );

  const editProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const { data } = await axios.post<AppMemberInfo>(
        `/api/apps/${app.id}/members/${member.sub}`,
        {
          role: member.role,
          properties: Object.fromEntries(annotations),
        },
      );
      editModal.disable();
      onChange(data);
    },
    [app, member, editModal, onChange],
  );

  const roleKeys = Array.from(
    new Set([...Object.keys(app?.definition.security?.roles), ...Object.keys(appMemberRoles)]),
  );

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
            <AsyncSelect disabled={!mayUpdateAppMembers} onChange={onChangeRole}>
              {roleKeys.map((role) => (
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
