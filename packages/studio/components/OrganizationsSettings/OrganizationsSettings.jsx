import { Form, Icon, Input, Loader, Modal } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import { requestUser } from '../../actions/user';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './OrganizationsSettings.css';

export default class OrganizationsSettings extends Component {
  static propTypes = {
    push: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
    user: PropTypes.shape().isRequired,
    updateUser: PropTypes.func.isRequired,
  };

  state = {
    loading: true,
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
    const { updateUser } = this.props;

    const user = await requestUser();
    updateUser(user);

    let selectedOrganization = '';

    if (user.organizations.length) {
      [{ id: selectedOrganization }] = user.organizations;
      const { data: organization } = await axios.get(`/api/organizations/${selectedOrganization}`);
      const organizations = user.organizations.map(org =>
        org.id === organization.id ? organization : org,
      );

      updateUser({ ...user, organizations });
    }

    this.setState({
      loading: false,
      selectedOrganization,
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
    const { user, updateUser } = this.props;
    const { organizations } = user;
    const organizationId = event.target.value;
    const { data: organization } = await axios.get(`/api/organizations/${organizationId}`);

    updateUser({
      ...user,
      organizations: organizations.map(org => (org.id === organizationId ? organization : org)),
    });

    this.setState({ selectedOrganization: organizationId });
  };

  onSubmitNewOrganization = async event => {
    event.preventDefault();

    const { intl, push, user, updateUser } = this.props;
    const { newOrganizationId, newOrganizationName } = this.state;

    this.setState({ submittingOrganization: true });

    try {
      const { data: organization } = await axios.post('/api/organizations', {
        id: normalize(newOrganizationId),
        name: newOrganizationName,
      });

      updateUser({ ...user, organizations: [...user.organizations, organization] });

      this.setState({
        newOrganizationId: '',
        newOrganizationName: '',
        submittingOrganization: false,
        selectedOrganization: organization.id,
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

    const { intl, push, user, updateUser } = this.props;
    const { selectedOrganization, memberEmail } = this.state;

    this.setState({ submittingMember: true });

    const { organizations } = user;
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

      updateUser({
        ...user,
        organizations: organizations.map(o =>
          o.id === selectedOrganization
            ? { ...organization, invites: [...organization.invites, { email: memberEmail }] }
            : o,
        ),
      });

      this.setState({
        submittingMember: false,
        memberEmail: '',
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
    const { selectedOrganization } = this.state;
    const { intl, push, user, updateUser } = this.props;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${user.id}`);

    const { organizations } = user;
    const organization = organizations.find(o => o.id === selectedOrganization);
    const newOrganizations = organizations.filter(o => o.id !== selectedOrganization);

    updateUser({ ...user, organizations: newOrganizations });
    this.setState({
      removingMember: undefined,
      selectedOrganization: newOrganizations[0]?.id,
    });
    push({
      body: intl.formatMessage(messages.leaveOrganizationSuccess, {
        organization: organization.id,
      }),
      color: 'info',
    });
  };

  onRemoveMember = async () => {
    const { removingMember, selectedOrganization } = this.state;
    const { intl, push, user, updateUser } = this.props;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${removingMember}`);

    const { organizations } = user;
    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredMembers = organization.members.filter(m => m.id !== removingMember);

    updateUser({
      ...user,
      organizations: organizations.map(o =>
        o.id === organization.id ? { ...organization, members: filteredMembers } : o,
      ),
    });

    this.setState({
      removingMember: undefined,
    });

    push({
      body:
        removingMember === user.id
          ? intl.formatMessage(messages.leaveOrganizationSuccess, { organization: organization.id })
          : intl.formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  };

  onRemoveInvite = async () => {
    const { selectedOrganization, removingInvite } = this.state;
    const { intl, push, user, updateUser } = this.props;

    const { organizations } = user;
    const organization = organizations.find(o => o.id === selectedOrganization);
    const filteredInvites = organization.invites.filter(m => m.email !== removingInvite.email);

    updateUser({
      ...user,
      organizations: organizations.map(o =>
        o.id === organization.id ? { ...organization, invites: filteredInvites } : o,
      ),
    });

    await axios.delete(`/api/organizations/${selectedOrganization}/invites`, {
      data: removingInvite,
    });
    this.setState({ removingInvite: undefined });

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
    } = this.state;
    const { intl, user } = this.props;

    if (loading) {
      return <Loader />;
    }

    const { organizations } = user;
    const organization = organizations.find(o => o.id === selectedOrganization);

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
                        <span>{member.name || member.primaryEmail || member.id}</span>{' '}
                        <div className={`tags ${styles.tags}`}>
                          {member.id === user.id && (
                            <span className="tag is-success">
                              <FormattedMessage {...messages.you} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="has-text-right">
                        <FormattedMessage {...messages.member} />
                        <div className={`field is-grouped ${styles.tags}`}>
                          {member.id === user.id && organization.members.length > 1 && (
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
                          {member.id !== user.id && (
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
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              className="card-footer-item is-link"
              onClick={this.onCloseInviteDialog}
              onKeyDown={this.onCloseInviteDialog}
              role="button"
              tabIndex="-1"
            >
              <FormattedMessage {...messages.cancel} />
            </a>
            <button
              className={`card-footer-item button is-danger ${styles.cardFooterButton}`}
              onClick={this.onRemoveInvite}
              type="button"
            >
              <FormattedMessage {...messages.removeInvite} />
            </button>
          </footer>
        </Modal>

        <Modal
          className="is-paddingless"
          isActive={!!removingMember}
          onClose={this.onCloseDeleteDialog}
          title={
            removingMember === user.id ? (
              <FormattedMessage {...messages.leaveOrganizationWarningTitle} />
            ) : (
              <FormattedMessage {...messages.removeMemberWarningTitle} />
            )
          }
        >
          <div className={styles.dialogContent}>
            {removingMember === user.id ? (
              <FormattedMessage {...messages.leaveOrganizationWarning} />
            ) : (
              <FormattedMessage {...messages.removeMemberWarning} />
            )}
          </div>
          <footer className="card-footer">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              className="card-footer-item is-link"
              onClick={this.onCloseDeleteDialog}
              onKeyDown={this.onCloseDeleteDialog}
              role="button"
              tabIndex="-1"
            >
              <FormattedMessage {...messages.cancel} />
            </a>
            <button
              className={`card-footer-item button is-danger ${styles.cardFooterButton}`}
              onClick={removingMember === user.id ? this.onLeaveOrganization : this.onRemoveMember}
              type="button"
            >
              {removingMember === user.id ? (
                <FormattedMessage {...messages.leaveOrganization} />
              ) : (
                <FormattedMessage {...messages.removeMember} />
              )}
            </button>
          </footer>
        </Modal>
      </>
    );
  }
}
