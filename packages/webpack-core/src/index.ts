import { dirname, join } from 'path';

import faPkg from '@fortawesome/fontawesome-free/package.json';
import bulmaPkg from 'bulma/package.json';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin, { MinifyOptions } from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import autolink from 'rehype-autolink-headings';
import slug from 'rehype-slug';
import frontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import { remarkMdxFrontmatter } from 'remark-mdx-frontmatter';
import { remarkMdxImages } from 'remark-mdx-images';
import { remarkMermaid } from 'remark-mermaidjs';
import ServiceWorkerWebpackPlugin from 'serviceworker-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import UnusedWebpackPlugin from 'unused-webpack-plugin';
import { CliConfigOptions, Configuration, EnvironmentPlugin } from 'webpack';

import studioPkg from '../package.json';
import { remarkHeading } from './remark/heading';
import { remarkRewriteLinks } from './remark/rewriteLinks';

const minify: MinifyOptions = {
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  minifyJS: true,
  processScripts: ['text/x-template'],
  removeAttributeQuotes: true,
  removeComments: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
};

const packagesDir = dirname(dirname(__dirname));
const rootDir = dirname(packagesDir);

/**
 * This webpack configuration is used by the Appsemble core parts.
 *
 * @param env - The name of the environment to build.
 * @param argv - Webpack arguments.
 * @returns A partial webpack configuration.
 */
function shared(env: string, { mode }: CliConfigOptions): Configuration {
  const production = mode === 'production';
  const projectDir = join(packagesDir, env);
  const configFile = join(projectDir, 'tsconfig.json');
  const entry = join(projectDir, 'src');
  const publicPath = production ? undefined : `/${env}`;

  return {
    name: `@appsemble/${env}`,
    devtool: 'source-map',
    mode,
    entry: [entry],
    output: {
      filename: production ? '[contentHash].js' : `${env}.js`,
      publicPath,
      path: production ? join(rootDir, 'dist', env) : publicPath,
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json'],
      plugins: [new TsconfigPathsPlugin({ configFile })],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: join(entry, 'index.html'),
        templateParameters: {
          bulmaURL: `/bulma/${bulmaPkg.version}/bulma.min.css`,
          faURL: `/fa/${faPkg.version}/css/all.min.css`,
        },
        filename: 'index.html',
        minify,
      }),
      new CaseSensitivePathsPlugin(),
      new EnvironmentPlugin({
        APPSEMBLE_VERSION: studioPkg.version,
      }),
      new MiniCssExtractPlugin({
        filename: production ? '[contentHash].css' : `${env}.css`,
      }),
      new UnusedWebpackPlugin({
        directories: [entry],
        exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/types.ts'],
        failOnUnused: production,
      }),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      minimizer: [
        new TerserPlugin({ cache: true, parallel: true, sourceMap: true }),
        new OptimizeCSSAssetsPlugin(),
      ],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: production ? '[hash:base64:5]' : '[path][name]_[local]',
                },
              },
            },
            'postcss-loader',
          ],
        },
        {
          test: /\.mdx?$/,
          use: [
            {
              loader: 'xdm/webpack.cjs',
              options: {
                providerImportSource: '@mdx-js/react',
                remarkPlugins: [
                  frontmatter,
                  gfm,
                  production && remarkMermaid,
                  remarkMdxFrontmatter,
                  remarkMdxImages,
                  remarkHeading,
                  remarkRewriteLinks,
                ].filter(Boolean),
                rehypePlugins: [
                  slug,
                  [
                    autolink,
                    {
                      content: {
                        type: 'element',
                        tagName: 'span',
                        properties: {
                          className: ['fas', 'fa-link', 'fa-xs', 'has-text-grey-lighter', 'mr-2'],
                        },
                      },
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /[/\\]messages\.ts$/,
          loader: 'babel-loader',
          options: {
            plugins: [
              ['babel-plugin-react-intl-auto', { filebase: false, removePrefix: 'packages/' }],
            ],
          },
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile,
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|ttf|woff2?)$/,
          loader: 'file-loader',
          options: {
            name: production ? '[contentHash].[ext]' : '[path][name].[ext]',
            publicPath,
          },
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
        {
          test: /yaml\.worker\.js$/,
          loader: 'worker-loader',
        },
      ],
    },
  };
}

/**
 * Create a Webpack configuration for Appsemble app.
 *
 * @param argv - Webpack arguments.
 * @returns The Webpack configuration for Appsemble app.
 */
export function createAppConfig(argv: CliConfigOptions): Configuration {
  const { mode } = argv;
  const production = mode === 'production';

  const config = shared('app', argv);
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: join((config.entry as string[])[0], 'error.html'),
      filename: 'error.html',
      minify,
      chunks: [],
    }),
    new ServiceWorkerWebpackPlugin({
      entry: require.resolve('@appsemble/service-worker/src/index.ts'),
      filename: 'service-worker.js',
      minimize: production,
      publicPath: '/',
      transformOptions: ({ assets }) => assets,
    }),
  );
  return config;
}

/**
 * Create a Webpack configuration for Appsemble Studio.
 *
 * @param argv - Webpack arguments.
 * @returns The Webpack configuration for Appsemble Studio.
 */
export function createStudioConfig(argv: CliConfigOptions): Configuration {
  const config = shared('studio', argv);
  config.plugins.push(new MonacoWebpackPlugin({ languages: ['css', 'json', 'yaml'] }));
  return config;
}
