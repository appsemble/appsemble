import {
  Button,
  CardFooterButton,
  Content,
  FormButtons,
  Icon,
  Loader,
  Message,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
  Table,
  Title,
  useMessages,
} from '@appsemble/react-components';
import type { Organization } from '@appsemble/types';
import { normalize, Permission, roles } from '@appsemble/utils';
import axios from 'axios';
import React, { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import type { Member, Role } from '../../types';
import { checkRole } from '../../utils/checkRole';
import { HelmetIntl } from '../HelmetIntl';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

interface Invite {
  email: string;
}

interface LocalOrganization extends Organization {
  members: Member[];
  invites: Invite[];
}

function calculateOrganizationId(
  name: string,
  newValues: Organization,
  oldValues: Organization,
): Organization {
  if (name !== 'name') {
    return newValues;
  }
  if (normalize(oldValues.name) === oldValues.id) {
    return {
      ...newValues,
      id: normalize(newValues.name).slice(0, 30),
    };
  }
  return newValues;
}

export function OrganizationsSettings(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const {
    organizations: userOrganizations,
    setOrganizations: setUserOrganizations,
    userInfo,
  } = useUser();

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<LocalOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [submittingRole, setSubmittingRole] = useState<string>();
  const [removingMember, setRemovingMember] = useState<string>();
  const [removingInvite, setRemovingInvite] = useState<Invite>();

  const onOrganizationChange = useCallback(
    async (event) => {
      setLoading(true);
      const organizationId = event.currentTarget.value;
      const { data: members } = await axios.get(`/api/organizations/${organizationId}/members`);
      const { data: invites } = await axios.get(`/api/organizations/${organizationId}/invites`);
      setSelectedOrganization(organizationId);
      setOrganizations(
        organizations.map((org) =>
          org.id === organizationId ? { ...org, members, invites } : org,
        ),
      );
      setLoading(false);
    },
    [organizations],
  );

  const onSubmitNewOrganization = useCallback(
    async (newOrg: Organization) => {
      try {
        const { data: organization } = await axios.post('/api/organizations', newOrg);

        setSelectedOrganization(organization.id);
        setOrganizations([...organizations, organization]);
        setUserOrganizations([
          ...userOrganizations,
          { id: organization.id, name: organization.name, role: 'Owner' },
        ]);

        push({
          body: formatMessage(messages.createOrganizationSuccess, {
            organization: organization.name,
          }),
          color: 'success',
        });
      } catch (error) {
        if (error?.response?.status === 409) {
          push(formatMessage(messages.createOrganizationConflict));
        } else {
          push(formatMessage(messages.createOrganizationError));
        }
      }
    },
    [formatMessage, organizations, push, setUserOrganizations, userOrganizations],
  );

  const onInviteMember = useCallback(
    async ({ email }: Invite) => {
      const organization = organizations.find((o) => o.id === selectedOrganization);

      if (organization.members.some((m) => m.primaryEmail === email)) {
        push({
          body: formatMessage(messages.existingMemberWarning),
          color: 'warning',
        });
        return;
      }

      try {
        await axios.post(`/api/organizations/${selectedOrganization}/invites`, { email });
        setOrganizations(
          organizations.map((o) =>
            o.id === selectedOrganization
              ? { ...organization, invites: [...organization.invites, { email }] }
              : o,
          ),
        );

        push({
          body: formatMessage(messages.inviteMemberSuccess, { email }),
          color: 'success',
        });
      } catch (error) {
        switch (error.response?.status) {
          case 404:
            push(formatMessage(messages.inviteMemberNotFound));
            break;
          case 406:
            push(formatMessage(messages.inviteMemberNotVerified));
            break;
          case 409:
            push(formatMessage(messages.inviteMemberConflict));
            break;
          default:
            push(formatMessage(messages.inviteMemberError));
        }
      }
    },
    [formatMessage, organizations, push, selectedOrganization],
  );

  const resendInvitation = useCallback(
    async (invite) => {
      await axios.post(`/api/organizations/${selectedOrganization}/invites/resend`, {
        email: invite.email,
      });
      push({ body: formatMessage(messages.resendInvitationSent), color: 'info' });
    },
    [formatMessage, push, selectedOrganization],
  );

  const onChangeRole = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>, userId: string) => {
      event.preventDefault();
      const role = event.currentTarget.value as Role;
      setSubmittingRole(userId);

      try {
        await axios.put(`/api/organizations/${selectedOrganization}/members/${userId}/role`, {
          role,
        });
        setSubmittingRole(null);
        setOrganizations(
          organizations.map((organization) =>
            organization.id === selectedOrganization
              ? {
                  ...organization,
                  members: organization.members.map((member) =>
                    member.id === userId ? { ...member, role } : member,
                  ),
                }
              : organization,
          ),
        );
        const member = organizations
          .find((org) => org.id === selectedOrganization)
          .members.find((m) => m.id === userId);
        push({
          color: 'success',
          body: formatMessage(messages.changeRoleSuccess, {
            name: member.name || member.primaryEmail || member.id,
            role,
          }),
        });
      } catch {
        push({ body: formatMessage(messages.changeRoleError) });
        setSubmittingRole(null);
      }
    },
    [formatMessage, organizations, push, selectedOrganization],
  );

  const onLeaveOrganization = useCallback(async () => {
    await axios.delete(`/api/organizations/${selectedOrganization}/members/${userInfo.sub}`);

    const organization = organizations.find((o) => o.id === selectedOrganization);
    const newOrganizations = organizations.filter((o) => o.id !== selectedOrganization);

    setRemovingMember(null);
    setSelectedOrganization(newOrganizations[0]?.id);
    setOrganizations(newOrganizations);

    push({
      body: formatMessage(messages.leaveOrganizationSuccess, {
        organization: organization.id,
      }),
      color: 'info',
    });
  }, [formatMessage, organizations, push, selectedOrganization, userInfo.sub]);

  const onRemoveMember = useCallback(async () => {
    await axios.delete(`/api/organizations/${selectedOrganization}/members/${removingMember}`);

    const organization = organizations.find((o) => o.id === selectedOrganization);
    const filteredMembers = organization.members.filter((m) => m.id !== removingMember);

    setRemovingMember(null);
    setOrganizations(
      organizations.map((o) =>
        o.id === organization.id ? { ...organization, members: filteredMembers } : o,
      ),
    );

    push({
      body:
        removingMember === userInfo.sub
          ? formatMessage(messages.leaveOrganizationSuccess, { organization: organization.id })
          : formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  }, [formatMessage, organizations, push, removingMember, selectedOrganization, userInfo.sub]);

  const onRemoveInvite = useCallback(async () => {
    const organization = organizations.find((o) => o.id === selectedOrganization);
    const filteredInvites = organization.invites.filter((m) => m.email !== removingInvite.email);

    await axios.delete(`/api/organizations/${selectedOrganization}/invites`, {
      data: removingInvite,
    });

    setRemovingInvite(null);
    setOrganizations(
      organizations.map((o) =>
        o.id === organization.id ? { ...organization, invites: filteredInvites } : o,
      ),
    );

    push({
      body: formatMessage(messages.removeInviteSuccess),
      color: 'info',
    });
  }, [formatMessage, organizations, push, removingInvite, selectedOrganization]);

  const onCloseDeleteDialog = useCallback(() => {
    setRemovingMember(null);
  }, []);

  const onCloseInviteDialog = useCallback(() => {
    setRemovingInvite(null);
  }, []);

  useEffect(() => {
    (async () => {
      let selected = '';

      let { data: orgs } = await axios.get<LocalOrganization[]>('/api/user/organizations');
      if (orgs.length) {
        selected = orgs[0].id;
        const { data: members } = await axios.get(`/api/organizations/${selected}/members`);
        const { data: invites } = await axios.get(`/api/organizations/${selected}/invites`);
        orgs = orgs.map((org) =>
          org.id === selected ? { ...org, members, invites } : { ...org, members: [], invites: [] },
        );
        setOrganizations(orgs);
      }

      setSelectedOrganization(selected);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const organization = organizations.find((o) => o.id === selectedOrganization);
  const { role } = organization?.members.find((u) => u.id === userInfo.sub) || {};
  const canInviteMembers = role && checkRole(role, Permission.InviteMember);
  const canManageMembers = role && checkRole(role, Permission.ManageMembers);
  const canManageRoles = role && checkRole(role, Permission.ManageRoles);

  return (
    <>
      <HelmetIntl title={messages.title} />
      <Content>
        <Title>
          <FormattedMessage {...messages.createOrganization} />
        </Title>
        {!userInfo.email_verified && (
          <Message color="warning">
            <FormattedMessage
              {...messages.unverified}
              values={{
                verifyAccount: (
                  <Link to="user">
                    <FormattedMessage {...messages.verifyAccount} />
                  </Link>
                ),
              }}
            />
          </Message>
        )}
        <SimpleForm
          defaultValues={{ id: '', name: '' }}
          onSubmit={onSubmitNewOrganization}
          preprocess={calculateOrganizationId}
          resetOnSuccess
        >
          <SimpleInput
            disabled={!userInfo.email_verified}
            iconLeft="briefcase"
            label={<FormattedMessage {...messages.organizationName} />}
            name="name"
            placeholder={formatMessage(messages.organizationName)}
          />
          <SimpleInput
            disabled={!userInfo.email_verified}
            iconLeft="at"
            label={<FormattedMessage {...messages.organizationId} />}
            maxLength={30}
            name="id"
            placeholder={formatMessage(messages.organizationId)}
            preprocess={(value) => normalize(value, false)}
            required
          />
          <FormButtons>
            <SimpleSubmit disabled={!userInfo.email_verified}>
              <FormattedMessage {...messages.create} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>

      {Boolean(organizations.length) && organization && (
        <>
          <hr />
          <Content>
            <Title>
              <FormattedMessage {...messages.manageOrganization} />
            </Title>
            <Select
              disabled={organizations.length === 1}
              label={<FormattedMessage {...messages.selectedOrganization} />}
              name="selectedOrganization"
              onChange={onOrganizationChange}
              value={selectedOrganization}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>

            {canInviteMembers && (
              <SimpleForm defaultValues={{ email: '' }} onSubmit={onInviteMember}>
                <SimpleInput
                  iconLeft="envelope"
                  label={<FormattedMessage {...messages.addMemberEmail} />}
                  name="email"
                  placeholder={formatMessage(messages.email)}
                  required
                  type="email"
                />
                <FormButtons>
                  <SimpleSubmit>
                    <FormattedMessage {...messages.inviteMember} />
                  </SimpleSubmit>
                </FormButtons>
              </SimpleForm>
            )}
          </Content>

          <Title level={5}>
            <FormattedMessage
              {...messages.organizationMembers}
              values={{ organization: organization.name }}
            />
          </Title>
          <Table>
            <thead>
              <tr>
                <th>
                  <FormattedMessage {...messages.member} />
                </th>
                <th className="has-text-right">
                  <FormattedMessage {...messages.actions} />
                </th>
              </tr>
            </thead>
            <tbody>
              {organization.members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <span>{member.name || member.primaryEmail || member.id}</span>
                    <div className="tags is-inline ml-2">
                      {member.id === userInfo.sub && (
                        <span className="tag is-success">
                          <FormattedMessage {...messages.you} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`has-text-right ${styles.actionsCell}`}>
                    {canManageRoles ? (
                      <Select
                        defaultValue={member.role}
                        disabled={member.id === userInfo.sub || submittingRole === member.id}
                        fullwidth={false}
                        loading={submittingRole === member.id}
                        name={`role-${member.id}`}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          onChangeRole(event, member.id)
                        }
                      >
                        {Object.keys(roles).map((r: Role) => (
                          <option key={r} value={r}>
                            {formatMessage(messages[r])}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span className="mr-2">
                        <FormattedMessage {...messages[member.role]} />
                      </span>
                    )}
                    <div className="field is-grouped is-grouped-right">
                      {member.id === userInfo.sub &&
                        organization.members.length > 1 &&
                        organization.members.some((m) =>
                          checkRole(m.role, Permission.ManageRoles),
                        ) && (
                          <p className="control">
                            <Button
                              color="danger"
                              icon="sign-out-alt"
                              onClick={() => setRemovingMember(member.id)}
                            />
                          </p>
                        )}
                      {member.id !== userInfo.sub && canManageMembers && (
                        <p className="control">
                          <Button
                            color="danger"
                            icon="trash-alt"
                            onClick={() => setRemovingMember(member.id)}
                            type="button"
                          />
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {organization.invites.map((invite) => (
                <tr key={invite.email}>
                  <td>{invite.email}</td>
                  <td className="has-text-right">
                    {canInviteMembers ? (
                      <div className="field ml-2 is-grouped is-grouped-right">
                        <p className="control">
                          <Button
                            className="control is-outlined"
                            onClick={() => resendInvitation(invite)}
                          >
                            <FormattedMessage {...messages.resendInvitation} />
                          </Button>
                        </p>
                        <p className="control">
                          <Button color="danger" onClick={() => setRemovingInvite(invite)}>
                            <Icon icon="trash-alt" size="small" />
                          </Button>
                        </p>
                      </div>
                    ) : (
                      <FormattedMessage {...messages.invited} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal
        footer={
          <>
            <CardFooterButton onClick={onCloseInviteDialog}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="danger" onClick={onRemoveInvite}>
              <FormattedMessage {...messages.removeInvite} />
            </CardFooterButton>
          </>
        }
        isActive={Boolean(removingInvite)}
        onClose={onCloseInviteDialog}
        title={<FormattedMessage {...messages.removeInviteWarningTitle} />}
      >
        <FormattedMessage {...messages.removeInviteWarning} />
      </Modal>

      <Modal
        footer={
          <>
            <CardFooterButton onClick={onCloseDeleteDialog}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton
              color="danger"
              onClick={removingMember === userInfo.sub ? onLeaveOrganization : onRemoveMember}
            >
              {removingMember === userInfo.sub ? (
                <FormattedMessage {...messages.leaveOrganization} />
              ) : (
                <FormattedMessage {...messages.removeMember} />
              )}
            </CardFooterButton>
          </>
        }
        isActive={Boolean(removingMember)}
        onClose={onCloseDeleteDialog}
        title={
          removingMember === userInfo.sub ? (
            <FormattedMessage {...messages.leaveOrganizationWarningTitle} />
          ) : (
            <FormattedMessage {...messages.removeMemberWarningTitle} />
          )
        }
      >
        {removingMember === userInfo.sub ? (
          <FormattedMessage {...messages.leaveOrganizationWarning} />
        ) : (
          <FormattedMessage {...messages.removeMemberWarning} />
        )}
      </Modal>
    </>
  );
}
