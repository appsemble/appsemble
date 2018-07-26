const babel = require('@babel/core');


module.exports = {
  process(src, filename) {
    const result = babel.transformSync(src, {
      envName: 'jest',
      filename,
      sourceFileName: filename,
      sourceMaps: 'inline',
    });
    return result;
  },
};
