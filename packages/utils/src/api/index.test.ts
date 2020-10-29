import SwaggerParser from '@apidevtools/swagger-parser';

import { api } from '.';

it('should generate a valid OpenAPI specification', async () => {
  expect(await SwaggerParser.validate(api('0.0.0'))).toBeDefined();
});
