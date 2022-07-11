import { fs } from 'memfs';

/**
 * This mock replaces {@link fs} with the default instnce of {@link memfs}.
 *
 * Make sure to reset before or after every test in a test file.
 *
 * @example
 * import { vol } from 'memfs';
 *
 * jest.mock('fs/promises');
 *
 * beforeEach(() => {
 *   vol.fromJson({
 *     'package.json': JSON.stringify({})
 *   });
 * });
 */
export = fs.promises;
