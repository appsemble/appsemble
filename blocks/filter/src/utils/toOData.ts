import { type Field, type FilterValues } from '../../block.js';

export function toOData(fields: Field[], values: FilterValues): string {
  const queries = fields
    .map((field) => {
      const value = values[field.name];

      if (value == null || (value as string[]).length === 0) {
        return null;
      }

      const modifiedValue =
        // See https://docs.oasis-open.org/odata/odata/v4.01/cs01/part2-url-conventions/odata-v4.01-cs01-part2-url-conventions.html#sec_URLComponents
        typeof value === 'string'
          ? value.replaceAll("'", "''").replaceAll('\\', '\\\\')
          : undefined;
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
        case 'enum':
          return `${field.name} eq '${value}'`;
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
            return `${field.name} eq '${modifiedValue}'`;
          }
          return `contains(tolower(${field.name}),'${(modifiedValue as string).toLowerCase()}')`;
        default:
          return null;
      }
    })
    .filter(Boolean);
  return queries.length === 1 ? queries[0] : queries.map((query) => `(${query})`).join(' and ');
}
