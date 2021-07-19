import { promises as fs } from 'fs';

import { dump } from 'js-yaml';
import { format, resolveConfig } from 'prettier';

/**
 * Output an object as a YAML file, formatted using Prettier.
 *
 * @param filepath - The file path to write to.
 * @param content - The content to write.
 */
export async function outputYaml(filepath: string, content: any): Promise<void> {
  const yaml = dump(content);
  const config = await resolveConfig(filepath, { editorconfig: true });
  await fs.writeFile(filepath, format(yaml, { ...config, filepath }));
}
