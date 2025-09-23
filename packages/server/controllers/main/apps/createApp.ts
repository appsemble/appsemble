import {
  type AppDefinition,
  AppValidator,
  normalize,
  validateAppDefinition,
} from '@appsemble/lang-sdk';
import {
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

import { App, AppSnapshot, getAppDB, getDB, Organization } from '../../../models/index.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
  setAppPath,
} from '../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { getBlockVersions } from '../../../utils/block.js';
import { createDynamicIndexes } from '../../../utils/dynamicIndexes.js';

export async function createApp(ctx: Context): Promise<void> {
  const {
    request: {
      body: {
        OrganizationId,
        controllerCode,
        controllerImplementations,
        coreStyle,
        demoMode,
        domain,
        googleAnalyticsID,
        icon,
        iconBackground,
        maskableIcon,
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
    };
    result.containers = definition.containers;
    result.registry = definition.registry;
    if (icon) {
      result.icon = await uploadToBuffer(icon.path);
    }

    if (maskableIcon) {
      result.maskableIcon = await uploadToBuffer(maskableIcon.path);
    }

    await setAppPath(ctx, result, path);

    const db = getDB();
    const transaction = await db.transaction();
    try {
      const app = await App.create(result);

      app.AppSnapshots = [await AppSnapshot.create({ AppId: app.id, yaml }, { transaction })];

      app.AppScreenshots = screenshots?.length
        ? await createAppScreenshots(app.id, screenshots, transaction, ctx)
        : [];

      app.AppReadmes = readmes?.length ? await createAppReadmes(app.id, readmes, transaction) : [];

      const { AppMember, sequelize } = await getAppDB(app.id);
      const appTransaction = await sequelize.transaction();

      try {
        if (app.definition.resources) {
          Object.entries(app.definition.resources ?? {}).map(
            ([resourceType, { enforceOrderingGroupByFields, positioning }]) => {
              if (positioning && enforceOrderingGroupByFields) {
                createDynamicIndexes(
                  enforceOrderingGroupByFields,
                  app.id,
                  resourceType,
                  appTransaction,
                );
              }
            },
          );
        }

        if (app.definition.cron && app.definition.security?.cron) {
          const identifier = Math.random().toString(36).slice(2);
          const cronEmail = `cron-${identifier}@example.com`;
          await AppMember.create(
            { role: 'cron', email: cronEmail },
            { transaction: appTransaction },
          );
        }
      } catch (error) {
        await appTransaction.rollback();
        await transaction.rollback();
        throw error;
      }

      const containerDefinitions = app.containers;

      if (containerDefinitions && containerDefinitions.length > 0) {
        await updateCompanionContainers(
          containerDefinitions,
          app.path,
          String(app.id),
          app.registry,
        );
      }

      app.Organization = organization;

      if (dryRun === 'true') {
        await appTransaction.rollback();
        await transaction.rollback();
        await app.destroy({ force: true });
        ctx.status = 204;
      } else {
        await appTransaction.commit();
        await transaction.commit();
        ctx.body = app.toJSON();
        ctx.status = 201;
      }
    } catch (error: unknown) {
      handleAppValidationError(ctx, error as Error, result);
    }
  } catch (error: unknown) {
    // @ts-expect-error Messed up
    handleAppValidationError(ctx, error as Error, result);
  }
}
