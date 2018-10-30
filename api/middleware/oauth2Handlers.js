import axios from 'axios';

const oauth2Handlers = {
  async gitlab(token, config) {
    const { data } = await axios.get('https://gitlab.com/api/v4/user', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (data && data.confirmed_at && data.state === 'active') {
      return { id: data.id, email: data.email, name: data.name };
    }

    return null;
  },

  async google(token, config) {
    const { data } = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (data && data.verified_email) {
      return { id: data.id, name: data.name, email: data.email };
    }

    return null;
  },
};

export default oauth2Handlers;
