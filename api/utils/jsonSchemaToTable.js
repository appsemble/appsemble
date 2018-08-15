function createRows(schema) {
  return Object.entries(schema.properties)
    .map(([prop, subSchema]) => {
      const row = [prop];
      switch (subSchema.type) {
        case 'array':
        case 'object':
          row.push('JSON');
          break;
        case 'number': {
          row.push('INT');
          if (subSchema.minimum >= 0) {
            row.push('UNSIGNED');
          }
          if (subSchema.readOnly) {
            row.push('AUTO_INCREMENT PRIMARY KEY');
          }
          break;
        }
        case 'string':
          row.push(`VARCHAR(${subSchema.maxLength})`);
          break;
        default:
          throw new Error(`Unhandled schema type "${subSchema.type}" for property "${prop}"`);
      }
      if (schema.required && schema.required.includes(prop)) {
        row.push('NOT NULL');
      }
      return row.join(' ');
    })
    .join(', ');
}


export default function jsonSchemaToTable(schema, title = schema.title) {
  return `CREATE TABLE IF NOT EXISTS ${title} (${createRows(schema)})`;
}
