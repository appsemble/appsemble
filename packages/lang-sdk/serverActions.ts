export const serverActions = new Set([
  'noop',
  'throw',
  'condition',
  'each',
  'email',
  'log',
  'notify',
  'request',
  'resource.get',
  'resource.query',
  'resource.create',
  'resource.patch',
  'resource.update',
  'resource.delete',
  'resource.delete.all',
  'resource.delete.bulk',
  'static',
  'app.member.query',
] as const);

export type ServerActionName = typeof serverActions extends Set<infer T> ? T : never;
