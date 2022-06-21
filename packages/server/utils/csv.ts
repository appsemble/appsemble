import { PreValidatePropertyFunction } from 'jsonschema';

export const preProcessCSV: PreValidatePropertyFunction = (instance, key, schema, options, ctx) => {
  // CSV is parsed into an array of flat objects. This means all instances are a direct descendant
  // of the root array and the path length is 1.
  if (ctx.path.length !== 1) {
    return;
  }
  const parent: Record<string, unknown> = instance;
  const value: string = instance[key];
  switch (schema.type) {
    case 'null':
      if (value === 'null') {
        parent[key] = null;
      }
      break;
    case 'boolean':
      if (value === 'true') {
        parent[key] = true;
      } else if (value === 'false') {
        parent[key] = false;
      }
      break;
    case 'integer': {
      const result = Number(value);
      if (Number.isInteger(result)) {
        parent[key] = result;
      }
      break;
    }
    case 'number': {
      const result = Number(value);
      if (Number.isFinite(result)) {
        parent[key] = result;
      }
      break;
    }
    case 'array': {
      const result = JSON.parse(value);
      if (Array.isArray(result)) {
        parent[key] = result;
      }
      break;
    }
    case 'object': {
      const result = JSON.parse(value);
      if (result && typeof result === 'object') {
        parent[key] = result;
      }
      break;
    }
    default:
      break;
  }
};
