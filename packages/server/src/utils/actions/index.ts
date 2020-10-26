export function noop(data: any): any {
  return data;
}

function throwAction(data: any): never {
  throw data;
}

export {
  throwAction as throw,
  // Export noop actions for all actions that aren’t supported server-side
  noop as email,
  noop as dialog,
  noop as event,
  noop as flow,
  noop as link,
  noop as log,
  noop as message,
};
