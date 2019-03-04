import jsonpointer from 'jsonpointer';

function recurse(object, root) {
  if (!(object instanceof Object)) {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map(value => recurse(value, root));
  }
  if (!Object.hasOwnProperty.call(object, '$ref')) {
    return Object.entries(object).reduce((acc, [key, value]) => {
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
    result = jsonpointer.get(root, result.$ref);
  }
  return result;
}

export default function resolveJsonPointers(object) {
  return recurse(object, object);
}
