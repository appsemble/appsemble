import { createTestAction } from '../makeActions';

describe('log', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  it('should support the info logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'info' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.info).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should support the warn logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'warn' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should support the error logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'error' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should default to the info logging level', async () => {
    const action = createTestAction({ definition: { type: 'log' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.info).toHaveBeenCalledWith({ test: 'data' });
  });
});
