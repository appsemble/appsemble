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
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';
import { AnnotationsTable } from '../../teams/team/AnnotationsTable/index.js';
import { Member } from '../index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface MemberRowProperties {
  member: Member;
  onChange: (member: Member) => void;
}

export function MemberRow({ member, onChange }: MemberRowProperties): ReactElement {
  const { app } = useApp();
  const { userInfo } = useUser();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const editModal = useToggle();

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
      event.preventDefault();
      const { value: role } = event.currentTarget;

      try {
        const { data } = await axios.post<Member>(`/api/apps/${app.id}/members/${member.id}`, {
          role,
        });

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: data.name || data.primaryEmail || data.id,
            role,
          }),
        });
        onChange(data);
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [app, formatMessage, member, onChange, push],
  );

  const defaultValues = useMemo(
    () => ({
      annotations: Object.entries(member.properties || {}),
    }),
    [member],
  );

  const editProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const { data } = await axios.post<Member>(`/api/apps/${app.id}/members/${member.id}`, {
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
      <tr key={member.id}>
        <td className={styles.noWrap}>
          <span>
            {member.name
              ? member.primaryEmail
                ? `${member.name} (${member.primaryEmail})`
                : member.name
              : member.primaryEmail || member.id}
          </span>
          <div className="tags is-inline ml-2">
            {member.id === userInfo.sub && (
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
            <AsyncSelect onChange={onChangeRole}>
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
