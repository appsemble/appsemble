import { Form, Loader, Modal } from '@appsemble/react-components';
import normalize from '@appsemble/utils/normalize';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './OrganizationsSettings.css';
import messages from './messages';

export default class OrganizationsSettings extends Component {
  static propTypes = {
    push: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
  };

  state = {
    user: undefined,
    loading: true,
    selectedOrganization: undefined,
    organizations: [],
    submittingMember: false,
    removingMember: undefined,
    memberEmail: '',
    newOrganizationId: '',
    newOrganizationName: '',
    submittingOrganization: false,
  };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    let selectedOrganization = '';
    let organizations = [];

    if (user.organizations.length) {
      [{ id: selectedOrganization }] = user.organizations;
      const { data: organization } = await axios.get(`/api/organizations/${selectedOrganization}`);
      organizations = user.organizations.map(org =>
        org.id === organization.id ? organization : org,
      );
    }

    this.setState({
      user,
      loading: false,
      selectedOrganization,
      organizations,
    });
  }

  onChange = event => {
    const value =
      event.target.name === 'newOrganizationId'
        ? normalize(event.target.value)
        : event.target.value;
    this.setState({ [event.target.name]: value });
  };

  onMemberEmailChange = event => {
    this.setState({ [event.target.name]: event.targetvalue.trim() });
  };

  onOrganizationChange = async event => {
    const { organizations } = this.state;
    const organizationId = event.target.value;
    const { data: organization } = await axios.get(`/api/organizations/${organizationId}`);

    this.setState({
      selectedOrganization: organizationId,
      organizations: organizations.map(org => (org.id === organizationId ? organization : org)),
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

      organizations.push(organization);
      push({
        body: intl.formatMessage(messages.createOrganizationSuccess, {
          organization: organization.name,
        }),
        color: 'success',
      });

      this.setState({
        newOrganizationId: '',
        newOrganizationName: '',
        submittingOrganization: false,
        selectedOrganization: newOrganizationId,
      });
    } catch (exception) {
      if (exception?.response?.status === 409) {
        push(intl.formatMessage(messages.createOrganizationConflict));
      } else {
        push(intl.formatMessage(messages.createOrganizationError));
      }
    }
  };

  onInviteMember = async event => {
    event.preventDefault();

    const { intl, push } = this.props;
    const { selectedOrganization, organizations, memberEmail } = this.state;

    this.setState({ submittingMember: true });
    const organization = { ...organizations.find(o => o.id === selectedOrganization) };

    if (organization.members.some(m => m.primaryEmail === memberEmail)) {
      push({
        body: intl.formatMessage(messages.existingMemberWarning),
        color: 'warning',
      });
      this.setState({ submittingMember: false });
      return;
    }

    try {
      const { data: member } = await axios.post(
        `/api/organizations/${selectedOrganization}/members`,
        { email: memberEmail },
      );

      organization.members.push(member);

      this.setState({
        submittingMember: false,
        memberEmail: '',
        organizations: organizations.map(o => (o.id === selectedOrganization ? organization : o)),
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

  resendInvitation = async member => {
    const { selectedOrganization } = this.state;
    const { intl, push } = this.props;

    await axios.post(`/api/organizations/${selectedOrganization}/resend`, { memberId: member.id });
    push({ body: intl.formatMessage(messages.resendInvitationSent), color: 'info' });
  };

  onRemoveMemberClick = async memberId => {
    this.setState({
      removingMember: memberId,
    });
  };

  onLeaveOrganization = async () => {
    const { user, organizations, selectedOrganization } = this.state;
    const { intl, push } = this.props;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${user.id}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    const newOrganizations = organizations.filter(o => o.id !== selectedOrganization);

    this.setState({
      organizations: newOrganizations,
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
    const { removingMember, organizations, selectedOrganization, user } = this.state;
    const { intl, push } = this.props;

    await axios.delete(`/api/organizations/${selectedOrganization}/members/${removingMember}`);

    const organization = organizations.find(o => o.id === selectedOrganization);
    organization.members = organization.members.filter(m => m.id !== removingMember);

    this.setState({
      removingMember: undefined,
      organizations: organizations.map(o => (o.id === organization ? organization : o)),
    });

    push({
      body:
        removingMember === user.id
          ? intl.formatMessage(messages.leaveOrganizationSuccess, { organization: organization.id })
          : intl.formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  };

  onCloseDeleteDialog = () => {
    this.setState({ removingMember: undefined });
  };

  render() {
    const {
      user,
      loading,
      selectedOrganization,
      organizations,
      memberEmail,
      submittingMember,
      removingMember,
      newOrganizationId,
      newOrganizationName,
      submittingOrganization,
    } = this.state;
    const { intl } = this.props;

    if (loading) {
      return <Loader />;
    }

    const organization = organizations.find(o => o.id === selectedOrganization);

    return (
      <div className="content">
        <h2>
          <FormattedMessage {...messages.createOrganization} />
        </h2>
        <Form onSubmit={this.onSubmitNewOrganization}>
          <div className="field">
            <label className="label" htmlFor="newOrganizationId">
              <FormattedMessage {...messages.organizationId} />
            </label>
            <div className={`control has-icons-left ${styles.field}`}>
              <input
                className="input"
                disabled={submittingOrganization}
                id="newOrganizationId"
                name="newOrganizationId"
                onChange={this.onChange}
                placeholder={intl.formatMessage(messages.organizationId)}
                value={newOrganizationId}
              />
              <span className="icon is-left">
                <i className="fas fa-briefcase" />
              </span>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="newOrganizationName">
              <FormattedMessage {...messages.organizationName} />
            </label>
            <div className={`control has-icons-left ${styles.field}`}>
              <input
                className="input"
                disabled={submittingOrganization}
                id="newOrganizationName"
                name="newOrganizationName"
                onChange={this.onChange}
                placeholder={intl.formatMessage(messages.organizationName)}
                value={newOrganizationName}
              />
              <span className="icon is-left">
                <i className="fas fa-briefcase" />
              </span>
            </div>
          </div>

          <div className="control">
            <button className="button is-primary" disabled={submittingOrganization} type="submit">
              <FormattedMessage {...messages.create} />
            </button>
          </div>
        </Form>

        {!!organizations.length && (
          <React.Fragment>
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
              <div className="field">
                <label className="label" htmlFor="memberEmail">
                  <FormattedMessage {...messages.addMemberEmail} />
                </label>
                <div className={`control has-icons-left ${styles.field}`}>
                  <input
                    className="input"
                    disabled={submittingMember}
                    id="memberEmail"
                    name="memberEmail"
                    onChange={this.onMemberEmailChange}
                    placeholder={intl.formatMessage(messages.email)}
                    type="email"
                    value={memberEmail}
                  />
                  <span className="icon is-left">
                    <i className="fas fa-envelope" />
                  </span>
                </div>
              </div>
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
                      <span>{member.verified && <FormattedMessage {...messages.member} />}</span>
                      <div className={`field is-grouped ${styles.tags}`}>
                        {!member.verified && (
                          <p className={`control ${styles.memberButton}`}>
                            <button
                              className="control button is-outlined"
                              onClick={() => this.resendInvitation(member)}
                              type="button"
                            >
                              <FormattedMessage {...messages.resendInvitation} />
                            </button>
                          </p>
                        )}
                        {member.id === user.id && organization.members.length > 1 && (
                          <p className={`control ${styles.memberButton}`}>
                            <button
                              className="button is-danger"
                              onClick={() => this.onRemoveMemberClick(member.id)}
                              type="button"
                            >
                              <span className="icon is-small">
                                <i className="fas fa-sign-out-alt" />
                              </span>
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
                              <span className="icon is-small">
                                <i className="fas fa-trash-alt" />
                              </span>
                            </button>
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </React.Fragment>
        )}

        <Modal isActive={!!removingMember} onClose={this.onCloseDeleteDialog}>
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">
                {removingMember === user.id ? (
                  <FormattedMessage {...messages.leaveOrganizationWarningTitle} />
                ) : (
                  <FormattedMessage {...messages.removeMemberWarningTitle} />
                )}
              </p>
            </header>
            <div className="card-content">
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
                onClick={
                  removingMember === user.id ? this.onLeaveOrganization : this.onRemoveMember
                }
                type="button"
              >
                {removingMember === user.id ? (
                  <FormattedMessage {...messages.leaveOrganization} />
                ) : (
                  <FormattedMessage {...messages.removeMember} />
                )}
              </button>
            </footer>
          </div>
        </Modal>
      </div>
    );
  }
}
