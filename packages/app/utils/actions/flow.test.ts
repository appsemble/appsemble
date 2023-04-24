import { type FlowActions } from '../../types.js';
import { createTestAction } from '../makeActions.js';

let flowActions: FlowActions;

beforeEach(() => {
  flowActions = {
    back: import.meta.jest.fn().mockReturnValue({ value: 'back value' }),
    cancel: import.meta.jest.fn().mockReturnValue({ value: 'cancel value' }),
    finish: import.meta.jest.fn().mockReturnValue({ value: 'finish value' }),
    next: import.meta.jest.fn().mockReturnValue({ value: 'next value' }),
    to: import.meta.jest.fn().mockReturnValue({ value: 'to value' }),
  };
});

describe('flow.back', () => {
  it('should call the back flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.back' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(flowActions.back).toHaveBeenCalledWith({ input: 'data' });
    expect(result).toStrictEqual({ value: 'back value' });
  });
});

describe('flow.cancel', () => {
  it('should call the cancel flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.cancel' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(flowActions.cancel).toHaveBeenCalledWith({ input: 'data' });
    expect(result).toStrictEqual({ value: 'cancel value' });
  });
});

describe('flow.finish', () => {
  it('should call the finish flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.finish' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(flowActions.finish).toHaveBeenCalledWith({ input: 'data' });
    expect(result).toStrictEqual({ value: 'finish value' });
  });
});

describe('flow.next', () => {
  it('should call the next flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.next' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(flowActions.next).toHaveBeenCalledWith({ input: 'data' });
    expect(result).toStrictEqual({ value: 'next value' });
  });
});

describe('flow.to', () => {
  it('should call the to flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.to', step: { prop: 'input' } },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(flowActions.to).toHaveBeenCalledWith({ input: 'data' }, 'data');
    expect(result).toStrictEqual({ value: 'to value' });
  });
});
