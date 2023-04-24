import { type OpenAPIV3 } from 'openapi-types';

import * as parameters from './parameters/index.js';
import * as requestBodies from './requestBodies/index.js';
import * as responses from './responses/index.js';
import * as schemas from './schemas/index.js';
import * as securitySchemes from './securitySchemes/index.js';

export const components: OpenAPIV3.ComponentsObject = {
  parameters,
  requestBodies,
  responses,
  schemas,
  securitySchemes,
};
