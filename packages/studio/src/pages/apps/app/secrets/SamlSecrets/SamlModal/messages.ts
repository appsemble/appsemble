import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  modalTitle: 'SAML Secret',
  iconLabel: 'Icon',
  iconHelp: 'The FontAwesome icon that will be displayed on the login button',
  nameLabel: 'Name',
  nameHelp: 'The name that will be displayed on the login button',
  acsUrlLabel: 'Attribute consume service endpoint',
  acsUrlHelp: 'This URL serves metadata for Appsemble as service provider',
  acsUrlCopySuccess: 'Attribute consume service endpoint copied to clipboard',
  acsUrlCopyError: 'Failed to copy attribute consume service endpoint to clipboard',
  acsUrlPlaceholder: 'This will be generated once this secret is saved',
  idpEntityIdLabel: 'Identity provider entity ID',
  idpEntityIdHelp: 'This URL serves metadata for the identify provider',
  emailAttributeLabel: 'Email attribute',
  emailAttributeHelp:
    'If specified, this SAML attribute is used to determine the user’s email address',
  nameAttributeLabel: 'Name attribute',
  nameAttributeHelp:
    'If specified, this SAML attribute is used to determine the user’s display name',
  idpCertificateLabel: 'Identity provider certificate',
  idpCertificateHelp: 'The certificate that may be used to validate login requests',
  ssoUrlLabel: 'Login endpoint',
  ssoUrlHelp: 'This is where the user will be redirected when they press the login button',
  spEntityIdLabel: 'Service provider entity ID',
  spEntityIdHelp:
    'Copy this into the service provider entity ID field of the identity provider settings',
  spEntityIdCopySuccess: 'Service provider entity ID copied to clipboard',
  spEntityIdCopyError: 'Failed to copy service provider entity ID to clipboard',
  spEntityIdPlaceholder: 'This will be generated once this secret is saved',
  spCertificateLabel: 'Service provider certificate',
  spCertificateHelp: 'The certificate used to verify the service provider.',
  spCertificateCopySuccess: 'Service provider certificate copied to clipboard',
  spCertificateCopyError: 'Failed to copy the service provider certificate to clipboard',
  spCertificatePlaceholder: 'The certificate will be generated once this secret is saved',
  badUrl: 'This must be a valid URL',
  close: 'Close',
  save: 'Save secret',
  deleteWarningTitle: 'Deleting secret',
  deleteWarning: 'Are you sure you want to delete this secret? This action cannot be reverted.',
  cancel: 'Cancel',
  delete: 'Delete secret',
  deleteSuccess: 'Successfully deleted secret {name}',
  deleteButton: 'Delete secret',
});
