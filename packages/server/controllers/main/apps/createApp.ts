import {
  type AppDefinition,
  AppValidator,
  normalize,
  validateAppDefinition,
} from '@appsemble/lang-sdk';
import {
  AppsembleError,
  assertKoaCondition,
  handleValidatorResult,
  updateCompanionContainers,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { validateStyle } from '@appsemble/utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';
import webpush from 'web-push';
import { parse } from 'yaml';

import { App, AppSnapshot, getAppDB, Organization, transactional } from '../../../models/index.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
  setAppPath,
} from '../../../utils/app.js';
import { argv } from '../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { getBlockVersions } from '../../../utils/block.js';
import { checkAppLimit } from '../../../utils/checkAppLimit.js';
import { encrypt } from '../../../utils/crypto.js';
import { createDynamicIndexes } from '../../../utils/dynamicIndexes.js';

export async function createApp(ctx: Context): Promise<void> {
  const {
    request: {
      body: {
        OrganizationId,
        controllerCode,
        controllerImplementations,
        coreStyle,
        dbHost,
        dbName,
        dbPassword,
        dbPort,
        dbUser,
        demoMode,
        domain,
        googleAnalyticsID,
        icon,
        iconBackground,
        maskableIcon,
        metaPixelID,
        readmes,
        screenshots,
        sentryDsn,
        sentryEnvironment,
        sharedStyle,
        showAppDefinition = true,
        template = false,
        visibility,
        yaml,
      },
      query: { dryRun },
    },
  } = ctx;

  const organization = await Organization.findByPk(OrganizationId, {
    attributes: {
      include: ['id', 'name', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
    },
  });
  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  let result: Partial<App>;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateApps],
  });

  try {
    const definition = parse(yaml, { maxAliasCount: 10_000 }) as AppDefinition;

    const appValidator = new AppValidator();

    handleValidatorResult(ctx, appValidator.validateApp(definition), 'App validation failed');

    handleValidatorResult(
      ctx,
      await validateAppDefinition(
        definition,
        getBlockVersions,
        controllerImplementations ? JSON.parse(controllerImplementations) : undefined,
      ),
      'App validation failed',
    );

    const path = normalize(definition.name);
    const keys = webpush.generateVAPIDKeys();

    result = {
      definition,
      OrganizationId,
      coreStyle: validateStyle(coreStyle),
      googleAnalyticsID,
      metaPixelID,
      iconBackground: iconBackground || '#ffffff',
      sharedStyle: validateStyle(sharedStyle),
      domain: domain || null,
      showAppDefinition,
      visibility,
      template: Boolean(template),
      sentryDsn,
      sentryEnvironment,
      showAppsembleLogin: false,
      showAppsembleOAuth2Login: true,
      enableSelfRegistration: true,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      demoMode: Boolean(demoMode),
      controllerCode,
      controllerImplementations,
      displayAppMemberName: false,
      displayInstallationPrompt: false,
      dbName,
      dbHost,
      dbPort,
      dbUser,
    };

    if (dbPassword) {
      if (!argv.aesSecret && process.env.NODE_ENV === 'production') {
        throw new AppsembleError(
          'Missing aes secret env variable. This is insecure and should be allowed only in development!',
        );
      }
      result.dbPassword = encrypt(
        dbPassword,
        argv.aesSecret || 'Local Appsemble development AES secret',
      );
    }

    result.containers = definition.containers;
    result.registry = definition.registry;
    if (icon) {
      result.icon = await uploadToBuffer(icon.path);
    }

    if (maskableIcon) {
      result.maskableIcon = await uploadToBuffer(maskableIcon.path);
    }

    await setAppPath(ctx, result, path);

    let createdApp: App;
    try {
      createdApp = await transactional(async (transaction) => {
        const app = await App.create(result, { transaction });

        await checkAppLimit(ctx, app);

        app.AppSnapshots = [await AppSnapshot.create({ AppId: app.id, yaml }, { transaction })];

        app.AppScreenshots = screenshots?.length
          ? await createAppScreenshots(app.id, screenshots, transaction, ctx)
          : [];

        app.AppReadmes = readmes?.length
          ? await createAppReadmes(app.id, readmes, transaction)
          : [];

        if (dryRun === 'true') {
          // Manually calling `await transaction.rollback()` causes an error
          // when the transaction goes out of scope.
          throw new AppsembleError('Dry run');
        }

        return app;
      });
    } catch (error: unknown) {
      if (error instanceof AppsembleError && error.message === 'Dry run') {
        ctx.status = 204;
        return;
      }

      throw error;
    }

    const { AppMember, sequelize: appDB } = await getAppDB(createdApp.id);
    try {
      await appDB.transaction(async (appTransaction) => {
        if (createdApp.definition.resources) {
          Object.entries(createdApp.definition.resources ?? {}).map(
            ([resourceType, { enforceOrderingGroupByFields, positioning }]) => {
              if (positioning && enforceOrderingGroupByFields) {
                createDynamicIndexes(
                  enforceOrderingGroupByFields,
                  createdApp.id,
                  resourceType,
                  appTransaction,
                );
              }
            },
          );
        }

        if (createdApp.definition.cron && createdApp.definition.security?.cron) {
          const identifier = Math.random().toString(36).slice(2);
          const cronEmail = `cron-${identifier}@example.com`;
          await AppMember.create(
            { role: 'cron', email: cronEmail },
            { transaction: appTransaction },
          );
        }

        if (dryRun === 'true') {
          throw new AppsembleError('Dry run');
        }
      });
    } catch (error) {
      // AppsembleError is only thrown when dryRun is set, meaning it’s only used to test
      if (error instanceof AppsembleError) {
        await App.destroy({ where: { id: createdApp.id }, force: true });
        ctx.status = 204;
        return;
      }

      throw error;
    }

    const containerDefinitions = createdApp.containers;

    if (containerDefinitions && containerDefinitions.length > 0) {
      await updateCompanionContainers(
        containerDefinitions,
        createdApp.path,
        String(createdApp.id),
        createdApp.registry,
      );
    }

    createdApp.Organization = organization;
    ctx.body = createdApp.toJSON();
    ctx.status = 201;
  } catch (error: unknown) {
    // @ts-expect-error Messed up
    handleAppValidationError(ctx, error as Error, result);
  }
}
