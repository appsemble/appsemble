export default {
  type: 'object',
  description: 'Settings for login in apps using third party OAuth2 providers',
  required: ['authorizationUrl', 'clientId', 'clientSecret', 'icon', 'name', 'scope', 'tokenUrl'],
  properties: {
    id: {
      type: 'number',
      description: 'An autogenerated ID',
      readOnly: true,
    },
    authorizationUrl: {
      type: 'string',
      format: 'uri',
      description: 'The OAuth2 redirect URL.',
    },
    tokenUrl: {
      type: 'string',
      format: 'uri',
      description: 'The URL to request access tokens from.',
    },
    clientId: {
      type: 'string',
      description: 'The public client id which identifies Appsemble to the authorization server.',
    },
    clientSecret: {
      type: 'string',
      description: 'The OAuth2 client secret.',
    },
    icon: {
      type: 'string',
      description: 'A Font Awesome icon which represents the OAuth2 provider.',
    },
    name: {
      type: 'string',
      description: 'A display name which represents the OAuth2 provider.',
    },
    scope: {
      type: 'string',
      description: 'The login scope that will be requested from the authorization server.',
    },
    userInfoUrl: {
      type: 'string',
      format: 'uri',
      description: 'The URL to request user info from',
    },
    remapper: {
      type: 'array',
      description: 'A remapper to apply on retrieved user information from the user info endpoint.',
    },
  },
};
