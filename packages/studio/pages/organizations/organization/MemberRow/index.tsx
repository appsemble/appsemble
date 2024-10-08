import {
  AsyncButton,
  AsyncSelect,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type PredefinedOrganizationRole, predefinedOrganizationRoles } from '@appsemble/types';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type OrganizationMember } from '../../../../types.js';

interface MemberRowProps {
  /**
   * Whether the user may update the roles of members.
   */
  readonly mayUpdateRoles: boolean;

  /**
   * Whether the user may delete members.
   */
  readonly mayDelete: boolean;

  /**
   * The member represented by this row.
   */
  readonly member: OrganizationMember;

  /**
   * This is called when the member data has changed.
   *
   * @param member The member that has been changed.
   */
  readonly onChanged: (member: OrganizationMember) => void;

  /**
   * This is called when the member has been deleted.
   *
   * @param member The member that has been deleted.
   */
  readonly onDeleted: (member: OrganizationMember) => void;

  /**
   * ID of the app's organization
   */
  readonly organizationId: string;

  readonly ownerCount: number;
}

/**
 * A single row for managing an organization member from the members table.
 */
export function MemberRow({
  mayDelete,
  mayUpdateRoles,
  member,
  onChanged,
  onDeleted,
  organizationId,
  ownerCount,
}: MemberRowProps): ReactNode {
  const { id, name, primaryEmail } = member;
  const { formatMessage } = useIntl();
  const push = useMessages();
  const {
    userInfo: { sub },
  } = useUser();

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>, role: string) => {
      const { data } = await axios.put<OrganizationMember>(
        `/api/organizations/${organizationId}/members/${id}/role`,
        {
          role,
        },
      );
      onChanged(data);
    },
    [id, onChanged, organizationId],
  );

  const callDelete = useCallback(async () => {
    await axios.delete(`/api/organizations/${organizationId}/members/${id}`);
    onDeleted(member);

    push({
      body: formatMessage(messages.deleteSuccess, { member: name || primaryEmail }),
      color: 'info',
    });
  }, [formatMessage, id, member, name, onDeleted, organizationId, primaryEmail, push]);

  const deleteMember = useConfirmation({
    title: <FormattedMessage {...messages.deleteMember} />,
    body: (
      <FormattedMessage
        {...messages.deleteConfirmationBody}
        values={{ member: name || primaryEmail }}
      />
    ),
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.deleteMember} />,
    action: callDelete,
  });

  const leaveOrganization = useConfirmation({
    title: <FormattedMessage {...messages.leaving} />,
    body: <FormattedMessage {...messages.leaveConfirmationBody} />,
    cancelLabel: <FormattedMessage {...messages.cancelLabel} />,
    confirmLabel: <FormattedMessage {...messages.leave} />,
    action: callDelete,
  });

  return (
    <tr>
      <td>
        {name ? `${name} (${primaryEmail})` : primaryEmail}
        {id === sub && (
          <span className="ml-2 tag is-success">
            <FormattedMessage {...messages.you} />
          </span>
        )}
      </td>
      <td align="right">
        <AsyncSelect
          className="mr-2"
          disabled={!mayUpdateRoles || (member.role === 'Owner' && ownerCount < 2) || id === sub}
          id={`role-${id}`}
          name="role"
          onChange={onChangeRole}
          value={member.role}
        >
          {predefinedOrganizationRoles.map((r: PredefinedOrganizationRole) => (
            <option key={r} value={r}>
              {formatMessage(messages[r])}
            </option>
          ))}
        </AsyncSelect>
        {id === sub ? (
          <AsyncButton
            color="danger"
            disabled={member.role === 'Owner' && ownerCount < 2}
            icon="sign-out-alt"
            onClick={leaveOrganization}
          >
            <FormattedMessage {...messages.leave} />
          </AsyncButton>
        ) : (
          mayDelete && (
            <AsyncButton
              color="danger"
              icon="trash-alt"
              onClick={deleteMember}
              title={formatMessage(messages.deleteMember)}
            />
          )
        )}
      </td>
    </tr>
  );
}
