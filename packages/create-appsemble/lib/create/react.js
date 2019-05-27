import fs from 'fs-extra';
import path from 'path';
import sortPackageJson from 'sort-package-json';

import { dependencies } from '../../templates/react/package.json';

export default async function react(outputPath, pkg) {
  const outPkg = sortPackageJson({
    ...pkg,
    dependencies: { ...pkg.dependencies, ...dependencies },
  });

  await fs.copy(path.resolve(__dirname, '../../templates/react'), outputPath);
  await fs.outputJSON(path.join(outputPath, 'package.json'), outPkg, { spaces: 2 });
}
