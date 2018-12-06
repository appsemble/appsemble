import path from 'path';

import fs from 'fs-extra';

export default async function vanilla(outputPath, pkg) {
  await Promise.all([
    fs.outputJSON(path.join(outputPath, 'package.json'), pkg, { spaces: 2 }),
    fs.copy(path.resolve(__dirname, '../../templates/vanilla'), path.join(outputPath, 'src')),
  ]);
}
