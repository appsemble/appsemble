import inquirer from 'inquirer';
import path from 'path';

import { createReact, createVanilla } from '../lib/create';

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

export async function handler() {
  const answers = await inquirer.prompt([
    { name: 'organization', message: 'For which organization is the block?' },
    { name: 'name', message: 'What should be the name of the block?' },
    {
      name: 'type',
      choices: ['vanilla', 'react'],
      default: 'vanilla',
      message: 'What kind of block project should be bootstrapped?',
    },
  ]);
  const outputPath = path.join(process.cwd(), 'blocks', answers.name);
  const pkg = {
    name: `@${answers.organization}/${answers.name}`,
    version: '0.0.0',
    private: true,
    dependencies: {
      '@appsemble/sdk': '^1.0.0',
    },
  };
  switch (answers.type) {
    case 'react':
      await createReact(outputPath, pkg);
      break;
    case 'vanilla':
    default:
      await createVanilla(outputPath, pkg);
  }
}
