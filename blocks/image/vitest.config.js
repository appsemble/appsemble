import { createVitestConfig } from '../../config/vitest/config.js';

const config = createVitestConfig(import.meta);

export default {
  ...config,
  test: { ...config.test, css: { ...config.test.css, include: [/blocks\/image\/src\/.*\.css$/] } },
};
