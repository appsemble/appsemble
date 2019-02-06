const { CI_COMMIT_SHA, CI_ENVIRONMENT_SLUG } = process.env;

export default {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-mysql`,
    resourceVersion: CI_COMMIT_SHA,
    labels: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'mysql',
    },
  },
  spec: {
    ports: [{ port: 3306 }],
    selector: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'mysql',
    },
    clusterIP: 'None',
  },
};
