interface EnhancedMock extends jest.Mock {
  waitToHaveBeenCalled: (t: number) => Promise<any>;
}

/**
 * Creates a mock function that can be awaited to be called X amount of times.
 *
 * Taken from https://github.com/facebook/jest/issues/7432#issuecomment-443536177
 */
export default function createWaitableMock(): EnhancedMock {
  let resolve: (value?: any) => void;
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
