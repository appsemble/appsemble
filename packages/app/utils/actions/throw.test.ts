import { createTestAction } from '../makeActions';

describe('throw', () => {
  it('should return the static value', async () => {
    const action = createTestAction({ definition: { type: 'throw' } });
    const result = action('Input data');
    await expect(result).rejects.toBe('Input data');
  });
});
