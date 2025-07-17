import { type Field, type FilterValues } from '../../block.js';

export function toOData(fields: Field[], values: FilterValues, defaultFilter?: string): string {
  const queries = fields
    .map((field) => {
      const value = values[field.name];

      if (value == null || (value as string[]).length === 0) {
        return null;
      }

      switch (field.type) {
        case 'boolean':
          return `${field.name} eq '${value}'`;
        case 'buttons':
          return (value as string[]).map((val) => `${field.name} eq '${val}'`).join(' or ');
        case 'date':
          return `${field.name} eq '${value}'`;
        case 'date-range': {
          const filters = [];
          if ((value as string[])[0]) {
            filters.push(`${field.name} ge '${(value as string[])[0]}'`);
          }
          if ((value as string[])[1]) {
            filters.push(`${field.name} le '${(value as string[])[1]}'`);
          }
          if (!filters.length) {
            return null;
          }
          return filters.join(' and ');
        }
        case 'enum': {
          const splitValues = (value as string).split(', ');
          if (splitValues.length > 1) {
            return String(splitValues.map((item) => `${field.name} eq '${item}'`).join(' or '));
          }
          return `${field.name} eq '${value}'`;
        }
        case 'list': {
          const listValue = (value as string).split(', ');
          return String(listValue.map((val) => `contains(${field.name}, '${val}')`).join(' or '));
        }
        case 'range': {
          const [minValue, maxValue] = value as [number, number];
          return `${field.name} ge ${minValue} and le ${maxValue}`;
        }
        case 'string':
          if (field.exact) {
            return `${field.name} eq '${value}'`;
          }
          return `contains(tolower(${field.name}),'${(value as string).toLowerCase()}')`;
        default:
          return null;
      }
    })
    .filter(Boolean);
  if (defaultFilter) {
    queries.push(defaultFilter);
  }
  return queries.length === 1 ? queries[0] : queries.map((query) => `(${query})`).join(' and ');
}
