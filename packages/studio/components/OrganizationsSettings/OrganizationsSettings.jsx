import { CardFooterButton, Form, Icon, Input, Loader, Modal } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { permissions, roles } from '@appsemble/utils/constants/roles';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import { UserContext } from '../../hooks/useUser';
import checkRole from '../../utils/checkRole';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './OrganizationsSettings.css';

export default class OrganizationsSettings extends Component {
  static propTypes = {
    push: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = {
    loading: true,
    organizations: [],
    selectedOrganization: undefined,
    submittingMember: false,
    removingMember: undefined,
    removingInvite: undefined,
    memberEmail: '',
    newOrganizationId: '',
    newOrganizationName: '',
    submittingOrganization: false,
  };

  async componentDidMount() {
    let selectedOrganization = '';

    let { data: organizations } = await axios.get('/api/user/organizations');
    if (organizations.length) {
      [{ id: selectedOrganization }] = organizations;
      const { data: members } = await axios.get(
        `/api/organizations/${selectedOrganization}/members`,
      );
      const { data: invites } = await axios.get(
        `/api/organizations/${selectedOrganization}/invites`,
      );
      organizations = organizations.map(org =>
        org.id === selectedOrganization
          ? { ...org, members, invites }
          : { ...org, members: [], invites: [] },
      );
    }

    this.setState({
      loading: false,
      selectedOrganization,
      organizations,
    });
  }

  onNewOrganizationChange = event => {
    const { name, value } = event.target;

    this.setState(({ newOrganizationId, newOrganizationName }) => {
      const updatedName = name === 'newOrganizationName' ? value : newOrganizationName;
      let updatedId = newOrganizationId;

      if (name === 'newOrganizationId') {
        updatedId = normalize(value, false);
      } else if (normalize(newOrganizationName, false) === newOrganizationId) {
        updatedId = normalize(value, false);
      }

      return {
        newOrganizationName: updatedName,
        newOrganizationId: updatedId,
      };
    });
  };

  onChange = event => {
    const value =
      event.target.name === 'newOrganizationId'
        ? normalize(event.target.value, false)
        : event.target.value;
    this.setState({ [event.target.name]: value });
  };

  onMemberEmailChange = event => {
    this.setState({ [event.target.name]: event.target.value.trim() });
  };

  onOrganizationChange = async event => {
    this.setState({ loading: true });
    const { organizations } = this.state;
    const organizationId = event.target.value;
    const { data: members } = await axios.get(`/api/organizations/${organizationId}/members`);
    const { data: invites } = await axios.get(`/api/organizations/${organizationId}/invites`);

    this.setState({
      loading: false,
      selectedOrganization: organizationId,
      organizations: organizations.map(org =>
        org.id === organizationId ? { ...org, members, invites } : org,
      ),
    });
  };

  onSubmitNewOrganization = async event => {
    event.preventDefault();

    const { intl, push } = this.props;
    const { organizations, newOrganizationId, newOrganizationName } = this.state;

    this.setState({ submittingOrganization: true });

    try {
      const { data: organization } = await axios.post('/api/organizations', {
        id: normalize(newOrganizationId),
        name: newOrganizationName,
      });

      this.setState({
        newOrganizationId: '',
        newOrganizationName: '',
        submittingOrganization: false,
        selectedOrganization: organization.id,
        organizations: [...organizations, organization],
      });

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

      this.setState({ submittingOrganization: false });
    }
  };

  onInviteMember = async event => {
    event.preventDefault();

    const { intl, push } = this.props;
    const { selectedOrganization, memberEmail, organizations } = this.state;

    this.setState({ submittingMember: true });

    const organization = organizations.find(o => o.id === selectedOrganization);

    if (organization.members.some(m => m.primaryEmail === memberEmail)) {
      push({
        body: intl.formatMessage(messages.existingMemberWarning),
        color: 'warning',
      });
      this.setState({ submittingMember: false });
      return;
    }

    try {
      await axios.post(`/api/organizations/${selectedOrganization}/invites`, {
        email: memberEmail,
      });

      this.setState({
        submittingMember: false,
        memberEmail: '',
        organizations: organizations.map(o =>
          o.id === selectedOrganization
            ? { ...organization, invites: [...organization.invites, { email: memberEmail }] }
            : o,
        ),
      });

      push({
        body: intl.formatMessage(messages.inviteMemberSuccess, { email: memberEmail }),
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

      this.setState({
        submittingMember: false,
      });
    }
  };

  resendInvitation = async invite => {
    const { selectedOrganization } = this.state;
    const { intl, push } = this.props;

    await axios.post(`/api/organizations/${selectedOrganization}/invites/resend`, {
      email: invite.email,
    });
    push({ body: intl.formatMessage(messages.resendInvitationSent), color: 'info' });
  };

  onRemoveMemberClick = async memberId => {
    this.setState({
      removingMember: memberId,
    });
  };

  onRemoveInviteClick = async invite => {
    this.setState({ removingInvite: invite });
  };

  onLeaveOrganization = async () => {
    const { selectedOrganization, organizations } = this.state;
    const { intl, push } = this.props;
    const { userInfo } = this.context;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${userInfo.sub}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    const newOrganizations = organizations.filter(o => o.id !== selectedOrganization);

    this.setState({
      removingMember: undefined,
      selectedOrganization: newOrganizations[0]?.id,
      organizations: newOrganizations,
    });
    push({
      body: intl.formatMessage(messages.leaveOrganizationSuccess, {
        organization: organization.id,
      }),
      color: 'info',
    });
  };

  onRemoveMember = async () => {
    const { removingMember, selectedOrganization, organizations } = this.state;
    const { intl, push } = this.props;
    const { userInfo } = this.context;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${removingMember}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredMembers = organization.members.filter(m => m.id !== removingMember);

    this.setState({
      removingMember: undefined,
      organizations: organizations.map(o =>
        o.id === organization.id ? { ...organization, members: filteredMembers } : o,
      ),
    });

    push({
      body:
        removingMember === userInfo.sub
          ? intl.formatMessage(messages.leaveOrganizationSuccess, { organization: organization.id })
          : intl.formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  };

  onRemoveInvite = async () => {
    const { selectedOrganization, removingInvite, organizations } = this.state;
    const { intl, push } = this.props;

    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredInvites = organization.invites.filter(m => m.email !== removingInvite.email);

    await axios.delete(`/api/organizations/${selectedOrganization}/invites`, {
      data: removingInvite,
    });

    this.setState({
      removingInvite: undefined,
      organizations: organizations.map(o =>
        o.id === organization.id ? { ...organization, invites: filteredInvites } : o,
      ),
    });

    push({
      body: intl.formatMessage(messages.removeInviteSuccess),
      color: 'info',
    });
  };

  onCloseDeleteDialog = () => {
    this.setState({ removingMember: undefined });
  };

  onCloseInviteDialog = () => {
    this.setState({ removingInvite: undefined });
  };

  static contextType = UserContext;

  render() {
    const {
      loading,
      selectedOrganization,
      memberEmail,
      submittingMember,
      removingMember,
      removingInvite,
      newOrganizationId,
      newOrganizationName,
      submittingOrganization,
      organizations,
    } = this.state;
    const { intl } = this.props;
    const { userInfo } = this.context;

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
          <Form onSubmit={this.onSubmitNewOrganization}>
            <Input
              disabled={submittingOrganization}
              iconLeft="briefcase"
              label={<FormattedMessage {...messages.organizationName} />}
              name="newOrganizationName"
              onChange={this.onNewOrganizationChange}
              placeholder={intl.formatMessage(messages.organizationName)}
              value={newOrganizationName}
            />
            <Input
              disabled={submittingOrganization}
              iconLeft="briefcase"
              label={<FormattedMessage {...messages.organizationId} />}
              maxLength={30}
              name="newOrganizationId"
              onChange={this.onNewOrganizationChange}
              placeholder={intl.formatMessage(messages.organizationId)}
              required
              value={newOrganizationId}
            />

            <div className="control">
              <button className="button is-primary" disabled={submittingOrganization} type="submit">
                <FormattedMessage {...messages.create} />
              </button>
            </div>
          </Form>

          {!!organizations.length && organization && (
            <>
              <h2>
                <FormattedMessage {...messages.manageOrganization} />
              </h2>
              <div className="field">
                <label className="label" htmlFor="selectedOrganization">
                  <FormattedMessage {...messages.selectedOrganization} />
                </label>
                <div className={`control ${styles.field}`}>
                  <div className="select">
                    <select
                      disabled={organizations.length === 1}
                      id="selectedOrganization"
                      name="selectedOrganization"
                      onChange={this.onOrganizationChange}
                      value={selectedOrganization}
                    >
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {canManageMembers && (
                <Form onSubmit={this.onInviteMember}>
                  <Input
                    disabled={submittingMember}
                    iconLeft="envelope"
                    label={<FormattedMessage {...messages.addMemberEmail} />}
                    name="memberEmail"
                    onChange={this.onMemberEmailChange}
                    placeholder={intl.formatMessage(messages.email)}
                    required
                    type="email"
                    value={memberEmail}
                  />
                  <div className="control">
                    <button className="button is-primary" disabled={submittingMember} type="submit">
                      <FormattedMessage {...messages.inviteMember} />
                    </button>
                  </div>
                </Form>
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
                          <div className="control is-inline">
                            <div className="select">
                              <select disabled={member.id === userInfo.sub}>
                                {Object.keys(roles).map(r => (
                                  <option key={r} selected={r === member.role} value={r}>
                                    {intl.formatMessage(messages[r])}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <FormattedMessage {...messages[member.role]} />
                        )}
                        <div className={`field is-grouped ${styles.tags}`}>
                          {member.id === userInfo.sub &&
                            organization.members.length > 1 &&
                            organization.members.some(m =>
                              m.role.includes(permissions.ManageRoles),
                            ) && (
                              <p className={`control ${styles.memberButton}`}>
                                <button
                                  className="button is-danger"
                                  onClick={() => this.onRemoveMemberClick(member.id)}
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
                                onClick={() => this.onRemoveMemberClick(member.id)}
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
                                onClick={() => this.resendInvitation(invite)}
                                type="button"
                              >
                                <FormattedMessage {...messages.resendInvitation} />
                              </button>
                            </p>
                            <p className={`control ${styles.memberButton}`}>
                              <button
                                className="button is-danger"
                                onClick={() => this.onRemoveInviteClick(invite)}
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
          onClose={this.onCloseInviteDialog}
          title={<FormattedMessage {...messages.removeInviteWarningTitle} />}
        >
          <div className={styles.dialogContent}>
            <FormattedMessage {...messages.removeInviteWarning} />
          </div>
          <footer className="card-footer">
            <CardFooterButton onClick={this.onCloseInviteDialog}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="danger" onClick={this.onRemoveInvite}>
              <FormattedMessage {...messages.removeInvite} />
            </CardFooterButton>
          </footer>
        </Modal>

        <Modal
          className="is-paddingless"
          isActive={!!removingMember}
          onClose={this.onCloseDeleteDialog}
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
            <CardFooterButton onClick={this.onCloseDeleteDialog}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton
              color="danger"
              onClick={
                removingMember === userInfo.sub ? this.onLeaveOrganization : this.onRemoveMember
              }
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
}
