import { AppValidator, normalize, schemas, validateAppDefinition } from '@appsemble/lang-sdk';
import {
  AppsembleError,
  assertKoaCondition,
  handleValidatorResult,
  updateCompanionContainers,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { type AppDefinition, OrganizationPermission } from '@appsemble/types';
import { validateStyle } from '@appsemble/utils';
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
import { createDynamicIndexes } from '../../../utils/dynamicIndexes.js';

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

    // TODO: something other than that
    // createValidator();
    const appValidator = new AppValidator();

    // handleValidatorResult(
    //   ctx,
    //   // TODO: fix
    //   openApi!.validate(definition, schemas.AppDefinition, {
    //     throw: false,
    //   }),
    //   'App validation failed',
    // );
    //
    // TODO: do we even need two validators?
    handleValidatorResult(ctx, appValidator.validateApp(definition), 'App validation failed');

    // TODO: this is exactly where issue 1854 happens
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
      let rec: App | undefined;
      await transactional(async (transaction) => {
        rec = await App.create(result, { transaction });

        rec.AppSnapshots = [await AppSnapshot.create({ AppId: rec.id, yaml }, { transaction })];

        rec.AppScreenshots = screenshots?.length
          ? await createAppScreenshots(rec.id, screenshots, transaction, ctx)
          : [];

        rec.AppReadmes = readmes?.length
          ? await createAppReadmes(rec.id, readmes, transaction)
          : [];

        if (rec.definition.resources) {
          Object.entries(rec.definition.resources ?? {}).map(
            ([resourceType, { enforceOrderingGroupByFields, positioning }]) => {
              if (positioning && enforceOrderingGroupByFields) {
                createDynamicIndexes(
                  enforceOrderingGroupByFields,
                  rec!.id,
                  resourceType,
                  transaction,
                );
              }
            },
          );
        }

        if (dryRun === 'true') {
          // Manually calling `await transaction.rollback()` causes an error
          // when the transaction goes out of scope.
          throw new AppsembleError('Dry run');
        }
      });
      record = rec!;
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

    record.Organization = organization;
    ctx.body = record.toJSON();
    ctx.status = 201;
  } catch (error: unknown) {
    // @ts-expect-error Messed up
    handleAppValidationError(ctx, error as Error, result);
  }
}
