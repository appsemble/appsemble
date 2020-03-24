// XXX delete when https://github.com/DefinitelyTyped/DefinitelyTyped/pull/43085 is merged.
import { AcceptedPlugin, Transformer } from 'postcss';

interface AtImportOptions {
  root?: string;
  path?: string | string[];
  plugins?: AcceptedPlugin[];
  resolve?: (is: string, basedir: string, importOptions: AtImportOptions) => string;
  load?: (filename: string, importOptions: AtImportOptions) => string;
  skipDuplicates?: boolean;
  addModulesDirectories?: string[];
}

declare function atImport(options: AtImportOptions): Transformer;

// eslint-disable-next-line no-redeclare
declare namespace atImport {}

export = atImport;
