const { CI_COMMIT_REF_NAME = 'dev' } = process.env;

module.exports = {
  src: './docs',
  title: `Appsemble ${CI_COMMIT_REF_NAME}`,
  menu: ['Getting Started', 'Architecture', 'Blocks', 'Development', 'Deployment'],
};
