const { join, relative, resolve } = require('path');

// Adding this to package.json causes yarn to fail in production mode.
// eslint-disable-next-line import/no-extraneous-dependencies
const studioPkg = require('@appsemble/server/package.json');
const faPkg = require('@fortawesome/fontawesome-free/package.json');
const bulmaPkg = require('bulma/package.json');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const yaml = require('js-yaml');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const autolink = require('remark-autolink-headings');
const frontmatter = require('remark-frontmatter');
const slug = require('remark-slug');
const TerserPlugin = require('terser-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const visit = require('unist-util-visit');
const UnusedWebpackPlugin = require('unused-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');

const minify = require('./html-minifier.json');

/**
 * This webpack configuration is used by the Appsemble core parts.
 */
module.exports = (env, argv) => {
  const { mode } = argv;
  const production = mode === 'production';
  const root = resolve(__dirname, '../..');
  const configFile = join(root, 'packages', env, 'tsconfig.json');
  const entry = join(root, 'packages', env, 'src');
  const publicPath = production ? undefined : `/${env}`;

  return {
    name: `@appsemble/${env}`,
    devtool: 'source-map',
    mode,
    entry: [entry],
    output: {
      filename: production ? '[contentHash].js' : `${env}.js`,
      publicPath,
      path: production ? join(root, 'dist', env) : publicPath,
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
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
        }),
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
              loader: 'babel-loader',
              options: {
                plugins: ['@babel/plugin-transform-react-jsx'],
              },
            },
            {
              loader: '@mdx-js/loader',
              options: {
                remarkPlugins: [
                  frontmatter,
                  () => (ast, vfile) => {
                    ast.children.forEach((node, index) => {
                      if (node.type === 'heading' && node.depth === 1) {
                        ast.children.push({
                          type: 'export',
                          value: `export const title = ${JSON.stringify(node.children[0].value)};`,
                        });
                      }
                      if (node.type === 'yaml') {
                        // eslint-disable-next-line no-param-reassign
                        ast.children[index] = {
                          type: 'export',
                          value: `export const meta = ${JSON.stringify(
                            yaml.safeLoad(node.value),
                          )};`,
                        };
                      }
                    });
                    visit(ast, { type: 'link' }, (node) => {
                      if (/^(https?:\/)?\//.test(node.url)) {
                        // External URLs or absolute URLs to Appsemble Studio
                        return;
                      }
                      const chunks = node.url.split('#');
                      if (!chunks[0]) {
                        // Internal hash URLs
                        return;
                      }
                      // Resolve the link from the directory containing the file.
                      const resolved = resolve(vfile.dirname, chunks[0]);
                      // Resolve the path relative to the CWD. This works, because the directory
                      // containing the docs and the URL prefix are the same. Otherwise, this would
                      // need to be replaced as well.
                      const rel = relative(vfile.cwd, resolved);
                      // Strip the `.md` extension and `index` filename.
                      const stripped = rel.replace(/(\/?index)?\.mdx?$/, '');
                      // Make the URL absolute, so no weird routing happens at runtime.
                      const prefixed = `/${stripped}`;
                      chunks[0] = prefixed;
                      // Update the node URL, taking the URL hash into account.
                      // eslint-disable-next-line no-param-reassign
                      node.url = chunks.join('#');
                    });
                    const images = [];
                    visit(ast, { type: 'image' }, (node, index, parent) => {
                      const identifier = `__image_${images.length}__`;
                      images.push({
                        type: 'import',
                        value: `import ${identifier} from ${JSON.stringify(node.url)}`,
                      });
                      // eslint-disable-next-line no-param-reassign
                      parent.children[index] = {
                        type: 'jsx',
                        value: `<img alt=${JSON.stringify(node.alt)} src={${identifier}} />`,
                      };
                    });
                    ast.children.unshift(...images);
                    return ast;
                  },
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
};
