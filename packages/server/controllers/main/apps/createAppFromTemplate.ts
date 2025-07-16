import {
  assertKoaCondition,
  getS3File,
  getS3FileStats,
  throwKoaError,
  updateCompanionContainers,
  uploadS3File,
} from '@appsemble/node-utils';
import { getSubscriptionPlanByName, OrganizationPermission } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';
import webpush from 'web-push';
import { parseDocument } from 'yaml';

import {
  App,
  AppMessages,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  getAppDB,
  OrganizationSubscription,
} from '../../../models/index.js';
import { setAppPath } from '../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { createDynamicIndexes } from '../../../utils/dynamicIndexes.js';

export async function createAppFromTemplate(ctx: Context): Promise<void> {
  const {
    request: {
      body: {
        assets,
        description,
        name,
        organizationId,
        resources,
        secrets,
        templateId,
        variables,
        visibility,
      },
    },
    user,
  } = ctx;

  /**
   * XXX: This should include the existing YAML definition
   * when we get around to editing the YAML’s name/description values
   */
  const template = await App.findOne({
    where: { id: templateId },
    attributes: [
      'id',
      'definition',
      'coreStyle',
      'sharedStyle',
      'visibility',
      'showAppDefinition',
      'template',
      'OrganizationId',
      'demoMode',
      'scimEnabled',
      'sslKey',
    ],
    include: [
      { model: AppMessages, required: false },
      { model: AppSnapshot, limit: 1, order: [['created', 'desc']] },
      { model: AppScreenshot, required: false },
      { model: AppReadme, required: false },
    ],
  });

  const {
    AppBlockStyle: TemplateAppBlockStyle,
    AppOAuth2Secret: TemplateAppOAuth2Secret,
    AppSamlSecret: TemplateAppSamlSecret,
    AppServiceSecret: TemplateAppServiceSecret,
    AppVariable: TemplateAppVariable,
    Asset: TemplateAsset,
    Resource: TemplateResource,
  } = await getAppDB(templateId);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateApps],
  });

  assertKoaCondition(template != null, ctx, 404, `Template with ID ${templateId} does not exist.`);

  if (!template.template && (template.visibility === 'private' || !template.showAppDefinition)) {
    // Only allow cloning of unlisted apps if the user is part of the template’s organization.
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: template.OrganizationId,
      requiredPermissions: [OrganizationPermission.QueryApps],
    });
  }

  if (visibility === 'public') {
    const subscription = await OrganizationSubscription.findOne({
      where: { OrganizationId: organizationId },
    });
    assertKoaCondition(subscription != null, ctx, 404, 'Subscription not found');
    const subscriptionPlan = getSubscriptionPlanByName(String(subscription!.subscriptionPlan!));
    const appList = await App.findAll({
      where: { OrganizationId: organizationId },
    });
    const appCount = appList.filter((app) => app.visibility === 'public').length;
    assertKoaCondition(appCount < subscriptionPlan.appLimit, ctx, 403, 'App limit reached.');
  }

  const path = name ? normalize(name) : normalize(template.definition.name);
  try {
    const keys = webpush.generateVAPIDKeys();
    const result: Partial<App> = {
      definition: {
        ...template.definition,
        description,
        name: name || template.definition.name,
      },
      demoMode: template.demoMode,
      visibility,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      coreStyle: template.coreStyle,
      sharedStyle: template.sharedStyle,
      sslKey: '',
      sslCertificate: '',
      scimToken: Buffer.from('placeholder'),
      scimEnabled: template.scimEnabled,
      OrganizationId: organizationId,
      AppMessages: ([] as AppMessages[]).concat(template.AppMessages),
    };

    await setAppPath(ctx, result, path);

    for (const m of result.AppMessages!) {
      delete m.messages?.app?.name;
      delete m.messages?.app?.description;
    }
    const record = await App.create(result, { include: [AppMessages, AppScreenshot, AppReadme] });

    const {
      AppBlockStyle: RecordAppBlockStyle,
      AppOAuth2Secret: RecordAppOAuth2Secret,
      AppSamlSecret: RecordAppSamlSecret,
      AppServiceSecret: RecordAppServiceSecret,
      AppVariable: RecordAppVariables,
      Asset: RecordAsset,
      Resource: RecordResource,
    } = await getAppDB(record.id);

    const templateAppBlockStyles = await TemplateAppBlockStyle.findAll();
    if (templateAppBlockStyles.length) {
      await RecordAppBlockStyle.bulkCreate(
        templateAppBlockStyles.map((blockStyle) => ({
          AppId: record.id,
          block: blockStyle.block,
          style: blockStyle.style,
        })),
      );
    }

    if (assets) {
      const templateAssets = await TemplateAsset.findAll({ where: { clonable: true } });
      const recordAssets = await RecordAsset.bulkCreate(
        templateAssets.map(({ filename, id, mime, name: assetName, seed }) => ({
          id,
          mime,
          filename,
          name: assetName,
          seed,
        })),
      );
      for (const templateAsset of templateAssets) {
        const templateStream = await getS3File(`app-${template.id}`, templateAsset.id);
        const templateStats = await getS3FileStats(`app-${template.id}`, templateAsset.id);
        const createdAsset = recordAssets.find((asset) => asset.name === templateAsset.name);
        // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
        await uploadS3File(`app-${record.id}`, createdAsset.id, templateStream, templateStats.size);
      }
    }

    if (resources) {
      const templateResources = await TemplateResource.findAll({ where: { clonable: true } });
      await RecordResource.bulkCreate(
        templateResources.map(({ data, seed, type }) => ({
          type,
          data,
          seed,
        })),
      );
      Object.entries(template.definition.resources ?? {}).map(
        ([resourceType, { enforceOrderingGroupByFields, positioning }]) => {
          if (positioning && enforceOrderingGroupByFields) {
            createDynamicIndexes(enforceOrderingGroupByFields, record.id, resourceType);
          }
        },
      );
    }

    if (variables) {
      const templateAppVariables = await TemplateAppVariable.findAll();
      await RecordAppVariables.bulkCreate(
        templateAppVariables.map(({ name: variableName, value }) => ({
          name: variableName,
          value,
        })),
      );
    }

    if (secrets) {
      const templateAppOAuth2Secrets = await TemplateAppOAuth2Secret.findAll();
      await RecordAppOAuth2Secret.bulkCreate(
        templateAppOAuth2Secrets.map(
          ({
            authorizationUrl,
            icon,
            name: appOAuth2SecretName,
            remapper,
            scope,
            tokenUrl,
            userInfoUrl,
          }) => ({
            authorizationUrl,
            tokenUrl,
            userInfoUrl,
            remapper,
            icon,
            scope,
            name: appOAuth2SecretName,
            clientId: '',
            clientSecret: '',
          }),
        ),
      );

      const templateAppSamlSecrets = await TemplateAppSamlSecret.findAll();
      await RecordAppSamlSecret.bulkCreate(
        templateAppSamlSecrets.map(
          ({
            emailAttribute,
            entityId,
            icon,
            name: appSamlSecretName,
            nameAttribute,
            objectIdAttribute,
            ssoUrl,
          }) => ({
            name: appSamlSecretName,
            entityId,
            ssoUrl,
            icon,
            spPrivateKey: '',
            spPublicKey: '',
            spCertificate: '',
            idpCertificate: '',
            emailAttribute,
            nameAttribute,
            objectIdAttribute,
          }),
        ),
      );

      const templateAppServiceSecrets = await TemplateAppServiceSecret.findAll();
      await RecordAppServiceSecret.bulkCreate(
        templateAppServiceSecrets.map(
          ({
            authenticationMethod,
            identifier,
            name: appServiceSecretName,
            tokenUrl,
            urlPatterns,
          }) => ({
            name: appServiceSecretName,
            urlPatterns,
            authenticationMethod,
            identifier,
            tokenUrl,
            secret: Buffer.from('placeholder'),
          }),
        ),
      );
    }

    const doc = parseDocument(template.AppSnapshots[0].yaml);
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    doc.setIn(['description'], result.definition.description);
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    doc.setIn(['name'], result.definition.name);
    const snapshot = await AppSnapshot.create({
      AppId: record.id,
      UserId: user!.id,
      yaml: String(doc),
    });
    record.AppSnapshots = [snapshot];

    if (template.definition.containers && template.definition.containers.length > 0) {
      await updateCompanionContainers(
        template.definition.containers,
        record.path,
        String(record.id),
        template.registry,
      );
    }

    ctx.body = record.toJSON();
    ctx.status = 201;
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `Another app with path “${path}” already exists`);
    }
    throw error;
  }
}
