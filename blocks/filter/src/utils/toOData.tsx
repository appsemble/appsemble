import type { Field, FilterValues } from '../../block';

export function toOData(fields: Field[], values: FilterValues): string {
  const queries = fields
    .map((field) => {
      const value = values[field.name];

      if (value == null || value.length === 0) {
        return null;
      }

      switch (field.type) {
        case 'buttons':
          return (value as string[]).map((val) => `${field.name} eq '${val}'`).join(' or ');
        case 'date':
          return `${field.name} eq ${value}`;
        case 'date-range': {
          const filters = [];
          if (value[0]) {
            filters.push(`${field.name} ge ${value[0]}`);
          }
          if (value[1]) {
            filters.push(`${field.name} le ${value[1]}`);
          }
          if (!filters.length) {
            return null;
          }
          return filters.join(' and ');
        }
        case 'enum':
          return `${field.name} eq '${value}'`;
        case 'string':
          if (field.exact) {
            return `${field.name} eq '${value}'`;
          }
          return `substringof(${field.name},'${value}')`;
        default:
          return null;
      }
    })
    .filter(Boolean);
  return queries.length === 1 ? queries[0] : queries.map((query) => `(${query})`).join(' and ');
}
