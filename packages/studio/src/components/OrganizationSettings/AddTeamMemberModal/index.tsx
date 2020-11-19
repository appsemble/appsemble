import {
  CardFooterButton,
  Form,
  Modal,
  SelectField,
  Toggle,
  useData,
} from '@appsemble/react-components';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { Member, TeamMember } from '../../../types';
import { AsyncDataView } from '../../AsyncDataView';
import { messages } from './messages';

interface AddTeamMemberModalProps {
  teamMembers: TeamMember[];
  toggle: Toggle;
  onAdd: (id: string) => Promise<void>;
}

export function AddTeamMemberModal({
  onAdd,
  teamMembers,
  toggle,
}: AddTeamMemberModalProps): ReactElement {
  const { organizationId } = useParams<{ organizationId: string }>();
  const result = useData<Member[]>(`/api/organizations/${organizationId}/members`);
  const [selectedMember, setSelectedMember] = useState(result?.data?.[0]?.id);

  const onSubmit = useCallback(() => {
    onAdd(
      selectedMember ||
        result?.data?.find((member) => !teamMembers.map((tm) => tm.id).includes(member.id))?.id,
    );
  }, [onAdd, result.data, selectedMember, teamMembers]);

  const handleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const memberId = event.currentTarget.value;
    setSelectedMember(memberId);
  }, []);

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
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.addingMember} />}
    >
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noMembers} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(members) => (
          <SelectField
            id="id"
            label={<FormattedMessage {...messages.member} />}
            onChange={handleChange}
            value={selectedMember}
          >
            {members
              .filter((member) => !teamMembers.map((tm) => tm.id).includes(member.id))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.primaryEmail || member.id}
                </option>
              ))}
          </SelectField>
        )}
      </AsyncDataView>
    </Modal>
  );
}
