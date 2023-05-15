import { convertToCsv } from '@appsemble/utils';
import { bufferParser, jsonParser, bodyParser as koaBodyParser } from 'koas-body-parser';
import { type Plugin } from 'koas-core';
import { serializer as koaSerializer } from 'koas-serializer';

import { csvParser, xWwwFormUrlencodedParser } from './parsers.js';

function serializer(): Plugin {
  return koaSerializer({
    serializers: {
      'application/scim+json': (body) => JSON.stringify(body),
      'application/xml': (body: string) => body,
      'text/csv': convertToCsv,
    },
  });
}

function bodyParser(): Plugin {
  return koaBodyParser({
    parsers: {
      'application/scim+json': jsonParser,
      'application/x-www-form-urlencoded': xWwwFormUrlencodedParser,
      'text/csv': csvParser,
      '*/*': bufferParser,
    },
  });
}

export { bodyParser, serializer };
export * from 'koas-parameters';
export * from 'koas-security';
