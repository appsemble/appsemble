import {
  CardFooterButton,
  Icon,
  Loader,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { normalize, permissions, roles } from '@appsemble/utils';
import axios from 'axios';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useUser from '../../hooks/useUser';
import { Member, Role } from '../../types';
import checkRole from '../../utils/checkRole';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './OrganizationsSettings.css';

interface Invite {
  email: string;
}

interface LocalOrganization extends Organization {
  members: Member[];
  invites: Invite[];
}

interface OrganizationsSettingsProps {
  push: any;
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

export default function OrganizationsSettings({
  push,
}: OrganizationsSettingsProps): React.ReactElement {
  const intl = useIntl();
  const { userInfo } = useUser();

  const [loading, setLoading] = React.useState(true);
  const [organizations, setOrganizations] = React.useState<LocalOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = React.useState('');
  const [submittingRole, setSubmittingRole] = React.useState(0);
  const [removingMember, setRemovingMember] = React.useState<number>();
  const [removingInvite, setRemovingInvite] = React.useState<Invite>();

  const onOrganizationChange = React.useCallback(
    async event => {
      setLoading(true);
      const organizationId = event.target.value;
      const { data: members } = await axios.get(`/api/organizations/${organizationId}/members`);
      const { data: invites } = await axios.get(`/api/organizations/${organizationId}/invites`);
      setSelectedOrganization(organizationId);
      setOrganizations(
        organizations.map(org => (org.id === organizationId ? { ...org, members, invites } : org)),
      );
      setLoading(false);
    },
    [organizations],
  );

  const onSubmitNewOrganization = React.useCallback(
    async (newOrg: Organization) => {
      try {
        const { data: organization } = await axios.post('/api/organizations', newOrg);

        setSelectedOrganization(organization.id);
        setOrganizations([...organizations, organization]);

        push({
          body: intl.formatMessage(messages.createOrganizationSuccess, {
            organization: organization.name,
          }),
          color: 'success',
        });
      } catch (exception) {
        if (exception?.response?.status === 409) {
          push(intl.formatMessage(messages.createOrganizationConflict));
        } else {
          push(intl.formatMessage(messages.createOrganizationError));
        }
      }
    },
    [intl, organizations, push],
  );

  const onInviteMember = React.useCallback(
    async ({ email }: Invite) => {
      const organization = organizations.find(o => o.id === selectedOrganization);

      if (organization.members.some(m => m.primaryEmail === email)) {
        push({
          body: intl.formatMessage(messages.existingMemberWarning),
          color: 'warning',
        });
        return;
      }

      try {
        await axios.post(`/api/organizations/${selectedOrganization}/invites`, { email });
        setOrganizations(
          organizations.map(o =>
            o.id === selectedOrganization
              ? { ...organization, invites: [...organization.invites, { email }] }
              : o,
          ),
        );

        push({
          body: intl.formatMessage(messages.inviteMemberSuccess, { email }),
          color: 'success',
        });
      } catch (exception) {
        switch (exception.response && exception.response.status) {
          case 404:
            push(intl.formatMessage(messages.inviteMemberNotFound));
            break;
          case 406:
            push(intl.formatMessage(messages.inviteMemberNotVerified));
            break;
          case 409:
            push(intl.formatMessage(messages.inviteMemberConflict));
            break;
          default:
            push(intl.formatMessage(messages.inviteMemberError));
        }
      }
    },
    [intl, organizations, push, selectedOrganization],
  );

  const resendInvitation = React.useCallback(
    async invite => {
      await axios.post(`/api/organizations/${selectedOrganization}/invites/resend`, {
        email: invite.email,
      });
      push({ body: intl.formatMessage(messages.resendInvitationSent), color: 'info' });
    },
    [intl, push, selectedOrganization],
  );

  const onChangeRole = React.useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>, userId: number) => {
      event.preventDefault();
      const role = event.target.value as Role;
      setSubmittingRole(userId);

      try {
        await axios.put(`/api/organizations/${selectedOrganization}/members/${userId}/role`, {
          role,
        });
        setSubmittingRole(null);
        setOrganizations(
          organizations.map(organization =>
            organization.id === selectedOrganization
              ? {
                  ...organization,
                  members: organization.members.map(member =>
                    member.id === userId ? { ...member, role } : member,
                  ),
                }
              : organization,
          ),
        );
        const member = organizations
          .find(org => org.id === selectedOrganization)
          .members.find(m => m.id === userId);
        push({
          color: 'success',
          body: intl.formatMessage(messages.changeRoleSuccess, {
            name: member.name || member.primaryEmail || member.id,
            role,
          }),
        });
      } catch (error) {
        push({ body: intl.formatMessage(messages.changeRoleError) });
        setSubmittingRole(null);
      }
    },
    [intl, organizations, push, selectedOrganization],
  );

  const onRemoveMemberClick = React.useCallback(async (memberId: number) => {
    setRemovingMember(memberId);
  }, []);

  const onRemoveInviteClick = React.useCallback(async (invite: Invite) => {
    setRemovingInvite(invite);
  }, []);

  const onLeaveOrganization = React.useCallback(async () => {
    await axios.delete(`/api/organizations/${selectedOrganization}/members/${userInfo.sub}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    const newOrganizations = organizations.filter(o => o.id !== selectedOrganization);

    setRemovingMember(null);
    setSelectedOrganization(newOrganizations[0]?.id);
    setOrganizations(newOrganizations);

    push({
      body: intl.formatMessage(messages.leaveOrganizationSuccess, {
        organization: organization.id,
      }),
      color: 'info',
    });
  }, [intl, organizations, push, selectedOrganization, userInfo.sub]);

  const onRemoveMember = React.useCallback(async () => {
    await axios.delete(`/api/organizations/${selectedOrganization}/members/${removingMember}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredMembers = organization.members.filter(m => m.id !== removingMember);

    setRemovingMember(null);
    setOrganizations(
      organizations.map(o =>
        o.id === organization.id ? { ...organization, members: filteredMembers } : o,
      ),
    );

    push({
      body:
        removingMember === userInfo.sub
          ? intl.formatMessage(messages.leaveOrganizationSuccess, { organization: organization.id })
          : intl.formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  }, [intl, organizations, push, removingMember, selectedOrganization, userInfo.sub]);

  const onRemoveInvite = React.useCallback(async () => {
    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredInvites = organization.invites.filter(m => m.email !== removingInvite.email);

    await axios.delete(`/api/organizations/${selectedOrganization}/invites`, {
      data: removingInvite,
    });

    setRemovingInvite(null);
    setOrganizations(
      organizations.map(o =>
        o.id === organization.id ? { ...organization, invites: filteredInvites } : o,
      ),
    );

    push({
      body: intl.formatMessage(messages.removeInviteSuccess),
      color: 'info',
    });
  }, [intl, organizations, push, removingInvite, selectedOrganization]);

  const onCloseDeleteDialog = React.useCallback(() => {
    setRemovingMember(null);
  }, []);

  const onCloseInviteDialog = React.useCallback(() => {
    setRemovingInvite(null);
  }, []);

  React.useEffect(() => {
    (async () => {
      let selected = '';

      let { data: orgs } = await axios.get<LocalOrganization[]>('/api/user/organizations');
      if (orgs.length) {
        selected = orgs[0].id;
        const { data: members } = await axios.get(`/api/organizations/${selected}/members`);
        const { data: invites } = await axios.get(`/api/organizations/${selected}/invites`);
        orgs = orgs.map(org =>
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

  const organization = organizations.find(o => o.id === selectedOrganization);
  const { role } = organization?.members.find(u => u.id === userInfo.sub) || {};
  const canManageMembers = role && checkRole(role, permissions.ManageMembers);
  const canManageRoles = role && checkRole(role, permissions.ManageRoles);

  return (
    <>
      <div className="content">
        <HelmetIntl title={messages.title} />
        <h2>
          <FormattedMessage {...messages.createOrganization} />
        </h2>
        <SimpleForm
          defaultValues={{ id: '', name: '' }}
          onSubmit={onSubmitNewOrganization}
          preprocess={calculateOrganizationId}
          resetOnSuccess
        >
          <SimpleInput
            iconLeft="briefcase"
            label={<FormattedMessage {...messages.organizationName} />}
            name="name"
            placeholder={intl.formatMessage(messages.organizationName)}
          />
          <SimpleInput
            iconLeft="at"
            label={<FormattedMessage {...messages.organizationId} />}
            maxLength={30}
            name="id"
            placeholder={intl.formatMessage(messages.organizationId)}
            preprocess={value => normalize(value, false)}
            required
          />
          <SimpleSubmit>
            <FormattedMessage {...messages.create} />
          </SimpleSubmit>
        </SimpleForm>

        {!!organizations.length && organization && (
          <>
            <h2>
              <FormattedMessage {...messages.manageOrganization} />
            </h2>
            <Select
              disabled={organizations.length === 1}
              label={<FormattedMessage {...messages.selectedOrganization} />}
              name="selectedOrganization"
              onChange={onOrganizationChange}
              value={selectedOrganization}
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>

            {canManageMembers && (
              <SimpleForm defaultValues={{ email: '' }} onSubmit={onInviteMember}>
                <SimpleInput
                  iconLeft="envelope"
                  label={<FormattedMessage {...messages.addMemberEmail} />}
                  name="email"
                  placeholder={intl.formatMessage(messages.email)}
                  required
                  type="email"
                />
                <SimpleSubmit>
                  <FormattedMessage {...messages.inviteMember} />
                </SimpleSubmit>
              </SimpleForm>
            )}

            <h3>
              <FormattedMessage
                {...messages.organizationMembers}
                values={{ organization: organization.name }}
              />
            </h3>
            <table className="table is-hoverable is-striped">
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
                {organization.members.map(member => (
                  <tr key={member.id}>
                    <td>
                      <span>{member.name || member.primaryEmail || member.id}</span>
                      <div className={`tags ${styles.tags}`}>
                        {member.id === userInfo.sub && (
                          <span className="tag is-success">
                            <FormattedMessage {...messages.you} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="has-text-right">
                      {canManageRoles ? (
                        <Select
                          className={styles.roleSelect}
                          defaultValue={member.role}
                          disabled={member.id === userInfo.sub || submittingRole === member.id}
                          fullwidth={false}
                          loading={submittingRole === member.id}
                          name={`role-${member.id}`}
                          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                            onChangeRole(event, member.id)
                          }
                        >
                          {Object.keys(roles).map((r: Role) => (
                            <option key={r} value={r}>
                              {intl.formatMessage(messages[r])}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <FormattedMessage {...messages[member.role]} />
                      )}
                      <div className={`field is-grouped ${styles.tags}`}>
                        {member.id === userInfo.sub &&
                          organization.members.length > 1 &&
                          organization.members.some(m =>
                            checkRole(m.role, permissions.ManageRoles),
                          ) && (
                            <p className={`control ${styles.memberButton}`}>
                              <button
                                className="button is-danger"
                                onClick={() => onRemoveMemberClick(member.id)}
                                type="button"
                              >
                                <Icon icon="sign-out-alt" size="small" />
                              </button>
                            </p>
                          )}
                        {member.id !== userInfo.sub && canManageMembers && (
                          <p className={`control ${styles.memberButton}`}>
                            <button
                              className="button is-danger"
                              onClick={() => onRemoveMemberClick(member.id)}
                              type="button"
                            >
                              <Icon icon="trash-alt" size="small" />
                            </button>
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {organization.invites.map(invite => (
                  <tr key={invite.email}>
                    <td>{invite.email}</td>
                    <td className="has-text-right">
                      {canManageMembers ? (
                        <div className={`field is-grouped ${styles.tags}`}>
                          <p className={`control ${styles.memberButton}`}>
                            <button
                              className="control button is-outlined"
                              onClick={() => resendInvitation(invite)}
                              type="button"
                            >
                              <FormattedMessage {...messages.resendInvitation} />
                            </button>
                          </p>
                          <p className={`control ${styles.memberButton}`}>
                            <button
                              className="button is-danger"
                              onClick={() => onRemoveInviteClick(invite)}
                              type="button"
                            >
                              <Icon icon="trash-alt" size="small" />
                            </button>
                          </p>
                        </div>
                      ) : (
                        <FormattedMessage {...messages.invited} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <Modal
        className="is-paddingless"
        isActive={!!removingInvite}
        onClose={onCloseInviteDialog}
        title={<FormattedMessage {...messages.removeInviteWarningTitle} />}
      >
        <div className={styles.dialogContent}>
          <FormattedMessage {...messages.removeInviteWarning} />
        </div>
        <footer className="card-footer">
          <CardFooterButton onClick={onCloseInviteDialog}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="danger" onClick={onRemoveInvite}>
            <FormattedMessage {...messages.removeInvite} />
          </CardFooterButton>
        </footer>
      </Modal>

      <Modal
        className="is-paddingless"
        isActive={!!removingMember}
        onClose={onCloseDeleteDialog}
        title={
          removingMember === userInfo.sub ? (
            <FormattedMessage {...messages.leaveOrganizationWarningTitle} />
          ) : (
            <FormattedMessage {...messages.removeMemberWarningTitle} />
          )
        }
      >
        <div className={styles.dialogContent}>
          {removingMember === userInfo.sub ? (
            <FormattedMessage {...messages.leaveOrganizationWarning} />
          ) : (
            <FormattedMessage {...messages.removeMemberWarning} />
          )}
        </div>
        <footer className="card-footer">
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
        </footer>
      </Modal>
    </>
  );
}
