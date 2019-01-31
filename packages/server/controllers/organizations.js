import Boom from 'boom';
import Busboy from 'busboy';
import validateStyle, { StyleValidationError } from '@appsemble/utils/validateStyle';

async function parseStyleMultipart(ctx) {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy(ctx.req);
    const res = {};

    const onError = error => {
      reject(error);
      busboy.removeAllListeners();
    };

    busboy.on('file', (fieldname, stream, filename, encoding, mime) => {
      if (!(fieldname === 'style' || mime !== 'text/css')) {
        onError(new Error(`Expected file ´${fieldname}´ to be css`));
      }

      const buffer = [];
      stream.on('data', data => {
        buffer.push(data);
      });

      stream.on('end', () => {
        if (fieldname === 'style') {
          res.style = Buffer.concat(buffer);
        }
      });
    });

    busboy.on('finish', () => {
      busboy.removeAllListeners();
      resolve(res);
    });
    busboy.on('error', onError);
    busboy.on('partsLimit', onError);
    busboy.on('filesLimit', onError);
    busboy.on('fieldsLimit', onError);
    ctx.req.pipe(busboy);
  });
}

export async function getCoreStyle(ctx) {
  const { id } = ctx.params;
  const { Organization } = ctx.db.models;

  const organization = await Organization.findByPk(id, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setCoreStyle(ctx) {
  const { id } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;

  try {
    const { style } = await parseStyleMultipart(ctx);
    if (!style) {
      throw Boom.badRequest('Stylesheet not found.');
    }

    validateStyle(style);

    const organization = await Organization.findByPk(id);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    organization.coreStyle = /\S/.test(style.toString()) ? style.toString() : null;
    await organization.save();

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getSharedStyle(ctx) {
  const { id } = ctx.params;
  const { Organization } = ctx.db.models;

  const organization = await Organization.findByPk(id, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setSharedStyle(ctx) {
  const { id } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;

  try {
    const { style } = await parseStyleMultipart(ctx);
    if (!style) {
      throw Boom.badRequest('Stylesheet not found.');
    }

    validateStyle(style);

    const organization = await Organization.findByPk(id);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    organization.sharedStyle = /\S/.test(style.toString()) ? style.toString() : null;
    await organization.save();

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getBlockStyle(ctx) {
  const { organizationId, organizationName, blockName } = ctx.params;
  const { OrganizationBlockStyle } = ctx.db.models;

  const blockId = `${organizationName}/${blockName}`;
  const blockStyle = await OrganizationBlockStyle.findOne({
    where: {
      OrganizationId: organizationId,
      BlockDefinitionId: blockId,
    },
  });

  ctx.body = blockStyle && blockStyle.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setBlockStyle(ctx) {
  const { organizationId, organizationName, blockName } = ctx.params;
  const { db } = ctx;
  const { Organization, OrganizationBlockStyle, BlockDefinition } = db.models;

  const blockId = `${organizationName}/${blockName}`;

  try {
    const { style } = await parseStyleMultipart(ctx);
    if (!style) {
      throw Boom.badRequest('Stylesheet not found.');
    }

    validateStyle(style);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    const block = await BlockDefinition.findByPk(blockId);
    if (!block) {
      throw Boom.notFound('Block not found.');
    }

    await OrganizationBlockStyle.upsert({
      style: /\S/.test(style.toString()) ? style.toString() : null,
      OrganizationId: organization.id,
      BlockDefinitionId: block.id,
    });

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
