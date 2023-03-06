import {
  AsyncButton,
  AsyncSelect,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { Role, roles } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useUser } from '../../../../components/UserProvider/index.js';
import { Member } from '../../../../types.js';
import { messages } from './messages.js';

interface MemberRowProps {
  /**
   * Whether the user may delete members.
   */
  mayEdit: boolean;

  /**
   * Whether the user has the permission to edit other user’s roles.
   */
  mayEditRole: boolean;

  /**
   * The member represented by this row.
   */
  member: Member;

  /**
   * This is called when the member data has changed.
   *
   * @param member The member that has been changed.
   */
  onChanged: (member: Member) => void;

  /**
   * This is called when the member has been deleted.
   *
   * @param member The member that has been deleted.
   */
  onDeleted: (member: Member) => void;

  ownerCount: number;
}

/**
 * A single row for managing an organization member from the members table.
 */
export function MemberRow({
  mayEdit,
  mayEditRole,
  member,
  onChanged,
  onDeleted,
  ownerCount,
}: MemberRowProps): ReactElement {
  const { id, name, primaryEmail } = member;
  const { formatMessage } = useIntl();
  const { organizationId } = useParams<{ organizationId: string }>();
  const push = useMessages();
  const {
    userInfo: { sub },
  } = useUser();

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>, role: string) => {
      const { data } = await axios.put<Member>(
        `/api/organizations/${organizationId}/members/${id}/role`,
        { role },
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
          disabled={!mayEditRole || (member.role === 'Owner' && ownerCount < 2) || id === sub}
          id={`role-${id}`}
          name="role"
          onChange={onChangeRole}
          value={member.role}
        >
          {Object.keys(roles).map((r: Role) => (
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
          mayEdit && (
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
