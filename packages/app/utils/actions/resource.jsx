import request from './request';

function get({ resource: name }, app) {
  const resource = app.definitions[name];
  const { schema } = resource;
  const method = resource?.get?.method || 'GET';
  const url = resource?.get?.url || resource.url || `/api/apps/${app.id}/${name}`;
  const id = resource.id || 'id';

  return request({ method, url: `${url}${!url.endsWith('/') && '/'}{${id}}`, schema });
}

function query({ resource: name }, app) {
  const resource = app.definitions[name];
  const { schema } = resource;
  const method = resource?.query?.method || 'GET';
  const url = resource?.query?.url || resource.url || `/api/apps/${app.id}/${name}`;

  return request({ method, url, schema });
}

function create({ resource: name }, app) {
  const resource = app.definitions[name];
  const { schema } = resource;
  const method = resource?.create?.method || 'POST';
  const url = resource?.create?.url || resource.url || `/api/apps/${app.id}/${name}`;

  return request({ method, url, schema });
}

function update({ resource: name }, app) {
  const resource = app.definitions[name];
  const { schema } = resource;
  const method = resource?.update?.method || 'PUT';
  const url = resource?.update?.url || resource.url || `/api/apps/${app.id}/${name}`;
  const id = resource.id || 'id';

  return request({ method, url: `${url}${!url.endsWith('/') && '/'}{${id}}`, schema });
}

function remove({ resource: name }, app) {
  const resource = app.definitions[name];
  const { schema } = resource;
  const method = resource?.delete?.method || 'DELETE';
  const url = resource?.delete?.url || resource.url || `/api/apps/${app.id}/${name}`;
  const id = resource.id || 'id';

  return request({ method, url: `${url}${!url.endsWith('/') && '/'}{${id}}`, schema });
}

export default { get, query, create, update, remove };
