import axios from 'axios';

export default {
  async gitlab(accessToken) {
    const { data } = await axios.get('https://gitlab.com/api/v4/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
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

  async google(accessToken) {
    const { data } = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (data) {
      return { id: data.id, name: data.name, email: data.email, verified: data.verified_email };
    }

    return null;
  },

  async facebook(accessToken) {
    const { data } = await axios.get('https://graph.facebook.com/v3.2/me?fields=name,email', {
      headers: { Authorization: `Bearer ${accessToken}` },
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
