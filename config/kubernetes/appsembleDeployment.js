const {
  CI_COMMIT_REF_NAME,
  CI_ENVIRONMENT_SLUG,
  CI_ENVIRONMENT_URL,
  CI_PROJECT_PATH,
  CI_REGISTRY_IMAGE,
} = process.env;

export default {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-frontend`,
    labels: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'frontend',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: CI_ENVIRONMENT_SLUG,
        tier: 'frontend',
      },
    },
    template: {
      metadata: {
        labels: {
          app: CI_ENVIRONMENT_SLUG,
          tier: 'frontend',
        },
      },
      spec: {
        containers: [
          {
            image: `${CI_REGISTRY_IMAGE}:${CI_COMMIT_REF_NAME}`,
            // Make sure we always pull the latest GitLab master build Docker image instead of a cached one.
            imagePullPolicy: 'Always',
            name: 'appsemble',
            env: [
              {
                name: 'DATABASE_HOST',
                value: `${CI_ENVIRONMENT_SLUG}-mysql`,
              },
              {
                name: 'DATABASE_NAME',
                valueFrom: { secretKeyRef: { name: 'database', key: 'database' } },
              },
              {
                name: 'DATABASE_USER',
                valueFrom: { secretKeyRef: { name: 'database', key: 'user' } },
              },
              {
                name: 'DATABASE_PASSWORD',
                valueFrom: { secretKeyRef: { name: 'database', key: 'password' } },
              },
              {
                name: 'SMTP_HOST',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'host' } },
              },
              {
                name: 'SMTP_PORT',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'port' } },
              },
              {
                name: 'SMTP_SECURE',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'secure' } },
              },
              {
                name: 'SMTP_USER',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'user' } },
              },
              {
                name: 'SMTP_PASS',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'pass' } },
              },
              {
                name: 'SMTP_FROM',
                valueFrom: { secretKeyRef: { name: 'smtp', key: 'from' } },
              },
              {
                name: 'HOST',
                value: CI_ENVIRONMENT_URL,
              },
            ].concat(
              CI_PROJECT_PATH === 'dcentralized/appsemble/appsemble' &&
                CI_COMMIT_REF_NAME === 'master'
                ? [
                    {
                      name: 'OAUTH_GITLAB_KEY',
                      valueFrom: { secretKeyRef: { name: 'gitlab', key: 'key' } },
                    },
                    {
                      name: 'OAUTH_GITLAB_SECRET',
                      valueFrom: { secretKeyRef: { name: 'gitlab', key: 'secret' } },
                    },
                    {
                      name: 'OAUTH_GOOGLE_KEY',
                      valueFrom: { secretKeyRef: { name: 'google', key: 'key' } },
                    },
                    {
                      name: 'OAUTH_GOOGLE_SECRET',
                      valueFrom: { secretKeyRef: { name: 'google', key: 'secret' } },
                    },
                  ]
                : [],
            ),
            ports: [{ containerPort: 9999 }],
            resources: {
              requests: {
                cpu: '250m',
                memory: '1G',
              },
              limits: {
                cpu: 1,
                memory: '1G',
              },
            },
          },
        ],
        imagePullSecrets: [{ name: 'registry.gitlab.com' }],
      },
    },
  },
};
