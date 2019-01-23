import path from 'path';

import fs from 'fs-extra';
import sortPackageJson from 'sort-package-json';

export default async function preact(outputPath, pkg) {
  const { dependencies } = await fs.readJSON(
    path.resolve(__dirname, '../../templates/preact/package.json'),
  );

  const outPkg = sortPackageJson({
    ...pkg,
    dependencies: { ...pkg.dependencies, ...dependencies },
  });

  await fs.copy(path.resolve(__dirname, '../../templates/preact'), outputPath);
  await fs.outputJSON(path.join(outputPath, 'package.json'), outPkg, { spaces: 2 });
}
