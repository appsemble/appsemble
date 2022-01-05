import { ValidationError } from 'jsonschema';
import { isNode, LineCounter, parseDocument } from 'yaml';

export function printAxiosError(filename: string, yaml: string, errors: ValidationError[]): string {
  const lineCounter = new LineCounter();
  const doc = parseDocument(yaml, { lineCounter });

  return errors
    .map((error) => {
      const node = doc.getIn(error.path, true);
      let result = filename;
      if (isNode(node)) {
        const { col, line } = lineCounter.linePos(node.range[0]);
        result += `:${line}:${col}`;
      }
      return `${result} ${error.message}`;
    })
    .join('\n');
}
