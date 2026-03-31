import { parseBlockName, type AppDefinition } from '@appsemble/lang-sdk';
import {
  type CreateSettingsParams,
  createSettings as createUtilsSettings,
} from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { Op } from 'sequelize';

import { App, AppSnapshot, BlockAsset, BlockVersion, getAppDB } from '../models/index.js';
import { createGtagCode, createMetaPixelCode, createMSClarityCode } from '../utils/render.js';
import { getSentryClientSettings } from '../utils/sentry.js';

function sanitizeAppDefinitionForPublicSettings(
  definition: AppDefinition,
  showAppDefinition: boolean,
): AppDefinition {
  if (showAppDefinition || !definition.security) {
    return definition;
  }

  return {
    ...definition,
    security: {
      ...definition.security,
      ...(definition.security.guest
        ? {
            guest: {
              ...definition.security.guest,
              permissions: undefined,
            },
          }
        : {}),
      ...(definition.security.cron
        ? {
            cron: {
              ...definition.security.cron,
              permissions: undefined,
            },
          }
        : {}),
      ...(definition.security.roles
        ? {
            roles: Object.fromEntries(
              Object.entries(definition.security.roles).map(([name, role]) => [
                name,
                {
                  ...role,
                  permissions: undefined,
                },
              ]),
            ),
          }
        : {}),
    },
  };
}

export async function createSettings({
  app,
  host,
  hostname,
  identifiableBlocks,
  languages,
  nonce,
}: CreateSettingsParams): Promise<[digest: string, script: string]> {
  const { AppOAuth2Secret, AppSamlSecret } = await getAppDB(app.id!);
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Messed up
        const [OrganizationId, name] = parseBlockName(type);
        return { name, OrganizationId, version };
      }),
    },
  });

  const persistedApp = (await App.findOne({
    attributes: [
      'definition',
      'id',
      'icon',
      'updated',
      'OrganizationId',
      'sentryDsn',
      'sentryEnvironment',
      'vapidPublicKey',
      'showAppsembleLogin',
      'showAppsembleOAuth2Login',
      'enableSelfRegistration',
      'demoMode',
      'googleAnalyticsID',
      'metaPixelID',
      'msClarityID',
      'controllerCode',
      'controllerImplementations',
      'displayAppMemberName',
      'displayInstallationPrompt',
      'supportedLanguages',
      'totp',
    ],
    where: { id: app.id },
    include: [
      {
        attributes: ['id'],
        order: [['created', 'DESC']],
        limit: 1,
        model: AppSnapshot,
      },
    ],
  }))!;

  const appOAuth2Secrets = await AppOAuth2Secret.findAll({ attributes: ['icon', 'id', 'name'] });
  const appSamlSecrets = await AppSamlSecret.findAll({ attributes: ['icon', 'id', 'name'] });

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
          files: (BlockAssets ?? []).map(({ filename }) => filename),
        }),
      ),
      id: persistedApp.id,
      languages,
      logins: [
        ...appOAuth2Secrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'oauth2',
        })),
        ...appSamlSecrets.map(({ icon, id, name }) => ({
          icon,
          id,
          name,
          type: 'saml',
        })),
      ],
      vapidPublicKey: persistedApp.vapidPublicKey,
      definition: sanitizeAppDefinitionForPublicSettings(
        persistedApp.definition,
        app.showAppDefinition,
      ),
      snapshotId: persistedApp.AppSnapshots?.[0]?.id,
      demoMode: persistedApp.demoMode,
      showAppsembleLogin: persistedApp.showAppsembleLogin ?? false,
      displayAppMemberName: persistedApp.displayAppMemberName ?? false,
      displayInstallationPrompt: persistedApp.displayInstallationPrompt ?? false,
      showAppsembleOAuth2Login: persistedApp.showAppsembleOAuth2Login ?? true,
      enableSelfRegistration: persistedApp.enableSelfRegistration ?? true,
      showDemoLogin: persistedApp.demoMode ?? false,
      totp: persistedApp.totp ?? 'disabled',
      sentryDsn,
      sentryEnvironment,
      appUpdated: persistedApp.updated.toISOString(),
      e2e: process.env.E2E,
      supportedLanguages: persistedApp.supportedLanguages ?? [
        app.definition.defaultLanguage ?? defaultLocale,
      ],
    },
    Boolean(app.metaPixelID) || Boolean(app.msClarityID) ? nonce : undefined,
    [
      ...(app.googleAnalyticsID ? createGtagCode(app.googleAnalyticsID) : []),
      ...(app.metaPixelID ? createMetaPixelCode(app.metaPixelID) : []),
      ...(app.msClarityID ? createMSClarityCode(app.msClarityID) : []),
    ],
  );
}
