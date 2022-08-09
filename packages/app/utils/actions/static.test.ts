import { createTestAction } from '../makeActions.js';

describe('static', () => {
  it('should return the static value', async () => {
    const action = createTestAction({ definition: { type: 'static', value: 'Static value' } });
    const result = await action();
    expect(result).toBe('Static value');
  });
});
