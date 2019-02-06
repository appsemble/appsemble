const { CI_COMMIT_SHA, CI_ENVIRONMENT_URL, CI_ENVIRONMENT_SLUG } = process.env;
const { hostname } = new URL(CI_ENVIRONMENT_URL);

export default {
  apiVersion: 'extensions/v1beta1',
  kind: 'Ingress',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-ingress`,
    resourceVersion: CI_COMMIT_SHA,
    labels: {
      app: CI_ENVIRONMENT_SLUG,
    },
    annotations: {
      'certmanager.k8s.io/cluster-issuer': 'letsencrypt-prod',
      'kubernetes.io/ingress.class': 'nginx',
      'nginx.ingress.kubernetes.io/proxy-body-size': '50m',
    },
  },
  spec: {
    tls: [
      {
        hosts: [hostname],
        secretName: `${CI_ENVIRONMENT_SLUG}-prod`,
      },
    ],
    rules: [
      {
        host: hostname,
        http: {
          paths: [
            {
              path: '/',
              backend: {
                serviceName: `${CI_ENVIRONMENT_SLUG}-frontend`,
                servicePort: 9999,
              },
            },
          ],
        },
      },
    ],
  },
};
