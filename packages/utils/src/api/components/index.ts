import { OpenAPIV3 } from 'openapi-types';

import examples from './examples';
import parameters from './parameters';
import requestBodies from './requestBodies';
import responses from './responses';
import schemas from './schemas';
import securitySchemes from './securitySchemes';

export default {
  examples,
  parameters,
  requestBodies,
  responses,
  schemas,
  securitySchemes,
} as OpenAPIV3.ComponentsObject;
