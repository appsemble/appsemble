import { Filter, FilterField, RangeFilter } from '../../types';

export default function toOData(fields: FilterField[], filter: Filter): string {
  return Object.entries(filter)
    .map(([key, data]) => {
      if (!data) {
        return '';
      }

      const field = fields.find(f => f.name === key);

      if (field.type === undefined || field.type === 'string') {
        return `substringof('${data}',${key})`;
      }

      if (field.range) {
        const { from, to } = data as RangeFilter;
        const f = from == null || from === '' ? null : `${key} ge ${from}`;
        const t = to == null || to === '' ? null : `${key} le ${to}`;
        return [f, t];
      }

      if (field.type === 'checkbox') {
        if (!(data as string[]).length) {
          return '';
        }

        return `(${(data as string[]).map(value => `${key} eq '${value}'`).join(' or ')})`;
      }

      return `${key} eq '${data}'`;
    })
    .flat()
    .filter(Boolean)
    .join(' and ');
}
