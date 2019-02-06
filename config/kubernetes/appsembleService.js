const { CI_COMMIT_SHA, CI_ENVIRONMENT_SLUG } = process.env;

export default {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-frontend`,
    resourceVersion: CI_COMMIT_SHA,
    labels: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'frontend',
    },
  },
  spec: {
    ports: [{ port: 9999 }],
    selector: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'frontend',
    },
  },
};
