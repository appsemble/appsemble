import { parse } from 'csv-parse/browser/esm';

import { type ActionCreator } from './index.js';

export const csvParser: ActionCreator<'csv.parse'> = ({ definition, remap }) => [
  async (data) => {
    const file = remap(definition.file, data) as Blob;
    const delimiter = remap(definition.delimiter ?? ',', data);

    const text = await file.text();
    const records: any[] = [];

    return new Promise((resolve, reject) => {
      const parser = parse(text, {
        cast: true,
        columns: true,
        bom: true,
        delimiter: delimiter ? delimiter.replaceAll('\\t', '\t') : ',',
      });

      parser.on('data', (item) => records.push(item));
      parser.on('end', () => resolve(records));
      parser.on('error', (error) => reject(error));
    });
  },
];
