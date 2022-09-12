import { remap } from '@appsemble/utils';

import { createTestAction } from '../makeActions.js';

describe('message', () => {
  it('should return the input data', async () => {
    const showMessage = import.meta.jest.fn();
    const action = createTestAction({
      definition: { type: 'message', body: '' },
      remap,
      showMessage,
    });
    const result = await action({ input: 'data' });
    expect(result).toStrictEqual({ input: 'data' });
  });

  it('should show the remapped message', async () => {
    const showMessage = import.meta.jest.fn();
    const action = createTestAction({
      definition: { type: 'message', body: { 'string.case': 'upper' } },
      remap,
      showMessage,
    });
    await action('Hello, world');
    expect(showMessage).toHaveBeenCalledWith({
      body: 'HELLO, WORLD',
      color: 'info',
      dismissable: undefined,
      timeout: undefined,
    });
  });

  it('should support customizations', async () => {
    const showMessage = import.meta.jest.fn();
    const action = createTestAction({
      definition: {
        type: 'message',
        body: { 'string.case': 'upper' },
        color: 'danger',
        dismissable: true,
        timeout: 10,
      },
      remap,
      showMessage,
    });
    await action('Hello, world');
    expect(showMessage).toHaveBeenCalledWith({
      body: 'HELLO, WORLD',
      color: 'danger',
      dismissable: true,
      timeout: 10,
    });
  });
});
