import fs from 'fs';
import path from 'path';

const icon = fs.readFileSync(path.join(__dirname, './icon.svg'));

export default function getDefaultIcon() {
  return icon.slice();
}
