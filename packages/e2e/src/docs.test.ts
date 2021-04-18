import { open } from './utils';

describe('/docs', () => {
  beforeEach(async () => {
    await open('/en/docs');
  });

  it('should render a list of blocks', async () => {
    await expect(page).toMatch('Getting Started');
  });
});
