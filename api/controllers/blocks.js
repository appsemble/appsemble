import Busboy from 'busboy';
import Boom from 'boom';
import { UniqueConstraintError } from 'sequelize';

export async function createBlockDefinition(ctx) {
  const { BlockDefinition } = ctx.db.models;
  const { body } = ctx.request;
  const { id, description } = body;
  const blockDefinition = { description, id };

  try {
    await BlockDefinition.create(blockDefinition, { raw: true });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another block definition with id “${id}” already exists`);
    }
    throw error;
  }

  ctx.body = blockDefinition;
}

export async function getBlockDefinition(ctx) {
  const { organization, id } = ctx.params;
  const { BlockDefinition } = ctx.db.models;

  const blockDefinition = await BlockDefinition.findByPk(`${organization}/${id}`, { raw: true });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  ctx.body = {
    id: blockDefinition.id,
    description: blockDefinition.description,
  };
}

export async function queryBlockDefinitions(ctx) {
  const { BlockDefinition } = ctx.db.models;

  const blockDefinitions = await BlockDefinition.findAll({ raw: true });

  ctx.body = blockDefinitions.map(({ id, description }) => ({ id, description }));
}

export async function createBlockVersion(ctx) {
  const { organization, id } = ctx.params;
  const { db } = ctx;
  const { BlockAsset, BlockDefinition, BlockVersion } = db.models;
  const name = `${organization}/${id}`;

  const blockDefinition = await BlockDefinition.findByPk(name, { raw: true });

  if (!blockDefinition) {
    throw Boom.notFound('Block definition not found');
  }

  ctx.body = await db.transaction(
    transaction =>
      new Promise((resolve, reject) => {
        const busboy = new Busboy(ctx.req);
        const promises = [];
        let result;
        let resultDeferred;
        const resultPromise = new Promise((res, rej) => {
          resultDeferred = { resolve: res, reject: rej };
        }).then(r => {
          result = r;
          return r;
        });

        function onError(error) {
          reject(error);
          busboy.removeAllListeners();
        }

        async function onSuccess() {
          let files;
          try {
            files = await Promise.all(promises);
          } catch (error) {
            onError(error);
            return;
          }
          if (files.length === 0) {
            onError(new Error('At least one file should be uploaded'));
            return;
          }
          resolve({
            ...result,
            files,
          });
          busboy.removeAllListeners();
        }

        busboy.on('file', (fieldname, stream, filename, encoding, mime) => {
          const bufs = [];
          stream.on('data', data => {
            bufs.push(data);
          });
          stream.on('end', () => {
            if (result) {
              promises.push(
                BlockAsset.create(
                  {
                    name,
                    version: result.version,
                    filename,
                    mime,
                    content: Buffer.concat(bufs),
                  },
                  { transaction },
                ).then(() => filename),
              );
            } else {
              promises.push(
                BlockAsset.create(
                  {
                    filename,
                    mime,
                    content: Buffer.concat(bufs),
                  },
                  { transaction },
                ).then(async row => {
                  bufs.splice(0, bufs.length);
                  await resultPromise;
                  await row.update(
                    { name, version: result.version },
                    { fields: ['name', 'version'], transaction },
                  );
                  return filename;
                }),
              );
            }
          });
        });
        busboy.on('field', async (fieldname, content) => {
          try {
            if (fieldname !== 'data') {
              throw new Error(`Unexpected field: ${fieldname}`);
            }
            const versionData = {
              actions: null,
              position: null,
              resources: null,
              ...JSON.parse(content),
              name,
            };
            await BlockVersion.create(versionData, { transaction });
            resultDeferred.resolve(versionData);
          } catch (error) {
            busboy.emit('error', error);
          }
        });
        busboy.on('finish', onSuccess);
        busboy.on('error', onError);
        busboy.on('partsLimit', onError);
        busboy.on('filesLimit', onError);
        busboy.on('fieldsLimit', onError);
        ctx.req.pipe(busboy);
      }),
  );
  ctx.status = 201;
}

export async function getBlockVersion(ctx) {
  const { organization, id, version } = ctx.params;
  const name = `${organization}/${id}`;
  const { BlockAsset, BlockVersion } = ctx.db.models;

  const blockVersion = await BlockVersion.findOne({
    attributes: ['actions', 'position', 'resources'],
    raw: true,
    where: { name, version },
  });

  if (!blockVersion) {
    throw Boom.notFound('Block version not found');
  }

  const files = await BlockAsset.findAll({
    attributes: ['filename'],
    raw: true,
    where: { name, version },
  });

  ctx.body = { files: files.map(f => f.filename), name, version, ...blockVersion };
}

export async function getBlockAsset(ctx) {
  const { organization, id, version, path } = ctx.params;
  const name = `${organization}/${id}`;
  const { BlockAsset } = ctx.db.models;
  const asset = await BlockAsset.findOne({
    where: { name, version, filename: path },
  });
  if (asset == null) {
    ctx.status = 404;
    return;
  }
  ctx.type = asset.mime;
  ctx.body = asset.content;
}
