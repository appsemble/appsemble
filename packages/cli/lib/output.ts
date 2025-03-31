import { type ValidationError } from 'jsonschema';
import { isNode, LineCounter, parseDocument } from 'yaml';

export function printAxiosError(filename: string, yaml: string, errors: ValidationError[]): string {
  const lineCounter = new LineCounter();
  const doc = parseDocument(yaml, { lineCounter });

  return errors
    .map((error) => {
      const node = doc.getIn(error.path, true);
      let result = filename;
      if (isNode(node)) {
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        const { col, line } = lineCounter.linePos(node.range?.[0]);
        result += `:${line}:${col}`;
      }
      return `${result} ${error.message}`;
    })
    .join('\n');
}
