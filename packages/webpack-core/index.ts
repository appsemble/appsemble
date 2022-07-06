import { dirname, join, resolve } from 'path';

import { logger } from '@appsemble/node-utils';
import faPkg from '@fortawesome/fontawesome-free/package.json';
import bulmaPkg from 'bulma/package.json';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin, { MinifyOptions } from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import autolink from 'rehype-autolink-headings';
import { rehypeMdxTitle } from 'rehype-mdx-title';
import slug from 'rehype-slug';
import frontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import { remarkMdxCodeMeta } from 'remark-mdx-code-meta';
import { remarkMdxFrontmatter } from 'remark-mdx-frontmatter';
import { remarkMdxImages } from 'remark-mdx-images';
import { remarkMermaid } from 'remark-mermaidjs';
import { Options } from 'sass';
import UnusedWebpackPlugin from 'unused-webpack-plugin';
import { Configuration } from 'webpack';
import { GenerateSW, InjectManifest } from 'workbox-webpack-plugin';

import './types';
import { remarkRewriteLinks } from './remark/rewriteLinks';

interface CliConfigOptions {
  mode: 'development' | 'production';
}

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

const packagesDir = dirname(__dirname);
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
  const publicPath = production ? '/' : `/${env}/`;

  return {
    name: `@appsemble/${env}`,
    devtool: 'source-map',
    mode,
    entry: { [env]: [projectDir] },
    output: {
      filename: production ? '[contenthash].js' : `${env}-[name].js`,
      publicPath,
      path: production ? join(rootDir, 'dist', env) : `/${env}/`,
      chunkFilename: production ? '[contenthash].js' : '[id].js',
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json'],
      fallback: {
        path: false,
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: join(projectDir, 'index.html'),
        templateParameters: {
          bulmaURL: `/bulma/${bulmaPkg.version}/bulma.min.css`,
          faURL: `/fa/${faPkg.version}/css/all.min.css`,
        },
        filename: 'index.html',
        minify,
      }),
      new CaseSensitivePathsPlugin(),
      new MiniCssExtractPlugin({
        filename: production ? '[contenthash].css' : `${env}.css`,
      }),
      new UnusedWebpackPlugin({
        directories: [projectDir],
        exclude: [
          '**/*.test.{ts,tsx}',
          '**/*.d.ts',
          '**/*.md',
          '**/types.ts',
          '*.config.js',
          'mdx.ts',
          'jest.setup.ts',
          'node_modules',
          'tsconfig.json',
        ],
        failOnUnused: production,
      }),
    ],
    optimization: {
      // https://webpack.js.org/configuration/optimization/#optimizationminimizer
      // '...' means it extends the Webpack defaults.
      minimizer: ['...', new CssMinimizerPlugin()],
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
          test: /\.s[ac]ss/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  logger: {
                    debug(message) {
                      logger.silly(message);
                    },
                    warn(message, { deprecation }) {
                      if (!deprecation) {
                        logger.verbose(message);
                      }
                    },
                  },
                } as Options<'async'>,
              },
            },
          ],
        },
        {
          test: /\.mdx?$/,
          use: [
            {
              loader: '@mdx-js/loader',
              options: {
                providerImportSource: '@mdx-js/react',
                remarkPlugins: [
                  frontmatter,
                  gfm,
                  production && remarkMermaid,
                  remarkMdxCodeMeta,
                  remarkMdxFrontmatter,
                  remarkMdxImages,
                  remarkRewriteLinks,
                ].filter(Boolean),
                rehypePlugins: [
                  rehypeMdxTitle,
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
          type: 'asset/resource',
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
        {
          test: /\/esm\/.*\.js$/,
          include: /node_modules/,
          type: 'javascript/auto',
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
  const config = shared('app', argv);
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: join(packagesDir, 'app', 'error.html'),
      filename: 'error.html',
      minify,
      chunks: [],
    }),
    new InjectManifest({
      swSrc: resolve(__dirname, '..', 'service-worker', 'index.ts'),
      swDest: 'service-worker.js',
      injectionPoint: 'appAssets',
      manifestTransforms: [
        (entries) => ({
          manifest: entries
            .map((entry) => (entry.url === '/index.html' ? { ...entry, url: '/' } : entry))
            .filter(({ url }) => !/\.(html|txt)$/.test(url)),
        }),
      ],
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
  if (argv.mode === 'production') {
    config.plugins.push(
      new GenerateSW({
        // Some of our JavaScript assets are still too big to fit within the default cache limit.
        maximumFileSizeToCacheInBytes: 3 * 2 ** 20,
      }),
    );
  }
  return config;
}
