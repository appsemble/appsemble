export interface EnhancedMock extends jest.Mock {
  waitToHaveBeenCalled: (t: number) => Promise<void>;
}

/**
 * Creates a mock function that can be awaited to be called X amount of times.
 *
 * Taken from https://github.com/facebook/jest/issues/7432#issuecomment-443536177
 *
 * @returns A mock which is resolved when it is called.
 */
export function createWaitableMock(): EnhancedMock {
  let resolve: () => void;
  let times: number;
  let calledCount = 0;
  const mock = jest.fn() as EnhancedMock;
  mock.mockImplementation(() => {
    calledCount += 1;
    if (resolve && calledCount >= times) {
      resolve();
    }
  });

  mock.waitToHaveBeenCalled = (t: number) => {
    times = t;
    return new Promise((r) => {
      resolve = r;
    });
  };

  return mock;
}
