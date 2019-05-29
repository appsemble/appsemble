import React, { Component } from 'react';
import axios from 'axios';
import { Loader } from '@appsemble/react-components';

export default class UserSettings extends Component {
  state = { user: undefined, loading: true };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    this.setState({ user, loading: false });
  }

  render() {
    const { user, loading } = this.state;

    if (loading) {
      return <Loader />;
    }

    return <pre>{JSON.stringify(user, null, 2)}</pre>;
  }
}
