// Type definitions for unused-webpack-plugin 2.4
// Project: https://github.com/MatthieuLemoine/unused-webpack-plugin#readme
// Definitions by: Remco Haszing <https://github.com/remcohaszing>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4

import { Compiler, WebpackPluginInstance } from 'webpack';

/**
 * A webpack plugin to find unused modules/source files.
 */
declare class UnusedWebpackPlugin implements WebpackPluginInstance {
  constructor(options: UnusedWebpackPlugin.UnusedWebpackPluginOptions);
  apply(compiler: Compiler): void;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
declare namespace UnusedWebpackPlugin {
  interface UnusedWebpackPluginOptions {
    /**
     * Array of directories where to look for unused source files.
     */
    directories: string[];

    /**
     * Array of exclude patterns when looking for unused source files.
     */
    exclude?: string[];

    /**
     * Root directory that will be use to display relative paths instead of absolute ones
     */
    root?: string;

    /**
     * Whether or not the build should fail if unused files are found.
     *
     * @default false
     */
    failOnUnused?: boolean;

    /**
     * Whether or not to respect .gitignore file
     *
     * @default true
     */
    useGitIgnore?: boolean;
  }
}

export = UnusedWebpackPlugin;
