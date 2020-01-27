const { CI_COMMIT_REF_NAME = 'dev' } = process.env;

export default {
  src: './docs',
  files: '**/*.{md,mdx}',
  title: `Appsemble ${CI_COMMIT_REF_NAME}`,
  menu: ['Getting Started', 'Architecture', 'Blocks', 'Development', 'Deployment'],
  gatsbyRemarkPlugins: [
    {
      resolve: 'gatsby-remark-mermaid',
    },
  ],
};
