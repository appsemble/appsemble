import { parse } from 'node:querystring';

import { parse as parseCSV } from 'csv-parse';
import { bufferParser, type Parser } from 'koas-body-parser';

export const xWwwFormUrlencodedParser: Parser<unknown> = async (
  body,
  mediaTypeObject,
  options,
  ctx,
) => {
  const buffer = await bufferParser(body, mediaTypeObject, options, ctx);
  return parse(String(buffer));
};

export const csvParser: Parser<unknown[]> = (body) =>
  new Promise((resolve, reject) => {
    body.pipe(
      parseCSV({ bom: true, columns: true }, (error, records) => {
        if (error) {
          reject(error);
        } else {
          resolve(records);
        }
      }),
    );
  });
