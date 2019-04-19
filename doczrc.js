module.exports = {
  base: process.env.CI_ENVIRONMENT_URL
    ? new URL(process.env.CI_ENVIRONMENT_URL).pathname.replace(/index\.html$/, '')
    : '/',
  src: './docs',
  title: 'Appsemble',
  menu: ['Getting Started', 'Architecture', 'Blocks', 'Development', 'Deployment'],
};
