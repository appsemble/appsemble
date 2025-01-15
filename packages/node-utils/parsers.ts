import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node:querystring';

import busboy from 'busboy';
import { parse as parseCSV } from 'csv-parse';
import { ensureDir } from 'fs-extra';
import { bufferParser, type Parser } from 'koas-body-parser';
import { SchemaValidationError } from 'koas-core';
import { type OpenAPIV3 } from 'openapi-types';
import { is } from 'type-is';

import { type TempFile } from './server/types.js';

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

/**
 * Parse a raw string value based on a JSON schema.
 *
 * @param schema The JSON schema whose type to use for parsing the value.
 * @param content The value to parse.
 * @returns The parsed value.
 */
function fromString(schema: OpenAPIV3.SchemaObject, content: string): any {
  switch (schema?.type) {
    case 'integer':
    case 'number':
      return Number(content);
    case 'boolean':
      if (content === 'true') {
        return true;
      }
      if (content === 'false') {
        return false;
      }
      return content;
    case 'object':
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    default:
      return content;
  }
}

// Taken from https://gitlab.com/remcohaszing/koas/-/blob/main/packages/koas-body-parser/src/parsers/formdata.ts
// Files are passed as streams rather than buffers
export const streamParser: Parser<Record<string, unknown>> = async (
  body,
  mediaTypeObject,
  { resolveRef },
  ctx,
) => {
  const bb = busboy({ headers: ctx.req.headers });
  const { encoding = {}, schema } = mediaTypeObject || {};
  const { properties = {} } = resolveRef(schema) || {};

  const response: Record<string, any> = {};
  const tempFiles: Record<string, TempFile | TempFile[]> = {};

  await new Promise((resolve, reject) => {
    function onError(error: Error): void {
      bb.removeAllListeners();
      reject(error);
    }

    bb.on('file', (fieldname, stream, { filename, mimeType: mime }) => {
      const propertySchema = resolveRef(properties[fieldname]);

      ensureDir('uploads');
      const path = join('uploads', `${Date.now()}-${randomUUID()}`);
      const fileWriteStream = createWriteStream(path);
      stream.pipe(fileWriteStream);

      if (propertySchema && propertySchema.type === 'array') {
        if (!Object.hasOwnProperty.call(response, fieldname)) {
          response[fieldname] = [];
        }
        if (!Object.hasOwnProperty.call(tempFiles, fieldname)) {
          tempFiles[fieldname] = [];
        }
        (response[fieldname] as string[]).push('');
        (tempFiles[fieldname] as TempFile[]).push({ path, mime, filename });
      } else {
        response[fieldname] = '';
        tempFiles[fieldname] = { path, mime, filename };
      }
    })
      .on('field', (fieldname, content) => {
        const propertySchema = resolveRef(properties[fieldname]);
        if (propertySchema && propertySchema.type === 'array') {
          if (!Object.hasOwnProperty.call(response, fieldname)) {
            response[fieldname] = [];
          }
          (response[fieldname] as string[]).push(
            fromString(resolveRef(propertySchema.items), content),
          );
        } else {
          response[fieldname] = fromString(propertySchema, content);
        }
      })
      .on('close', () => {
        bb.removeAllListeners();
        resolve(response);
      })
      .on('error', onError)
      .on('partsLimit', onError)
      .on('filesLimit', onError)
      .on('fieldsLimit', onError);

    ctx.req.pipe(bb);
  });

  const result = ctx.openApi.validate(response, schema, { throw: false });
  for (const [key, values] of Object.entries(tempFiles)) {
    const vals = Array.isArray(values) ? values : [values];
    for (const [index, value] of vals.entries()) {
      if (!encoding?.[key]?.contentType) {
        continue;
      }
      if (
        !is(
          value.mime,
          encoding[key].contentType.split(',').map((contentType) => contentType.trim()),
        )
      ) {
        const error = result.addError({
          name: 'contentType',
          argument: encoding[key].contentType,
          message: 'has an invalid content type',
        });
        error.schema = {};
        error.path = values === value ? [key] : [key, index];
        error.property = values === value ? `instance.${key}` : `instance.${key}[${index}]`;
      }
    }
  }

  if (!result.valid) {
    throw new SchemaValidationError('Invalid content types found', { result });
  }

  return Object.assign(response, tempFiles);
};

streamParser.skipValidation = true;
