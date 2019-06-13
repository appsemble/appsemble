import { Form, Loader, Modal } from '@appsemble/react-components';
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
    newOrganization: '',
    submittingOrganization: false,
  };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    const [{ id: selectedOrganization }] = user.organizations;
    const { data: organization } = await axios.get(`/api/organizations/${selectedOrganization}`);
    const organizations = user.organizations.map(org =>
      org.id === organization.id ? organization : org,
    );

    this.setState({
      user,
      loading: false,
      selectedOrganization,
      organizations,
    });
  }

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
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
    const { organizations, newOrganization } = this.state;

    this.setState({ submittingOrganization: true });

    try {
      const { data: organization } = await axios.post('/api/organizations', {
        name: newOrganization,
      });

      organizations.push(organization);
      push({
        body: intl.formatMessage(messages.createOrganizationSuccess, {
          organization: organization.id,
        }),
        color: 'success',
      });

      this.setState({
        newOrganization: '',
        submittingOrganization: false,
        selectedOrganization: newOrganization,
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
    const organization = organizations.find(o => o.id === selectedOrganization);

    if (organization.members.some(m => m.primaryEmail === memberEmail.trim())) {
      push({
        body: intl.formatMessage(messages.existingMemberWarning),
        color: 'warning',
      });
      this.setState({ submittingMember: false });
      return;
    }

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
      newOrganization,
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
            <label className="label" htmlFor="newOrganization">
              <FormattedMessage {...messages.organizationName} />
            </label>
            <div className={`control has-icons-left ${styles.field}`}>
              <input
                className="input"
                disabled={submittingOrganization}
                id="newOrganization"
                name="newOrganization"
                onChange={this.onChange}
                placeholder={intl.formatMessage(messages.organizationName)}
                value={newOrganization}
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
                    {org.id}
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
                onChange={this.onChange}
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
            values={{ organization: organization.id }}
          />
        </h3>
        <table className="table is-hoverable is-striped">
          <thead>
            <tr>
              <td>
                <FormattedMessage {...messages.member} />
              </td>
              <td>
                <FormattedMessage {...messages.actions} />
              </td>
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
                <td>
                  <span>
                    <FormattedMessage {...messages.member} />
                  </span>
                  <div className={`field is-grouped ${styles.tags}`}>
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
