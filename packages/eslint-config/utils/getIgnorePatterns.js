import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import findUp from 'find-up';

/**
 * Determine the default ignore pattern based on `.gitignore`.
 *
 * @returns {string[]} An array of ignore patterns accepted in an ESLint configuration.
 */
export function getIgnorePatterns() {
  const ignorePatterns = ['!.*'];
  const gitDir = findUp.sync('.git', { type: 'directory' });

  if (gitDir) {
    const gitIgnorePath = join(dirname(gitDir), '.gitignore');
    if (existsSync(gitIgnorePath)) {
      const ignore = readFileSync(gitIgnorePath, 'utf8');
      ignorePatterns.push(
        ...ignore.split(/\r?\n/g).filter((line) => line && !line.startsWith('#')),
      );
    }
  }
  return ignorePatterns;
}
