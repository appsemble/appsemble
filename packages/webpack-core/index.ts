import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bulmaVersion, faVersion, logger } from '@appsemble/node-utils';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin, { type MinifyOptions } from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeMdxCodeProps from 'rehype-mdx-code-props';
import rehypeMdxImportMedia from 'rehype-mdx-import-media';
import rehypeMdxTitle from 'rehype-mdx-title';
import rehypeMermaid from 'rehype-mermaid';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { type Options } from 'sass';
import UnusedWebpackPlugin from 'unused-webpack-plugin';
import { type Configuration } from 'webpack';
import { GenerateSW, InjectManifest } from 'workbox-webpack-plugin';

import { rehypeSearchIndex } from './rehype/searchIndex.js';
import { remarkRewriteLinks } from './remark/rewriteLinks.js';

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

const packagesDir = new URL('../', import.meta.url);
const rootDir = new URL('../', packagesDir);

/**
 * This webpack configuration is used by the Appsemble core parts.
 *
 * @param env The name of the environment to build.
 * @param argv Webpack arguments.
 * @returns A partial webpack configuration.
 */
function shared(env: string, { mode }: CliConfigOptions): Configuration {
  const production = mode === 'production';
  const projectURL = new URL(`${env}/`, packagesDir);
  const projectDir = fileURLToPath(new URL(env, packagesDir));
  const configFile = fileURLToPath(new URL('tsconfig.json', projectURL));
  const publicPath = production ? '/' : `/${env}/`;

  return {
    name: `@appsemble/${env}`,
    devtool: 'source-map',
    mode,
    entry: { [env]: [join(projectDir, 'index.tsx')] },
    output: {
      filename: production ? '[contenthash].js' : `${env}-[name].js`,
      publicPath,
      path: production ? fileURLToPath(new URL(`dist/${env}`, rootDir)) : `/${env}/`,
      chunkFilename: production ? '[contenthash].js' : '[id].js',
    },
    resolve: {
      conditionNames: ['ts-source', '...'],
      extensions: ['.js', '.ts', '.tsx', '.json'],
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.cjs': ['.cjs', '.cts'],
        '.mjs': ['.mjs', '.mts'],
      },
      fallback: {
        path: false,
      },
      modules: [join(projectDir, 'node_modules'), fileURLToPath(new URL('node_modules', rootDir))],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: fileURLToPath(new URL('index.html', projectURL)),
        templateParameters: {
          bulmaURL: `/bulma/${bulmaVersion}/bulma.min.css`,
          faURL: `/fa/${faVersion}/css/all.min.css`,
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
          'vitest.setup.ts',
          'vitest.config.ts',
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
                  remarkFrontmatter,
                  remarkGfm,
                  remarkMdxFrontmatter,
                  remarkRewriteLinks,
                ],
                rehypePlugins: [
                  production && rehypeMermaid,
                  rehypeMdxImportMedia,
                  rehypeMdxCodeProps,
                  rehypeMdxTitle,
                  rehypeSlug,
                  [
                    rehypeAutolinkHeadings,
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
                  rehypeSearchIndex,
                ].filter(Boolean),
              },
            },
          ],
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
 * @param argv Webpack arguments.
 * @returns The Webpack configuration for Appsemble app.
 */
export function createAppConfig(argv: CliConfigOptions): Configuration {
  const config = shared('app', argv);
  config.plugins?.push(
    new HtmlWebpackPlugin({
      template: fileURLToPath(new URL('app/error.html', packagesDir)),
      filename: 'error.html',
      minify,
      chunks: [],
    }),
    new InjectManifest({
      swSrc: fileURLToPath(new URL('../service-worker/index.ts', import.meta.url)),
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
 * @param argv Webpack arguments.
 * @returns The Webpack configuration for Appsemble Studio.
 */
export function createStudioConfig(argv: CliConfigOptions): Configuration {
  const config = shared('studio', argv);
  if (argv.mode === 'production') {
    config.plugins?.push(
      new GenerateSW({
        // Some of our JavaScript assets are still too big to fit within the default cache limit.
        maximumFileSizeToCacheInBytes: 3 * 2 ** 20,
        exclude: ['index.html'],
        runtimeCaching: [
          {
            urlPattern: /^\/index.html|\/$/,
            handler: 'NetworkFirst',
          },
        ],
      }),
    );
  }
  return config;
}
