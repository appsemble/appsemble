import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  verify: {
    id: 'studio.r+ZN4X',
    defaultMessage: 'Verify connection and save',
  },
  verifyHelp: {
    id: 'studio.PDKeBJ',
    defaultMessage:
      'Sign in with an account whose groups map to Owner to verify this connection. Settings are saved after verification succeeds.',
  },
  title: {
    id: 'studio.YQJkxw',
    defaultMessage: 'Single sign-on',
  },
  loadError: {
    id: 'studio.emkdvL',
    defaultMessage: 'Unable to load single sign-on settings.',
  },
  managed: {
    id: 'studio.J1CCuY',
    defaultMessage: 'These single sign-on settings are managed by your deployment configuration.',
  },
  name: {
    id: 'studio./6zD3t',
    defaultMessage: 'Provider name',
  },
  issuer: {
    id: 'studio.159pCl',
    defaultMessage: 'Issuer URL',
  },
  clientId: {
    id: 'studio.U5+MBC',
    defaultMessage: 'Client ID',
  },
  clientSecret: {
    id: 'studio.B7p2EC',
    defaultMessage: 'Client secret',
  },
  keepSecret: {
    id: 'studio.qpjF+M',
    defaultMessage: 'Leave empty to keep the configured client secret.',
  },
  scope: {
    id: 'studio.joDyyj',
    defaultMessage: 'Scopes',
  },
  groupClaim: {
    id: 'studio.mQpSGm',
    defaultMessage: 'Group claim',
  },
  policy: {
    id: 'studio.ZyrooY',
    defaultMessage: 'Organization sign-in policy',
  },
  optional: {
    id: 'studio.1FEdBO',
    defaultMessage: 'Allow single sign-on and other permitted methods',
  },
  required: {
    id: 'studio.ORYf6z',
    defaultMessage: 'Require organization single sign-on for everyone',
  },
  requiredGuests: {
    id: 'studio.a9+8Ob',
    defaultMessage: 'Require single sign-on for staff; allow invited external guests',
  },
  methods: {
    id: 'studio.b9cOzd',
    defaultMessage: 'Other permitted sign-in methods',
  },
  password: {
    id: 'studio.5sg7KC',
    defaultMessage: 'Password',
  },
  github: {
    id: 'studio.wO9wb5',
    defaultMessage: 'GitHub',
  },
  gitlab: {
    id: 'studio.WMDO+N',
    defaultMessage: 'GitLab',
  },
  google: {
    id: 'studio.lzgH40',
    defaultMessage: 'Google',
  },
  mappings: {
    id: 'studio.V66Dvb',
    defaultMessage: 'Group-to-role mappings',
  },
  mappingHelp: {
    id: 'studio.AY9MA0',
    defaultMessage:
      'Staff receive the combined permissions of matching groups. No matching group grants no organization access.',
  },
  mapping: {
    id: 'studio.BJXtVa',
    defaultMessage: 'Group mapping {number}',
  },
  group: {
    id: 'studio.HpoDwk',
    defaultMessage: 'Group',
  },
  role: {
    id: 'studio.QNPJfb',
    defaultMessage: 'Organization role',
  },
  addMapping: {
    id: 'studio.WaVgGm',
    defaultMessage: 'Add group mapping',
  },
  removeMapping: {
    id: 'studio.bZ517R',
    defaultMessage: 'Remove group mapping {number}',
  },
  save: {
    id: 'studio.gCeNmM',
    defaultMessage: 'Save single sign-on settings',
  },
  saved: {
    id: 'studio.oHAq1k',
    defaultMessage: 'Single sign-on settings saved.',
  },
  saveError: {
    id: 'studio.a0/ndS',
    defaultMessage: 'Unable to save single sign-on settings.',
  },
  remove: {
    id: 'studio.V5HfT6',
    defaultMessage: 'Remove single sign-on configuration',
  },
  removeBody: {
    id: 'studio.W29XoK',
    defaultMessage: "Remove this organization's single sign-on configuration?",
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  configureLogin: {
    id: 'studio.3NHM4S',
    defaultMessage: 'Sign in or link your organization account',
  },
});
