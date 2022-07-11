import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  includeShadowDom: true,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'junit.xml',
  },
  env: process.env,
  e2e: {
    baseUrl: `https://${process.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`,
    specPattern: '**/*.cy.ts',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          // eslint-disable-next-line no-param-reassign
          launchOptions.preferences = {
            ...launchOptions.preferences,
            width: 1920,
            height: 1080,
            fullscreen: true,
          };

          return launchOptions;
        }
      });
    },
  },
});
