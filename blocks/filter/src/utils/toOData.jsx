export default function toOData(fields, filter) {
  return Object.entries(filter)
    .map(([key, data]) => {
      if (data === null) {
        return '';
      }

      const field = fields.find(f => f.name === key);

      if (field.type === 'string') {
        return `substringof('${data}',${key})`;
      }

      if (field.range) {
        const from = data.from == null || data.from === '' ? null : `${key} ge ${data.from}`;
        const to = data.to == null || data.to === '' ? null : `${key} le ${data.to}`;
        return [from, to];
      }

      return `${key} eq '${data}'`;
    })
    .flat()
    .filter(Boolean)
    .join(' and ');
}
