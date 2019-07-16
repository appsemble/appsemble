import request from './request';

function getBlobs(resource) {
  const { blobs } = resource;
  const type = blobs?.type || 'upload';
  const method = blobs?.method || 'post';
  const url = blobs?.url || '/api/assets';

  return { type, method, url, ...(blobs?.serialize && blobs.serialize) };
}

function get({ definition: { resource: name, query: params }, app }) {
  const { schema, ...resource } = app.resources[name];
  const method = resource?.get?.method || 'GET';
  const url = resource?.get?.url || resource.url || `/api/apps/${app.id}/resources/${name}`;
  const id = resource.id || 'id';

  return request({
    definition: {
      blobs: getBlobs(resource),
      method,
      url: `${url}${!url.endsWith('/') && '/'}{${id}}`,
      query: params,
      schema,
    },
  });
}

function query({ definition: { resource: name, query: queryParams }, app }) {
  const { schema, ...resource } = app.resources[name];
  const method = resource?.query?.method || 'GET';
  const url = resource?.query?.url || resource.url || `/api/apps/${app.id}/resources/${name}`;

  return request({
    definition: { blobs: getBlobs(resource), method, url, query: queryParams, schema },
  });
}

function create({ definition: { resource: name }, app }) {
  const { schema, ...resource } = app.resources[name];
  const method = resource?.create?.method || 'POST';
  const url = resource?.create?.url || resource.url || `/api/apps/${app.id}/resources/${name}`;

  return request({ definition: { blobs: getBlobs(resource), method, url, schema } });
}

function update({ definition: { resource: name, query: params }, app }) {
  const { schema, ...resource } = app.resources[name];
  const method = resource?.update?.method || 'PUT';
  const url = resource?.update?.url || resource.url || `/api/apps/${app.id}/resources/${name}`;
  const id = resource.id || 'id';

  return request({
    definition: {
      blobs: getBlobs(resource),
      method,
      url: `${url}${!url.endsWith('/') && '/'}{${id}}`,
      query: params,
      schema,
    },
  });
}

function remove({ definition: { resource: name, query: params }, app }) {
  const { schema, ...resource } = app.resources[name];
  const method = resource?.delete?.method || 'DELETE';
  const url = resource?.delete?.url || resource.url || `/api/apps/${app.id}/resources/${name}`;
  const id = resource.id || 'id';

  return request({
    definition: {
      blobs: getBlobs(resource),
      method,
      url: `${url}${!url.endsWith('/') && '/'}{${id}}`,
      query: params,
      schema,
    },
  });
}

export default { get, query, create, update, remove };
