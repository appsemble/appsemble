import jsonpointer from 'jsonpointer';

function recurse(object: Record<string, any>, root: Record<string, any>): Record<string, any> {
  if (!(object instanceof Object)) {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map(value => recurse(value, root));
  }
  if (!Object.hasOwnProperty.call(object, '$ref')) {
    return Object.entries(object).reduce((acc: Record<string, any>, [key, value]) => {
      acc[key] = recurse(value, root);
      return acc;
    }, {});
  }
  let result = object;
  for (
    let i = 0;
    i < 10 && result instanceof Object && Object.hasOwnProperty.call(result, '$ref');
    i += 1
  ) {
    result = jsonpointer.get(root, (result as any).$ref);
  }
  return result;
}

export default function resolveJsonPointers(object: Record<string, any>): Record<string, any> {
  return recurse(object, object);
}
