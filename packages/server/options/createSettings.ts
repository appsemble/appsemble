import {
  type CreateSettingsParams,
  createSettings as createUtilsSettings,
} from '@appsemble/node-utils';
import { parseBlockName } from '@appsemble/utils';
import { Op } from 'sequelize';

import {
  App,
  AppOAuth2Secret,
  AppSamlSecret,
  AppSnapshot,
  BlockAsset,
  BlockVersion,
} from '../models/index.js';
import { createGtagCode } from '../utils/render.js';
import { getSentryClientSettings } from '../utils/sentry.js';

export async function createSettings({
  app,
  host,
  hostname,
  identifiableBlocks,
  languages,
}: CreateSettingsParams): Promise<[digest: string, script: string]> {
  const blockManifests = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version', 'layout', 'actions', 'events'],
    include: [
      {
        attributes: ['filename'],
        model: BlockAsset,
        where: {
          BlockVersionId: { [Op.col]: 'BlockVersion.id' },
        },
      },
    ],
    where: {
      [Op.or]: identifiableBlocks.map(({ type, version }) => {
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore Messed up
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  const persistedApp = await App.findOne({
    attributes: [
      'id',
      'icon',
      'updated',
      'OrganizationId',
      'sentryDsn',
      'sentryEnvironment',
      'vapidPublicKey',
      'definition',
      'showAppsembleLogin',
      'showAppsembleOAuth2Login',
      'enableSelfRegistration',
      'demoMode',
      'googleAnalyticsID',
      'controllerCode',
      'controllerImplementations',
      'displayAppMemberName',
      'displayInstallationPrompt',
    ],
    where: { id: app.id },
    include: [
      {
        attributes: ['icon', 'id', 'name'],
        model: AppOAuth2Secret,
      },
      {
        attributes: ['icon', 'id', 'name'],
        model: AppSamlSecret,
      },
      {
        attributes: ['id'],
        order: [['created', 'DESC']],
        limit: 1,
        model: AppSnapshot,
      },
    ],
  });

  const { sentryDsn, sentryEnvironment } = getSentryClientSettings(
    hostname,
    persistedApp.sentryDsn,
    persistedApp.sentryEnvironment,
  );

  return createUtilsSettings(
    {
      apiUrl: host,
      appControllerCode: persistedApp.controllerCode,
      appControllerImplementations: persistedApp.controllerImplementations,
      blockManifests: blockManifests.map(
        ({ BlockAssets, OrganizationId, actions, events, layout, name, version }) => ({
          name: `@${OrganizationId}/${name}`,
          version,
          layout,
          actions,
          events,
          files: BlockAssets.map(({ filename }) => filename),
        }),
      ),
      id: persistedApp.id,
      languages,
      logins: [
        ...persistedApp.AppOAuth2Secrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'oauth2',
        })),
        ...persistedApp.AppSamlSecrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'saml',
        })),
      ],
      vapidPublicKey: persistedApp.vapidPublicKey,
      definition: persistedApp.definition,
      snapshotId: persistedApp.AppSnapshots?.[0]?.id,
      demoMode: persistedApp.demoMode,
      showAppsembleLogin: persistedApp.showAppsembleLogin ?? false,
      displayAppMemberName: persistedApp.displayAppMemberName ?? false,
      displayInstallationPrompt: persistedApp.displayInstallationPrompt ?? false,
      showAppsembleOAuth2Login: persistedApp.showAppsembleOAuth2Login ?? true,
      enableSelfRegistration: persistedApp.enableSelfRegistration ?? true,
      showDemoLogin: persistedApp.demoMode ?? false,
      sentryDsn,
      sentryEnvironment,
      appUpdated: persistedApp.updated.toISOString(),
    },
    app.googleAnalyticsID ? createGtagCode(app.googleAnalyticsID) : undefined,
  );
}
