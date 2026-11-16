import { createVitestConfig } from '../../config/vitest/config.js';

const config = createVitestConfig(import.meta);

export default {
  ...config,
  resolve: {
    // The app runs on Preact through `preact/compat`, matching its webpack aliases.
    alias: {
      '@testing-library/react': '@testing-library/preact',
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
    // The CommonJS entries of React libraries load React through Node, bypassing the aliases.
    mainFields: ['module', 'main'],
  },
  test: {
    ...config.test,
    server: {
      deps: {
        // Externalized dependencies skip the aliases, so the libraries that import React are
        // inlined.
        inline: [
          /node_modules\/(qrcode\.react|react-intl|react-router|react-router-dom|react-use-pwa-install)\//,
        ],
      },
    },
  },
};
