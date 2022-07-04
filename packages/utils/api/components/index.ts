import { OpenAPIV3 } from 'openapi-types';

import * as parameters from './parameters';
import * as requestBodies from './requestBodies';
import * as responses from './responses';
import * as schemas from './schemas';
import * as securitySchemes from './securitySchemes';

export const components: OpenAPIV3.ComponentsObject = {
  parameters,
  requestBodies,
  responses,
  schemas,
  securitySchemes,
};
