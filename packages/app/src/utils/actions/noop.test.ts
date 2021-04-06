import { createTestAction } from '../makeActions';

describe('static', () => {
  it('should return the input data', async () => {
    const action = createTestAction({
      definition: {
        type: 'noop',
      },
    });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
  });
});
