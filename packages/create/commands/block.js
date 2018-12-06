import path from 'path';

import inquirer from 'inquirer';

import createVanilla from '../lib/create/vanilla';

export const command = 'block';
export const description = 'Bootstrap a new Appsemble block.';

export async function handler() {
  const answers = await inquirer.prompt([
    { name: 'organization', message: 'For which organization is the block?' },
    { name: 'name', message: 'What should be the name of the block?' },
    {
      name: 'type',
      choices: ['vanilla'],
      default: 'vanilla',
      message: 'Should the project bootstrapped block contain React boilerplate?',
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
    default:
      await createVanilla(outputPath, pkg);
  }
}
