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

      let buffer;
      stream.on('data', data => {
        buffer = data;
      });

      stream.on('end', () => {
        if (fieldname === 'style') {
          res.style = buffer;
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
