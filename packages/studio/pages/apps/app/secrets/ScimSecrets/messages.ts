import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  loadingError: {
    id: 'studio.82Hk0t',
    defaultMessage: 'There was a problem loading the SCIM settings',
  },
  loadingMessage: { id: 'studio.P8rKGb', defaultMessage: 'Loading SCIM settings…' },
  submitError: {
    id: 'studio.xoo3WL',
    defaultMessage: 'There was a problem saving the SCIM settings',
  },
  enabledLabel: { id: 'studio.3p36Vm', defaultMessage: 'Enable SCIM' },
  enabledHelp: { id: 'studio.dXuEkZ', defaultMessage: 'Check to enable SCIM for this app' },
  tenantUrlLabel: { id: 'studio.cB7Zdd', defaultMessage: 'Tenant URL' },
  tenantUrlHelp: { id: 'studio.LQiBIn', defaultMessage: 'The SCIM tenant URL ' },
  tenantUrlCopySuccess: { id: 'studio.IsDF9d', defaultMessage: 'Copied tenant URL to clipboard' },
  tenantUrlCopyError: { id: 'studio.NBoEQT', defaultMessage: 'Failed to copy tenant URL' },
  tokenLabel: { id: 'studio.sEJCEI', defaultMessage: 'SCIM token' },
  tokenHelp: { id: 'studio.EHWpHU', defaultMessage: 'The secret SCIM token' },
  tokenCopySuccess: { id: 'studio.gbP/8K', defaultMessage: 'Copied token to clipboard' },
  tokenCopyError: { id: 'studio.L8rCdY', defaultMessage: 'Failed to copy token' },
  regenerate: { id: 'studio.w9ZBOn', defaultMessage: 'Regenerate SCIM token' },
  confirmGenerateBody: {
    id: 'studio.goBx7K',
    defaultMessage: 'Regenerating the SCIM token will invalidate the old token.',
  },
  cancel: { id: 'studio.47FYwb', defaultMessage: 'Cancel' },
  confirmGenerate: { id: 'studio.6PgVSe', defaultMessage: 'Regenerate' },
});
