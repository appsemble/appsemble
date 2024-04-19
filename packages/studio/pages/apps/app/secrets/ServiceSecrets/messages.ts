import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.n7yYXG',
    defaultMessage: 'Service',
  },
  error: {
    id: 'studio.FL26DE',
    defaultMessage: 'There was a problem loading the service secrets.',
  },
  loading: {
    id: 'studio.meTsdt',
    defaultMessage: 'Loading service secrets …',
  },
  placeholder: {
    id: 'studio.AgUG6b',
    defaultMessage: 'example.com',
  },
  noSecrets: {
    id: 'studio.TAMTr1',
    defaultMessage: 'No service secrets have been configured yet.',
  },
  addNew: {
    id: 'studio.v9WChN',
    defaultMessage: 'Add new secret',
  },
  unsecuredServiceSecretsWarning: {
    id: 'studio.L0fXYF',
    defaultMessage:
      'Unsecured service secrets are enabled, this grants access to anyone to use your service authentication through Appsemble. Learn more in the <link>documentation</link>',
  },
  enableUnsecuredServiceSecrets: {
    id: 'studio.mlMiPK',
    defaultMessage: 'Whether app service secrets can be applied without a security definition.',
  },
  unsecuredWarningTitle: {
    id: 'studio.38YuKp',
    defaultMessage: 'Enable unsecured service secrets',
  },
  unsecuredWarning: {
    id: 'studio.KWe3xX',
    defaultMessage:
      '<bold>Enable at your own risk</bold>Whether app service secrets can be applied without a security definition. Learn more in the <link>documentation</link>',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  continue: {
    id: 'studio.38YuKp',
    defaultMessage: 'Enable unsecured service secrets',
  },
});
