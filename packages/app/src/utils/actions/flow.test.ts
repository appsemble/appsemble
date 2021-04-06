import { FlowActions } from '../../types';
import { createTestAction } from '../makeActions';

let flowActions: FlowActions;

beforeEach(() => {
  flowActions = {
    back: jest.fn().mockReturnValue({ value: 'back value' }),
    cancel: jest.fn().mockReturnValue({ value: 'cancel value' }),
    finish: jest.fn().mockReturnValue({ value: 'finish value' }),
    next: jest.fn().mockReturnValue({ value: 'next value' }),
  };
});

describe('flow.back', () => {
  it('should call the next flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.back' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(result).toStrictEqual({ value: 'back value' });
  });
});

describe('flow.cancel', () => {
  it('should call the next flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.cancel' },
      flowActions,
    });
    const result = await action({ input: 'data' });
    expect(result).toStrictEqual({ value: 'cancel value' });
  });
});

describe('flow.finish', () => {
  it('should call the next flow action', async () => {
    const action = createTestAction({
      definition: { type: 'flow.finish' },
      flowActions,
    });
    const result = await action({ input: 'data' });
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
    expect(result).toStrictEqual({ value: 'next value' });
  });
});
