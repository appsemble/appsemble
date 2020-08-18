const path = require('path');

const yaml = require('js-yaml');
const autolink = require('remark-autolink-headings');
const frontmatter = require('remark-frontmatter');
const slug = require('remark-slug');
const visit = require('unist-util-visit');

const shared = require('./shared');

/**
 * This webpack configuration is used by the Appsemble core parts.
 *
 * This includes the app and studio, but not blocks.
 */
module.exports = (env, argv) => {
  const { mode, publicPath } = argv;
  const production = mode === 'production';

  const sharedConfig = shared(env, argv);

  return {
    ...sharedConfig,
    module: {
      ...sharedConfig.module,
      rules: [
        ...sharedConfig.module.rules,
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
                  () => (ast) => {
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
                      const chunks = node.url.split('#');
                      chunks[0] = chunks[0].replace(/(\/?index)?\.mdx?$/, '');
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
          test: /[/\\]messages\.tsx?$/,
          loader: 'babel-loader',
          options: {
            plugins: ['babel-plugin-react-intl-auto'],
          },
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.join(
              path.resolve(__dirname, '../..'),
              'packages',
              env,
              'tsconfig.json',
            ),
          },
        },
        {
          test: /\.(gif|jpe?g|png|svg|ttf|woff2?)$/,
          loader: 'file-loader',
          options: {
            name: production ? '_/[contentHash].[ext]' : '_/[name].[ext]',
            publicPath,
          },
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
      ],
    },
  };
};
