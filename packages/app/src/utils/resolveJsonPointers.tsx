import jsonpointer from 'jsonpointer';

function recurse(
  object: { [key: string]: any },
  root: { [key: string]: any },
): { [key: string]: any } {
  if (!(object instanceof Object)) {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map((value) => recurse(value, root));
  }
  if (!Object.hasOwnProperty.call(object, '$ref')) {
    return Object.entries(object).reduce((acc: { [key: string]: any }, [key, value]) => {
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

export function resolveJsonPointers(object: { [key: string]: any }): { [key: string]: any } {
  return recurse(object, object);
}
