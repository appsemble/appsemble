import SwaggerParser from 'swagger-parser';

import api from '.';

it('should generate a valid OpenAPI specification', async () => {
  await expect(SwaggerParser.validate(api())).resolves.toBeDefined();
});
