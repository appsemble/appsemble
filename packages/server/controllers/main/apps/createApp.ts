import {
  AppsembleError,
  handleValidatorResult,
  updateCompanionContainers,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { type AppDefinition, OrganizationPermission } from '@appsemble/types';
import { normalize, validateAppDefinition, validateStyle } from '@appsemble/utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';
import webpush from 'web-push';
import { parse } from 'yaml';

import { App, AppMember, AppSnapshot, Organization, transactional } from '../../../models/index.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
  setAppPath,
} from '../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { getBlockVersions } from '../../../utils/block.js';

export async function createApp(ctx: Context): Promise<void> {
  const {
    openApi,
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

  let result: Partial<App>;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateApps],
  });

  try {
    const definition = parse(yaml, { maxAliasCount: 10_000 }) as AppDefinition;

    handleValidatorResult(
      ctx,
      openApi.validate(definition, openApi.document.components.schemas.AppDefinition, {
        throw: false,
      }),
      'App validation failed',
    );

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

    let record: App;
    try {
      await transactional(async (transaction) => {
        record = await App.create(result, { transaction });

        record.AppSnapshots = [
          await AppSnapshot.create({ AppId: record.id, yaml }, { transaction }),
        ];

        record.AppScreenshots = screenshots?.length
          ? await createAppScreenshots(record.id, screenshots, transaction, ctx)
          : [];

        record.AppReadmes = readmes?.length
          ? await createAppReadmes(record.id, readmes, transaction)
          : [];

        if (dryRun === 'true') {
          // Manually calling `await transaction.rollback()` causes an error
          // when the transaction goes out of scope.
          throw new AppsembleError('Dry run');
        }
      });
      if (record.definition.cron && record.definition.security?.cron) {
        const identifier = Math.random().toString(36).slice(2);
        const cronEmail = `cron-${identifier}@example.com`;
        record.AppMembers = [
          await AppMember.create({ AppId: record.id, role: 'cron', email: cronEmail }),
        ];
      }
    } catch (error: unknown) {
      // AppsembleError is only thrown when dryRun is set, meaning it’s only used to test
      if (error instanceof AppsembleError) {
        ctx.status = 204;
        return;
      }

      throw error;
    }

    const containerDefinitions = record.containers;

    if (containerDefinitions && containerDefinitions.length > 0) {
      await updateCompanionContainers(
        containerDefinitions,
        record.path,
        String(record.id),
        record.registry,
      );
    }

    record.Organization = await Organization.findByPk(record.OrganizationId, {
      attributes: {
        include: ['id', 'name', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
    });
    ctx.body = record.toJSON();
    ctx.status = 201;
  } catch (error: unknown) {
    handleAppValidationError(ctx, error as Error, result);
  }
}
