import axios from 'axios';

const oauth2Handlers = {
  async gitlab(token) {
    const { data } = await axios.get('https://gitlab.com/api/v4/user', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (data) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        verified: data.confirmed_at && data.state === 'active',
      };
    }

    return null;
  },

  async google(token) {
    const { data } = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (data) {
      return { id: data.id, name: data.name, email: data.email, verified: data.verified_email };
    }

    return null;
  },

  async facebook(token) {
    const { data } = await axios.get('https://graph.facebook.com/v3.2/me?fields=name,email', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        verified: data.id && data.name && data.email,
      };
    }

    return null;
  },
};

export default oauth2Handlers;
