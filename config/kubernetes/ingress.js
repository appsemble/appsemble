const { CI_ENVIRONMENT_SLUG } = process.env;

module.exports = {
  apiVersion: 'extensions/v1beta1',
  kind: 'Ingress',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-ingress`,
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
        hosts: [`${CI_ENVIRONMENT_SLUG}.appsemble.app`],
        secretName: `${CI_ENVIRONMENT_SLUG}-prod`,
      },
    ],
    rules: [
      {
        host: `${CI_ENVIRONMENT_SLUG}.appsemble.app`,
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
