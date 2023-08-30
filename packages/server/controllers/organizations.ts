import { randomBytes } from 'node:crypto';

import { organizationBlocklist, serveIcon } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { isEqual, parseISO } from 'date-fns';
import { type Context } from 'koa';
import { col, fn, literal, Op, QueryTypes, UniqueConstraintError } from 'sequelize';

import {
  App,
  AppRating,
  BlockVersion,
  EmailAuthorization,
  getDB,
  Organization,
  OrganizationInvite,
  User,
} from '../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { checkRole } from '../utils/checkRole.js';
import { createBlockVersionResponse } from '../utils/createBlockVersionResponse.js';

export async function getOrganizations(ctx: Context): Promise<void> {
  const organizations = await Organization.findAll({
    order: [['id', 'ASC']],
    include: [
      { model: App, required: false, where: { visibility: 'public' }, attributes: ['id'] },
      { model: BlockVersion, required: false, where: { visibility: 'public' }, attributes: ['id'] },
    ],
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  ctx.body = organizations
    .filter((organization) => organization.Apps.length || organization.BlockVersions.length)
    .map((organization) => ({
      id: organization.id,
      name: organization.name,
      description: organization.description,
      website: organization.website,
      email: organization.email,
      iconUrl: organization.get('hasIcon')
        ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
        : null,
    }));
}

export async function getOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });
  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }

  ctx.body = {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    email: organization.email,
    iconUrl: organization.get('hasIcon')
      ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
      : null,
  };
}

export async function getOrganizationApps(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user,
  } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

  const memberInclude = user
    ? { include: [{ model: User, where: { id: user.id }, required: false }] }
    : {};
  const organization = await Organization.findByPk(organizationId, memberInclude);
  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }

  const apps = await App.findAll({
    attributes: {
      include: [[literal('"App".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
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
      ...languageQuery,
    ],
    where: { OrganizationId: organizationId },
  });

  const filteredApps =
    user && organization.Users.length ? apps : apps.filter((app) => app.visibility === 'public');

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: filteredApps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = filteredApps
    .map((app) => {
      const rating = ratings.find((r) => r.AppId === app.id);

      if (rating) {
        Object.assign(app, {
          RatingAverage: Number(rating.get('RatingAverage')),
          RatingCount: Number(rating.get('RatingCount')),
        });
      }

      applyAppMessages(app, language, baseLanguage);

      return app;
    })
    .sort(compareApps)
    .map((app) => app.toJSON(['yaml']));
}

export async function getOrganizationBlocks(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    attributes: {
      include: ['updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }

  // Sequelize does not support sub queries
  // The alternative is to query everything and filter manually
  // See: https://github.com/sequelize/sequelize/issues/9509
  const blockVersions = await getDB().query<BlockVersion>(
    {
      query: `SELECT "OrganizationId", name, description, "longDescription", version, actions, events, layout, parameters, icon, visibility
        FROM "BlockVersion"
        WHERE "OrganizationId" = ?
        AND created IN (SELECT MAX(created)
                        FROM "BlockVersion"
                        GROUP BY "OrganizationId", name)`,
      values: [organizationId],
    },
    { type: QueryTypes.SELECT },
  );

  ctx.body = await createBlockVersionResponse(
    ctx,
    blockVersions,
    ({
      OrganizationId,
      actions,
      description,
      events,
      icon,
      layout,
      longDescription,
      name,
      parameters,
      version,
    }) => {
      let iconUrl = null;
      if (icon) {
        iconUrl = `/api/blocks/@${OrganizationId}/${name}/versions/${version}/icon`;
      } else if (organization.get('hasIcon')) {
        iconUrl = `/api/organizations/${OrganizationId}/icon?updated=${organization.updated.toISOString()}`;
      }
      return {
        name: `@${OrganizationId}/${name}`,
        description,
        longDescription,
        version,
        actions,
        events,
        iconUrl,
        layout,
        parameters,
      };
    },
  );
}

export async function getOrganizationIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    query: { background, maskable, raw, size = 128, updated },
  } = ctx;

  const organization = await Organization.findOne({
    where: { id: organizationId },
    attributes: ['icon', 'updated'],
    raw: true,
  });

  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }

  await serveIcon(ctx, {
    background: background as string,
    cache: isEqual(parseISO(updated as string), organization.updated),
    fallback: 'building-solid.png',
    height: size && Number.parseInt(size as string),
    icon: organization.icon,
    maskable: Boolean(maskable),
    raw: Boolean(raw),
    width: size && Number.parseInt(size as string),
  });
}

export async function deleteOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permission.DeleteOrganization, {
    include: { model: Organization },
  });
  const organization = member.Organization;
  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found',
    };
    ctx.throw();
  }
  await organization.reload({
    include: [BlockVersion, App],
  });

  if (organization.BlockVersions.length !== 0) {
    ctx.response.status = 403;
    ctx.response.body = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Cannot delete an organization with associated blocks.',
    };
    ctx.throw();
  }

  organization.Apps.map(async (app) => {
    await app.destroy();
  });

  await organization.destroy();

  ctx.body = {
    id: organization.id,
  };
}

export async function patchOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { description, email, icon, name, website },
    },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permission.EditOrganization, {
    include: { model: Organization },
  });
  const organization = member.Organization;

  const result: Partial<Organization> = {};
  if (name !== undefined) {
    result.name = name || null;
  }

  if (icon !== undefined) {
    result.icon = icon ? icon.contents : null;
  }

  if (description !== undefined) {
    result.description = description || null;
  }

  if (email !== undefined) {
    result.email = email || null;
  }

  if (website !== undefined) {
    result.website = website || null;
  }

  const updated = await organization.update(result);

  ctx.body = {
    id: organization.id,
    name: updated.name,
    description: updated.description,
    website: updated.website,
    email: updated.name,
    iconUrl: updated.icon
      ? `/api/organizations/${organization.id}/icon?updated=${updated.updated.toISOString()}`
      : null,
  };
}

export async function createOrganization(ctx: Context): Promise<void> {
  const {
    request: {
      body: { description, email, icon, id, name, website },
    },
    user,
  } = ctx;

  await (user as User).reload({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });

  if (!user.primaryEmail || !user.EmailAuthorizations[0].verified) {
    ctx.response.status = 403;
    ctx.response.body = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Email not verified.',
    };
    ctx.throw();
  }

  if (organizationBlocklist.includes(id)) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'This organization id is not allowed.',
    };
    ctx.throw();
  }

  try {
    const organization = await Organization.create(
      { id, name, email, description, website, icon: icon ? icon.contents : null },
      { include: [User] },
    );

    // @ts-expect-error XXX Convert to a type safe expression.
    await organization.addUser(user.id, { through: { role: 'Owner' } });
    await organization.reload();

    ctx.body = {
      id: organization.id,
      name: organization.name,
      iconUrl: icon
        ? `/api/organizations/${organization.id}/icon?updated=${organization.created.toISOString()}`
        : null,
      description: organization.description,
      website: organization.website,
      email: organization.email,
      members: organization.Users.map((u) => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
        role: 'Owner',
      })),
      invites: [],
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      ctx.response.status = 409;
      ctx.response.body = {
        statusCode: 409,
        error: 'Conflict',
        message: `Another organization with the id “${id}” already exists`,
      };
      ctx.throw();
    }

    throw error;
  }
}

export async function getMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [User],
  });
  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }
  await checkRole(ctx, organization.id, Permission.ViewMembers);

  ctx.body = organization.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.Member.role,
  }));
}

export async function getInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permission.InviteMember, {
    include: [
      {
        model: Organization,
        attributes: ['id'],
        required: false,
        include: [OrganizationInvite],
      },
    ],
  });

  if (!member.Organization) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found.',
    };
    ctx.throw();
  }

  ctx.body = member.Organization.OrganizationInvites.map(({ email }) => ({
    email,
  }));
}

export async function getInvitation(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
  } = ctx;

  const invite = await OrganizationInvite.findOne({
    where: { key: token },
    include: {
      model: Organization,
      attributes: {
        include: [[literal('icon IS NOT NULL'), 'hasIcon']],
        exclude: ['icon'],
      },
    },
  });
  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This token does not exist',
    };
    ctx.throw();
  }

  if (!invite.organization) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Organization not found',
    };
    ctx.throw();
  }

  ctx.body = {
    id: invite.organization.id,
    name: invite.organization.name,
    iconUrl: invite.organization.get('hasIcon')
      ? `/api/organizations/${
          invite.organization.id
        }/icon?updated=${invite.organization.updated.toISOString()}`
      : null,
  };
}

export async function respondInvitation(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { response, token },
    },
    user: { id: userId },
  } = ctx;

  const invite = await OrganizationInvite.findOne({ where: { key: token } });

  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This token is invalid',
    };
    ctx.throw();
  }

  const organization = await Organization.findByPk(invite.OrganizationId);

  if (organizationId !== organization.id) {
    ctx.response.status = 406;
    ctx.response.body = {
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Organization IDs do not match',
    };
    ctx.throw();
  }

  if (response) {
    await organization.$add('User', userId, { through: { role: invite.role || 'Member' } });
  }

  await invite.destroy();
}

export async function inviteMembers(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  const allInvites = (body as OrganizationInvite[]).map((invite) => ({
    email: invite.email.toLowerCase(),
    role: invite.role,
  }));

  const member = await checkRole(ctx, organizationId, Permission.InviteMember, {
    include: [
      {
        model: Organization,
        attributes: ['id'],
        include: [
          {
            model: User,
            attributes: ['primaryEmail'],
            include: [{ model: EmailAuthorization, attributes: ['email'] }],
          },
          { model: OrganizationInvite, attributes: ['email'] },
        ],
      },
    ],
  });

  const memberEmails = new Set(
    member.Organization.Users.flatMap(({ EmailAuthorizations }) =>
      EmailAuthorizations.flatMap(({ email }) => email),
    ),
  );
  const newInvites = allInvites.filter((invite) => !memberEmails.has(invite.email));
  if (!newInvites.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'All invited users are already part of this organization',
    };
    ctx.throw();
  }

  const existingInvites = new Set(
    member.Organization.OrganizationInvites.flatMap(({ email }) => email),
  );
  const pendingInvites = newInvites.filter((invite) => !existingInvites.has(invite.email));
  if (!pendingInvites.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'All email addresses are already invited to this organization',
    };
    ctx.throw();
  }

  const auths = await EmailAuthorization.findAll({
    include: [{ model: User }],
    where: { email: { [Op.in]: pendingInvites.map((invite) => invite.email) } },
  });
  const userMap = new Map(auths.map((auth) => [auth.email, auth.User]));
  const result = await OrganizationInvite.bulkCreate(
    pendingInvites.map((invite) => {
      const user = userMap.get(invite.email);
      const key = randomBytes(20).toString('hex');
      return user
        ? {
            email: user?.primaryEmail ?? invite.email,
            UserId: user.id,
            key,
            OrganizationId: organizationId,
            role: invite.role,
          }
        : { email: invite.email, role: invite.role, key, OrganizationId: organizationId };
    }),
  );

  await Promise.all(
    result.map((invite) =>
      mailer.sendTemplateEmail({ ...invite.User, email: invite.email }, 'organizationInvite', {
        organization: organizationId,
        url: `${argv.host}/organization-invite?token=${invite.key}`,
      }),
    ),
  );
  ctx.body = result.map(({ email, role }) => ({ email, role }));
}

export async function resendInvitation(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();
  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    ctx.response.status = 404;
    ctx.response.body = { statusCode: 404, error: 'Not Found', message: 'Organization not found.' };
    ctx.throw();
  }

  await checkRole(ctx, organization.id, Permission.InviteMember);

  const invite = organization.OrganizationInvites.find((i) => i.email === email);
  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This person was not invited previously.',
    };
    ctx.throw();
  }

  const user = await User.findByPk(invite.UserId);

  await mailer.sendTemplateEmail(
    { email, ...(user && { name: user.name }) },
    'organizationInvite',
    {
      organization: organization.id,
      url: `${argv.host}/organization-invite?token=${invite.key}`,
    },
  );

  ctx.body = 204;
}

export async function removeInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await OrganizationInvite.findOne({ where: { email } });

  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This invite does not exist',
    };
    ctx.throw();
  }

  await checkRole(ctx, invite.OrganizationId, Permission.InviteMember);

  await invite.destroy();
}

export async function removeMember(ctx: Context): Promise<void> {
  const {
    pathParams: { memberId, organizationId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'User is not part of this organization.',
    };
    ctx.throw();
  }

  if (!organization.Users.some((u) => u.id === memberId)) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This member is not part of this organization.',
    };
    ctx.throw();
  }

  if (memberId !== user.id) {
    await checkRole(ctx, organization.id, Permission.ManageMembers);
  }

  if (memberId === user.id && organization.Users.length <= 1) {
    ctx.response.status = 406;
    ctx.response.body = {
      statusCode: 406,
      error: 'Not Acceptable',
      message:
        'Not allowed to remove yourself from an organization if you’re the only member left.',
    };
    ctx.throw();
  }

  await organization.$remove('User', memberId);
}

export async function setRole(ctx: Context): Promise<void> {
  const {
    pathParams: { memberId, organizationId },
    request: {
      body: { role },
    },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'User is not part of this organization.',
    };
    ctx.throw();
  }

  if (user.id === memberId) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Not allowed to change your own rule',
    };
    ctx.throw();
  }

  await checkRole(ctx, organization.id, Permission.ManageRoles);

  const member = organization.Users.find((m) => m.id === memberId);
  if (!member) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'This member is not part of this organization.',
    };
    ctx.throw();
  }

  await member.Member.update({ role });
  ctx.body = {
    id: member.id,
    role,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}
