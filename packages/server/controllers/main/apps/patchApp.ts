import { type AppDefinition, AppValidator, validateAppDefinition } from '@appsemble/lang-sdk';
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
import { parse } from 'yaml';

import {
  App,
  AppMember,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Organization,
  Resource,
  transactional,
} from '../../../models/index.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
} from '../../../utils/app.js';
import { argv } from '../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { getBlockVersions } from '../../../utils/block.js';
import { checkAppLock } from '../../../utils/checkAppLock.js';
import { encrypt } from '../../../utils/crypto.js';
import { createDynamicIndexes } from '../../../utils/dynamicIndexes.js';

export async function patchApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        controllerCode,
        controllerImplementations,
        coreStyle,
        demoMode,
        displayAppMemberName,
        displayInstallationPrompt,
        domain,
        emailHost,
        emailName,
        emailPassword,
        emailPort,
        emailSecure,
        emailUser,
        enableSelfRegistration,
        enableUnsecuredServiceSecrets,
        googleAnalyticsID,
        icon,
        iconBackground,
        maskableIcon,
        path,
        readmes,
        screenshots,
        sentryDsn,
        sentryEnvironment,
        sharedStyle,
        showAppDefinition,
        showAppsembleLogin,
        showAppsembleOAuth2Login,
        skipGroupInvites,
        template,
        visibility,
        yaml,
      },
    },
    user,
  } = ctx;

  const result: Partial<App> = {};

  const dbApp = await App.findOne({
    where: { id: appId },
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      { model: AppScreenshot, attributes: ['id'] },
      { model: AppReadme, attributes: ['id'] },
    ],
  });

  assertKoaCondition(dbApp != null, ctx, 404, 'App not found');

  checkAppLock(ctx, dbApp);

  try {
    const permissionsToCheck: OrganizationPermission[] = [];
    if (yaml) {
      permissionsToCheck.push(OrganizationPermission.UpdateApps);

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

      result.definition = definition;
      if (definition.cron && definition.security?.cron) {
        const appMember = await AppMember.findOne({
          where: {
            AppId: appId,
            role: 'cron',
          },
        });

        if (!appMember) {
          const identifier = Math.random().toString(36).slice(2);
          const cronEmail = `cron-${identifier}@example.com`;
          await AppMember.create({
            email: cronEmail,
            role: 'cron',
            AppId: appId,
          });
        }
      }
      // Make the actual update
      await updateCompanionContainers(
        definition.containers ?? [],
        dbApp.path,
        String(appId),
        definition.registry,
      );

      result.containers = definition.containers;
      result.registry = definition.registry;
    }

    if (path) {
      result.path = path;
    }

    if (visibility !== undefined) {
      result.visibility = visibility;
    }

    if (template !== undefined) {
      result.template = template;
    }

    if (demoMode !== undefined) {
      result.demoMode = demoMode;
    }

    if (domain !== undefined) {
      result.domain = domain;
    }

    if (emailName !== undefined) {
      result.emailName = emailName;
    }

    if (emailHost !== undefined) {
      result.emailHost = emailHost;
    }

    if (emailPassword !== undefined) {
      result.emailPassword = (emailPassword as string).length
        ? encrypt(emailPassword, argv.aesSecret)
        : undefined;
    }

    if (emailUser !== undefined) {
      result.emailUser = emailUser;
    }

    if (emailPort !== undefined) {
      const port = Number(emailPort);
      result.emailPort = Number.isFinite(port) ? port : 587;
    }

    if (emailSecure !== undefined) {
      result.emailSecure = emailSecure;
    }

    if (googleAnalyticsID !== undefined) {
      result.googleAnalyticsID = googleAnalyticsID;
    }

    if (showAppDefinition !== undefined) {
      result.showAppDefinition = showAppDefinition;
    }

    if (sentryDsn !== undefined) {
      result.sentryDsn = sentryDsn;
    }

    if (sentryEnvironment !== undefined) {
      result.sentryEnvironment = sentryEnvironment;
    }

    if (showAppsembleLogin !== undefined) {
      result.showAppsembleLogin = showAppsembleLogin;
    }

    if (displayAppMemberName !== undefined) {
      result.displayAppMemberName = displayAppMemberName;
    }

    if (displayInstallationPrompt !== undefined) {
      result.displayInstallationPrompt = displayInstallationPrompt;
    }

    if (skipGroupInvites !== undefined) {
      result.skipGroupInvites = skipGroupInvites;
    }

    if (showAppsembleOAuth2Login !== undefined) {
      result.showAppsembleOAuth2Login = showAppsembleOAuth2Login;
    }

    if (enableSelfRegistration !== undefined) {
      result.enableSelfRegistration = enableSelfRegistration;
    }

    if (enableUnsecuredServiceSecrets !== undefined) {
      result.enableUnsecuredServiceSecrets = enableUnsecuredServiceSecrets;
    }

    if (coreStyle !== undefined) {
      result.coreStyle = validateStyle(coreStyle);
    }

    if (sharedStyle !== undefined) {
      result.sharedStyle = validateStyle(sharedStyle);
    }

    if (icon) {
      result.icon = await uploadToBuffer(icon.path);
    }

    if (maskableIcon) {
      result.maskableIcon = await uploadToBuffer(maskableIcon.path);
    }

    if (iconBackground) {
      result.iconBackground = iconBackground;
    }

    result.controllerCode = ['', undefined].includes(controllerCode) ? null : controllerCode;
    result.controllerImplementations = ['', undefined].includes(controllerImplementations)
      ? null
      : controllerImplementations;

    if (
      domain !== undefined ||
      path !== undefined ||
      visibility !== undefined ||
      template !== undefined ||
      icon !== undefined ||
      maskableIcon !== undefined ||
      iconBackground !== undefined
    ) {
      permissionsToCheck.push(OrganizationPermission.UpdateAppSettings);
    }

    if (screenshots?.length) {
      permissionsToCheck.push(
        OrganizationPermission.DeleteAppScreenshots,
        OrganizationPermission.CreateAppScreenshots,
      );
    }

    if (readmes?.length) {
      permissionsToCheck.push(
        OrganizationPermission.DeleteAppReadmes,
        OrganizationPermission.CreateAppReadmes,
      );
    }

    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: dbApp.OrganizationId,
      requiredPermissions: permissionsToCheck,
    });

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      if (yaml) {
        const snapshot = await AppSnapshot.create(
          { AppId: dbApp.id, UserId: user!.id, yaml },
          { transaction },
        );
        dbApp.AppSnapshots = [snapshot];
      }
      if (result.definition?.resources) {
        for (const [key, { enforceOrderingGroupByFields, positioning }] of Object.entries(
          result.definition.resources,
        )) {
          if (positioning) {
            let group: string[] | undefined;
            if (enforceOrderingGroupByFields) {
              createDynamicIndexes(enforceOrderingGroupByFields, appId, key, transaction);
              group = enforceOrderingGroupByFields.map((field) => `data.${field}`);
            }
            const resourcesToUpdate = await Resource.findAll({
              where: { AppId: appId, type: key },
              // Reset positions every time the app is updated
              order: [...(group ?? []), ['Position', 'ASC'], ['updated', 'DESC']],
              transaction,
            });
            await Resource.update(
              { Position: null },
              { where: { AppId: appId, type: key }, transaction },
            );

            for (const [i, element] of resourcesToUpdate.entries()) {
              // If we start with 0, insertion at top becomes impossible unless we move the first
              // item.
              await element.update({ Position: (i + 1) * 10 }, { transaction });
            }
          }
        }
      }

      if (screenshots?.length) {
        await AppScreenshot.destroy({ where: { AppId: appId }, transaction });
        dbApp.AppScreenshots = await createAppScreenshots(appId, screenshots, transaction, ctx);
      }

      if (readmes?.length) {
        await AppReadme.destroy({ where: { AppId: appId }, transaction });
        dbApp.AppReadmes = await createAppReadmes(appId, readmes, transaction);
      }
    });

    ctx.body = dbApp.toJSON();
  } catch (error: unknown) {
    handleAppValidationError(ctx, error as Error, result);
  }
}
