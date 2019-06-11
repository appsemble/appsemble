import { Loader } from '@appsemble/react-components';
import axios from 'axios';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './OrganizationsSettings.css';
import messages from './messages';

export default class OrganizationsSettings extends Component {
  state = {
    user: undefined,
    loading: true,
    selectedOrganization: 0,
  };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    this.setState({ user, loading: false });
  }

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { user, loading, selectedOrganization } = this.state;

    if (loading) {
      return <Loader />;
    }

    const organization = user.organizations[selectedOrganization];
    organization.members = [{ id: user.id, name: user.name, primaryEmail: user.primaryEmail }];

    return (
      <div className="content">
        <div className="field">
          <label className="label" htmlFor="selectedOrganization">
            <FormattedMessage {...messages.selectedOrganization} />
          </label>
          <div className="control">
            <div className="select">
              <select
                disabled={user.organizations.length === 1}
                id="selectedOrganization"
                name="selectedOrganization"
                onChange={this.onChange}
                value={selectedOrganization}
              >
                {user.organizations.map((org, index) => (
                  <option key={org.id} value={index}>
                    {org.id}
                  </option>
                ))}
              </select>
            </div>
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
                <td>Owner</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
