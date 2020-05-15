const { CI_COMMIT_REF_NAME = 'dev' } = process.env;

export default {
  src: './docs',
  files: '**/*.{md,mdx}',
  title: `Appsemble ${CI_COMMIT_REF_NAME}`,
  description: 'Documentation for Appsemble, the low-code app building platform',
  menu: ['Getting Started', 'Guide', 'Architecture', 'Blocks', 'Development', 'Deployment'],
  gatsbyRemarkPlugins: [
    {
      resolve: 'gatsby-remark-mermaid',
    },
  ],
};
