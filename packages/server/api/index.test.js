import SwaggerParser from 'swagger-parser';

import api from '.';

it('should generate a valid OpenAPI specification', async () => {
  expect(await SwaggerParser.validate(api())).toBeDefined();
});
