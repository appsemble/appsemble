import setupModels from '../utils/setupModels';
import truncate from '../utils/test/truncate';

describe('app controller', () => {
  let models;

  beforeAll(async () => {
    models = await setupModels(true);
  });

  beforeEach(async () => {
    await truncate();
  });

  it('should return true', () => {
    expect(true).toEqual(true);
  });


  it('should be able to add an app', async () => {
    const { App } = models;
    let count = await App.count();
    expect(count).toBe(0);

    const app = await App.create({ definition: { foo: 'bar', baz: 3 } });
    expect(app).toBeTruthy();

    count = await App.count();
    expect(count).toBe(1);
  });


  it('should be able to do the same test as the previous one and still work :)', async () => {
    const { App } = models;

    let count = await App.count();
    expect(count).toBe(0);

    const app = await App.create({ definition: { foo: 'bar', baz: 3 } });
    expect(app).toBeTruthy();

    count = await App.count();
    expect(count).toBe(1);
  });
});
