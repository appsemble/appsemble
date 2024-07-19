import {
  assertKoaError,
  handleValidatorResult,
  updateCompanionContainers,
} from '@appsemble/node-utils';
import { type AppDefinition } from '@appsemble/types';
import { OrganizationPermission, validateAppDefinition, validateStyle } from '@appsemble/utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';
import { parse } from 'yaml';

import {
  App,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Organization,
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

export async function patchApp(ctx: Context): Promise<void> {
  const {
    openApi,
    pathParams: { appId },
    request: {
      body: {
        controllerCode,
        controllerImplementations,
        coreStyle,
        demoMode,
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
        template,
        visibility,
        yaml,
      },
    },
    user,
  } = ctx;

  let result: Partial<App>;

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

  assertKoaError(!dbApp, ctx, 404, 'App not found');

  checkAppLock(ctx, dbApp);

  try {
    result = {};

    const permissionsToCheck: OrganizationPermission[] = [];
    if (yaml) {
      permissionsToCheck.push(OrganizationPermission.UpdateApps);

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
      result.definition = definition;

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
        : null;
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
      result.icon = icon.contents;
    }

    if (maskableIcon) {
      result.maskableIcon = maskableIcon.contents;
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

    await checkUserOrganizationPermissions(ctx, dbApp.OrganizationId, permissionsToCheck);

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      if (yaml) {
        const snapshot = await AppSnapshot.create(
          { AppId: dbApp.id, UserId: user.id, yaml },
          { transaction },
        );
        dbApp.AppSnapshots = [snapshot];
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
