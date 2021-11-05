import { ValidationError } from 'jsonschema';
import location from 'vfile-location';
import { isNode, parseDocument } from 'yaml';

export function printAxiosError(filename: string, yaml: string, errors: ValidationError[]): string {
  const doc = parseDocument(yaml);
  const { toPoint } = location(yaml);

  return errors
    .map((error) => {
      const node = doc.getIn(error.path, true);
      let result = filename;
      if (isNode(node)) {
        const { column, line } = toPoint(node.range[0]);
        result += `:${line}:${column}`;
      }
      return `${result} ${error.message}`;
    })
    .join('\n');
}
