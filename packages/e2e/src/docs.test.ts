import { open } from './utils';

describe('/docs', () => {
  beforeEach(async () => {
    await open('/en/docs');
  });

  it('should render the getting started page', async () => {
    await expect(page).toMatch('Getting Started');
  });
});
