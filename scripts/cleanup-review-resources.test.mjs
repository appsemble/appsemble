import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const cleanup = fileURLToPath(new URL('cleanup-review-resources.sh', import.meta.url));

function certificate(name, domain) {
  return {
    kind: 'secret',
    type: 'kubernetes.io/tls',
    metadata: {
      name,
      labels: { 'controller.cert-manager.io/fao': 'true' },
      annotations: { 'cert-manager.io/alt-names': domain },
    },
    data: { 'tls.crt': 'issued-certificate', 'tls.key': 'private-key' },
  };
}

const publicCertificates = [
  certificate('review-42-tls', '42.appsemble.review'),
  certificate('review-42-tls-wildcard', '*.42.appsemble.review'),
  certificate('api.minio.42-tls', 'api.minio.42.appsemble.review'),
  certificate('console.minio.42-tls', 'console.minio.42.appsemble.review'),
  certificate('rooster-42-tls', '*.rooster.42.appsemble.review'),
];
const unrelatedCertificates = [
  certificate('review-142-tls', '142.appsemble.review'),
  certificate('review-default-tls', '*.appsemble.review'),
];

function runCleanup(mode) {
  const directory = mkdtempSync(join(tmpdir(), 'review-cleanup-'));
  const state = join(directory, 'resources.json');
  try {
    writeFileSync(
      state,
      JSON.stringify([
        ...publicCertificates,
        ...unrelatedCertificates,
        ...['secret', 'certificate', 'ingress', 'pvc'].map((kind) => ({
          kind,
          metadata: {
            name: `review-42-${kind}`,
            labels: { 'app.kubernetes.io/instance': 'review-42' },
          },
        })),
        {
          kind: 'secret',
          type: 'kubernetes.io/tls',
          metadata: { name: 'review-42-mailpit-tls' },
        },
        {
          kind: 'ingress',
          metadata: {
            name: 'rooster-42',
            labels: { 'app.kubernetes.io/managed-by': 'review-42' },
          },
        },
      ]),
    );
    writeFileSync(join(directory, 'helm'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    writeFileSync(join(directory, 'curl'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    writeFileSync(
      join(directory, 'kubectl'),
      `#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const state = process.env.CLEANUP_TEST_STATE;
const resources = JSON.parse(readFileSync(state));
if (args[0] === 'get' && args[1] === 'secrets') {
  process.stdout.write(JSON.stringify({ items: resources.filter(r => r.kind === 'secret') }));
} else if (args[0] === 'delete') {
  const kinds = args[1].split(',');
  const selectorIndex = args.findIndex(arg => arg === '--selector' || arg === '-l');
  const selector = selectorIndex === -1 ? undefined : args[selectorIndex + 1];
  const names = args.slice(2).filter(arg => !arg.startsWith('-'));
  const matches = resource => kinds.includes(resource.kind) && (selector
    ? selector.split(',').every(pair => {
        const [key, value] = pair.split('=');
        return resource.metadata.labels?.[key] === value;
      })
    : names.includes(resource.metadata.name));
  writeFileSync(state, JSON.stringify(resources.filter(resource => !matches(resource))));
} else {
  throw new Error('Unsupported Kubernetes operation');
}
`,
      { mode: 0o700 },
    );
    execFileSync('sh', [cleanup], {
      env: {
        PATH: `${directory}:${process.env.PATH}`,
        CLEANUP_TEST_STATE: state,
        [mode]: '42',
      },
      stdio: 'pipe',
    });
    return JSON.parse(readFileSync(state));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('redeployment retains issued public certificates and removes the old deployment', () => {
  assert.deepEqual(runCleanup('REDEPLOY_REVIEW_IID'), [
    ...publicCertificates,
    ...unrelatedCertificates,
  ]);
});

test('final teardown removes its public certificates and preserves other environments', () => {
  assert.deepEqual(runCleanup('PURGE_REVIEW_IID'), unrelatedCertificates);
});
