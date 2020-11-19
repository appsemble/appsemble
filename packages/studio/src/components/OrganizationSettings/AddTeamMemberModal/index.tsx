import {
  CardFooterButton,
  Form,
  FormComponent,
  Loader,
  Modal,
  Select,
  Toggle,
  useData,
} from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { Member, TeamMember } from '../../../types';
import { messages } from './messages';

interface AddTeamMemberModalProps {
  teamMembers: TeamMember[];
  toggle: Toggle;
}

export function AddTeamMemberModal({ teamMembers, toggle }: AddTeamMemberModalProps): ReactElement {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data: members, loading } = useData<Member[]>(
    `/api/organizations/${organizationId}/members`,
  );
  const nonTeamMembers = members?.filter(
    (member) => !teamMembers.map((tm) => tm.id).includes(member.id),
  );

  return (
    <Modal
      component={Form}
      footer={
        <>
          <CardFooterButton onClick={toggle.disable}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="primary" type="submit">
            <FormattedMessage {...messages.addMember} />
          </CardFooterButton>
        </>
      }
      isActive={toggle.enabled}
      onClose={toggle.disable}
      onSubmit={() => {}}
      title={<FormattedMessage {...messages.addingMember} />}
    >
      {loading ? (
        <Loader />
      ) : (
        <FormComponent id="id" label={<FormattedMessage {...messages.member} />}>
          <Select>
            {nonTeamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.primaryEmail || member.id}
              </option>
            ))}
          </Select>
        </FormComponent>
      )}
    </Modal>
  );
}
