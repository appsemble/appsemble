import { assignAppMemberProperties, getAppRoles } from '@appsemble/lang-sdk';
import {
  AsyncButton,
  AsyncSelect,
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Title,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { type AppMemberInfo } from '@appsemble/types';
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

  /**
   * Whether the user may update the roles of members.
   */
  readonly mayUpdateRoles: boolean;

  /**
   * Whether the user may patch the properties of members.
   */
  readonly mayPatchProperties: boolean;

  /**
   * Whether the user may delete members.
   */
  readonly mayDelete: boolean;

  /**
   * This is called when the member data has changed.
   *
   * @param member The member that has been changed.
   */
  readonly onChanged: (member: AppMemberInfo) => void;

  /**
   * This is called when the member has been deleted.
   *
   * @param member The member that has been deleted.
   */
  readonly onDeleted: (member: AppMemberInfo) => void;
}

export function MemberRow({
  mayDelete,
  mayPatchProperties,
  mayUpdateRoles,
  member,
  onChanged,
  onDeleted,
}: AppMemberRowProperties): ReactNode {
  const { demo, email, name, properties, role, sub } = member;
  const {
    userInfo: { email: currentUserEmail },
  } = useUser();
  const { app } = useApp();
  const { formatMessage } = useIntl();

  const push = useMessages();

  const editModal = useToggle();

  const defaultValues = useMemo(
    () => ({
      annotations: Object.entries(
        Object.fromEntries(
          Object.entries(properties ?? {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ]),
        ) || {},
      ),
    }),
    [properties],
  );

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
      event.preventDefault();
      const { value } = event.currentTarget;

      try {
        const { data } = await axios.put<AppMemberInfo>(
          `/api/apps/${app.id}/app-members/${sub}/role`,
          {
            role: value,
          },
        );

        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: data.name || data.email || data.sub,
            role: value,
          }),
        });
        onChanged(data);
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
      }
    },
    [app.id, sub, push, formatMessage, onChanged],
  );

  const onUpdateProperties = useCallback(
    async ({ annotations }: typeof defaultValues) => {
      const formData = new FormData();
      assignAppMemberProperties(Object.fromEntries(annotations), formData);

      const { data } = await axios.put<AppMemberInfo>(
        `/api/apps/${app.id}/app-members/${sub}/properties`,
        formData,
      );
      editModal.disable();
      onChanged(data);
    },
    [app.id, sub, editModal, onChanged],
  );

  const callDelete = useCallback(async () => {
    await axios.delete(`/api/apps/${app.id}/app-members/${sub}`);
    onDeleted(member);

    push({
      body: formatMessage(messages.deleteSuccess, { member: name || email }),
      color: 'info',
    });
  }, [app.id, sub, onDeleted, member, push, formatMessage, name, email]);

  const deleteMember = useConfirmation({
    title: <FormattedMessage {...messages.deleteMember} />,
    body: (
      <FormattedMessage {...messages.deleteConfirmationBody} values={{ member: name || email }} />
    ),
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteMember} />,
    action: callDelete,
  });

  const roleKeys = getAppRoles(app.definition.security);

  return (
    <>
      <tr key={sub}>
        <td className={styles.noWrap}>
          <span>{name ? (email ? `${name} (${email})` : name) : email || sub}</span>
          {email === currentUserEmail ? (
            <span className="tag is-success ml-1">
              <FormattedMessage {...messages.you} />
            </span>
          ) : null}
        </td>
        <td className={styles.propertyRow}>
          <div className="is-flex is-justify-content-space-between is-flex-grow-1">
            {properties ? (
              <span className={styles.property}>{JSON.stringify(properties)}</span>
            ) : (
              <span className="is-unselectable has-text-grey">
                (<FormattedMessage {...messages.empty} />)
              </span>
            )}
            <Button
              color="primary"
              disabled={!mayPatchProperties}
              icon="edit"
              onClick={editModal.enable}
            />
          </div>
        </td>
        <td className={styles.noWrap}>
          <span>{String(demo)}</span>
        </td>
        <td className="has-text-right">
          <div className="control is-inline">
            <AsyncSelect defaultValue={role} disabled={!mayUpdateRoles} onChange={onChangeRole}>
              {roleKeys.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </AsyncSelect>
          </div>
        </td>
        <td align="right">
          {mayDelete ? (
            <AsyncButton
              color="danger"
              icon="trash-alt"
              onClick={deleteMember}
              title={formatMessage(messages.deleteMember)}
            />
          ) : null}
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
