import { type AppDefinition } from '@appsemble/lang-sdk';
import {
  type CreateSettingsParams,
  createSettings as createUtilsSettings,
  logger,
} from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { parse } from 'yaml';

import { App, AppBuildSnapshot, AppSnapshot, getAppDB, transactional } from '../models/index.js';
import {
  createAppBuildManifest,
  getMissingBlockManifestIdentifiers,
  pruneAppBuildSnapshots,
  resolveBlockManifests,
} from '../utils/appBuildManifest.js';
import { createGtagCode, createMetaPixelCode, createMSClarityCode } from '../utils/render.js';
import { getSentryClientSettings } from '../utils/sentry.js';

function sanitizeAppDefinitionForPublicSettings(
  definition: AppDefinition,
  showAppDefinition: boolean,
): AppDefinition {
  const security =
    showAppDefinition || !definition.security
      ? definition.security
      : {
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
        };

  return {
    controller: definition.controller,
    defaultLanguage: definition.defaultLanguage,
    defaultPage: definition.defaultPage,
    layout: definition.layout
      ? {
          debug: definition.layout.debug,
          enabledSettings: definition.layout.enabledSettings,
          feedback: definition.layout.feedback,
          headerTag: definition.layout.headerTag,
          hideTitleBar: definition.layout.hideTitleBar,
          install: definition.layout.install,
          login: definition.layout.login,
          logo: definition.layout.logo,
          navigation: definition.layout.navigation,
          settings: definition.layout.settings,
          titleBarText: definition.layout.titleBarText,
        }
      : undefined,
    members: definition.members
      ? {
          phoneNumber: definition.members.phoneNumber,
        }
      : undefined,
    name: definition.name,
    notifications: definition.notifications,
    pages: definition.pages,
    resources: definition.resources,
    security,
    theme: definition.theme,
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
        attributes: ['id', 'yaml'],
        order: [['created', 'DESC']],
        limit: 1,
        model: AppSnapshot,
        include: [{ attributes: ['buildManifestJson'], model: AppBuildSnapshot, required: false }],
      },
    ],
  }))!;

  const latestSnapshot = persistedApp.AppSnapshots?.[0];
  let blockManifests = latestSnapshot?.AppBuildSnapshot?.buildManifestJson?.blockManifests;
  let shouldResolveBlockManifests: boolean = !blockManifests && !latestSnapshot;

  if (!blockManifests && latestSnapshot) {
    let buildManifestJson;

    try {
      const definition = parse(latestSnapshot.yaml, { maxAliasCount: 10_000 }) as AppDefinition;
      buildManifestJson = await createAppBuildManifest(definition);
      const missingBlockIdentifiers = getMissingBlockManifestIdentifiers(
        definition,
        buildManifestJson.blockManifests,
      );

      shouldResolveBlockManifests = Boolean(missingBlockIdentifiers.length);
    } catch (error) {
      logger.warn(`Failed to derive a build manifest from app snapshot ${latestSnapshot.id}.`);
      logger.error(error);
      shouldResolveBlockManifests = true;
    }

    if (buildManifestJson && !shouldResolveBlockManifests) {
      blockManifests = buildManifestJson.blockManifests;

      try {
        await transactional(async (transaction) => {
          const [, created] = await AppBuildSnapshot.findOrCreate({
            defaults: {
              AppSnapshotId: latestSnapshot.id,
              buildManifestJson,
            },
            transaction,
            where: { AppSnapshotId: latestSnapshot.id },
          });

          if (created) {
            await pruneAppBuildSnapshots({
              AppSnapshotId: latestSnapshot.id,
              appId: persistedApp.id,
              transaction,
            });
          }
        });
      } catch (error) {
        logger.warn(`Failed to persist a build manifest for app snapshot ${latestSnapshot.id}.`);
        logger.error(error);
      }
    }
  }

  if (shouldResolveBlockManifests) {
    blockManifests = await resolveBlockManifests({ identifiableBlocks });
  }

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
      blockManifests,
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
      snapshotId: latestSnapshot?.id,
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
