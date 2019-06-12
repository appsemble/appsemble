import { Loader } from '@appsemble/react-components';
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

  onInviteMember = async event => {
    event.preventDefault();

    const { intl, push } = this.props;
    const { selectedOrganization, organizations, memberEmail } = this.state;
    const organization = organizations.find(o => o.id === selectedOrganization);

    const { body: member } = await axios.post(
      `/api/organizations/${selectedOrganization}/members`,
      { email: memberEmail },
    );
    organization.members.push(member);

    this.setState({
      memberEmail: '',
      organizations: organizations.map(o => (o.id === selectedOrganization ? organization : o)),
    });

    push({
      body: intl.formatMessage(messages.inviteMemberSuccess, { email: memberEmail }),
      color: 'success',
    });
  };

  onRemoveMemberClick = async (organizationId, memberId) => {
    const { organizations } = this.state;
    const { intl, push } = this.props;

    await axios.delete(`/api/organizations/${organizationId}/${memberId}`);

    const organization = organizations.find(o => o.id === organizationId);
    organization.members = organizations.members.filter(m => m.id !== memberId);

    this.setState({
      organizations: organizations.map(o => (o.id === organization ? organization : o)),
    });

    push({
      body: intl.formatMessage(messages.removeMemberSuccess),
      color: 'info',
    });
  };

  render() {
    const { user, loading, selectedOrganization, organizations, memberEmail } = this.state;
    const { intl } = this.props;

    if (loading) {
      return <Loader />;
    }

    const organization = organizations.find(o => o.id === selectedOrganization);

    return (
      <div className="content">
        <div className="field">
          <label className="label" htmlFor="selectedOrganization">
            <FormattedMessage {...messages.selectedOrganization} />
          </label>
          <div className={`control ${styles.field}`}>
            <div className="select">
              <select
                disabled={user.organizations.length === 1}
                id="selectedOrganization"
                name="selectedOrganization"
                onChange={this.onOrganizationChange}
                value={selectedOrganization}
              >
                {user.organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="memberEmail">
            <FormattedMessage {...messages.addMemberEmail} />
          </label>
          <div className={`control has-icons-left ${styles.field}`}>
            <input
              className="input"
              id="memberEmail"
              name="memberEmail"
              placeholder={intl.formatMessage(messages.email)}
              type="email"
              value={memberEmail}
            />
            <span className="icon is-left">
              <i className="fas fa-envelope" />
            </span>
          </div>
        </div>

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
                  <div className="field is-grouped">
                    {member.id !== user.id && (
                      <p className="control">
                        <button
                          className="button is-danger"
                          onClick={() => this.onRemoveMemberClick(organization.id, member.id)}
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
      </div>
    );
  }
}
