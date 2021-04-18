import { open } from './utils';

describe('/blocks', () => {
  beforeEach(async () => {
    await open('/en/blocks');
  });

  it('should render a list of blocks', async () => {
    await expect(page).toMatch('data-loader');
    await expect(page).toMatch('@appsemble');
  });

  it('should link to block details', async () => {
    await expect(page).toClick('[title="@appsemble/data-loader"] a', { text: 'View details' });
    await expect(page).toMatch('Parameters');
    await expect(page).toMatch('Actions');
    await expect(page).toMatch('Events');
  });
});
