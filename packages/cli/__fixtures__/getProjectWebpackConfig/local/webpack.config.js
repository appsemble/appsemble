export default function webpackConfig(buildConfig, options) {
  return {
    mode: options.mode,
    name: buildConfig.name,
    output: {},
  };
}
