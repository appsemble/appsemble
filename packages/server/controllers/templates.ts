import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { normalize, Permission } from '@appsemble/utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';
import webpush from 'web-push';
import { parseDocument } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppOAuth2Secret,
  AppReadme,
  AppSamlSecret,
  AppScreenshot,
  AppServiceSecret,
  AppSnapshot,
  AppVariable,
  Asset,
  Resource,
} from '../models/index.js';
import { setAppPath } from '../utils/app.js';
import { checkRole } from '../utils/checkRole.js';

export async function getAppTemplates(ctx: Context): Promise<void> {
  const templates = await App.findAll({
    where: { template: true },
    attributes: {
      include: ['id', 'definition'],
    },
    include: [{ model: Resource, where: { clonable: true }, attributes: ['id'], required: false }],
    order: [['id', 'ASC']],
  });

  ctx.body = templates.map((template) => ({
    id: template.id,
    name: template.definition.name,
    description: template.definition.description,
    resources: template.Resources.length > 0,
  }));
}

export async function createTemplateApp(ctx: Context): Promise<void> {
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
      { model: Resource, where: { clonable: true }, required: false },
      { model: Asset, where: { clonable: true }, required: false },
      { model: AppMessages, required: false },
      { model: AppBlockStyle, required: false },
      { model: AppSnapshot, limit: 1, order: [['created', 'desc']] },
      { model: AppScreenshot, required: false },
      { model: AppReadme, required: false },
      { model: AppVariable, required: false },
      { model: AppOAuth2Secret, required: false },
      { model: AppSamlSecret, required: false },
      { model: AppServiceSecret, required: false },
    ],
  });

  await checkRole(ctx, organizationId, Permission.CreateApps);

  assertKoaError(!template, ctx, 404, `Template with ID ${templateId} does not exist.`);

  if (!template.template && (template.visibility === 'private' || !template.showAppDefinition)) {
    // Only allow cloning of unlisted apps if the user is part of the template’s organization.
    await checkRole(ctx, template.OrganizationId, Permission.ViewApps);
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
      ...(resources && {
        Resources: template.Resources.map(({ data, seed, type }) => ({
          type,
          data,
          seed,
        })) as Resource[],
      }),
      ...(assets && {
        Assets: template.Assets.map(({ data, filename, mime, name: assetName, seed }) => ({
          mime,
          filename,
          data,
          name: assetName,
          seed,
        })) as Asset[],
      }),
      ...(variables && {
        AppVariables: template.AppVariables.map(({ name: variableName, value }) => ({
          name: variableName,
          value,
        })) as AppVariable[],
      }),
      ...(secrets && {
        AppOAuth2Secrets: template.AppOAuth2Secrets.map(
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
        ) as AppOAuth2Secret[],
        AppServiceSecrets: template.AppServiceSecrets.map(
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
        ) as AppServiceSecret[],
        AppSamlSecrets: template.AppSamlSecrets.map(
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
        ) as AppSamlSecret[],
      }),
      AppMessages: [].concat(template.AppMessages),
    };

    await setAppPath(ctx, result, path);

    for (const m of result.AppMessages) {
      delete m.messages?.app?.name;
      delete m.messages?.app?.description;
    }
    const record = await App.create(result, {
      include: [
        Resource,
        Asset,
        AppMessages,
        AppScreenshot,
        AppReadme,
        AppVariable,
        AppOAuth2Secret,
        AppServiceSecret,
        AppSamlSecret,
      ],
    });

    const doc = parseDocument(template.AppSnapshots[0].yaml);
    doc.setIn(['description'], result.definition.description);
    doc.setIn(['name'], result.definition.name);
    const snapshot = await AppSnapshot.create({
      AppId: record.id,
      UserId: user.id,
      yaml: String(doc),
    });
    record.AppSnapshots = [snapshot];
    if (template.AppBlockStyles.length) {
      await AppBlockStyle.bulkCreate(
        template.AppBlockStyles.map((blockStyle) => ({
          AppId: record.id,
          block: blockStyle.block,
          style: blockStyle.style,
        })),
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
