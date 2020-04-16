import { logger } from '@appsemble/node-utils';
import { launch, LaunchedChrome } from 'chrome-launcher';
import { outputFile, readdir } from 'fs-extra';
import lighthouse from 'lighthouse';
import { executablePath } from 'puppeteer';
import type { Argv } from 'yargs';

export const command = 'lighthouse';
export const description = 'Test apps in the staging environment using lighthouse.';

interface Args {
  headless: boolean;
}

const baselines = {
  accessibility: 80,
  'best-practices': 70,
  performance: 30,
  pwa: 80,
  seo: 80,
};

export function builder(yargs: Argv): Argv {
  return yargs.option('headless', {
    description: 'Run Chrome in headless mode. This can be disabled for debugging purposes.',
    default: true,
  });
}

export async function handler({ headless }: Args): Promise<void> {
  let chrome: LaunchedChrome;
  try {
    chrome = await launch({
      chromePath: executablePath(),
      chromeFlags: headless ? ['--headless'] : [],
    });

    const metrics: string[] = [];
    for (const app of await readdir('apps')) {
      const url = `https://${app}.appsemble.staging.appsemble.review`;
      logger.info(`Testing ${url}`);
      const { lhr, report } = await lighthouse(url, {
        port: chrome.port,
        output: 'html',
        logLevel: 'info',
      });
      await outputFile(`reports/${app}.html`, report);

      // Taken from https://github.com/pkesc/prometheus_lighthouse_exporter/blob/master/lighthouse_exporter.js
      metrics.push(`# HELP lighthouse_${app} The Lighthouse scores for ${url}`);
      metrics.push(`# TYPE lighthouse_${app} gauge`);
      logger.info(`Scores for ${url}`);
      logger.info('┌────────────────┬──────────┬───────┐');
      logger.info('│ Category       │ Baseline │ Score │');
      logger.info('├────────────────┼──────────┼───────┤');
      Object.entries(baselines).forEach(([category, baseline]) => {
        const score = lhr.categories[category].score * 100;
        metrics.push(`lighthouse_${app}{category="${category}"} ${score}`);
        const message = `│ ${category.padEnd(14)} │ ${String(baseline).padStart(8)} │ ${String(
          score,
        ).padStart(5)} │`;
        if (score < baseline) {
          process.exitCode = 1;
          logger.error(message);
        } else {
          logger.info(message);
        }
      });
      metrics.push('');
      logger.info('└────────────────┴──────────┴───────┘\n');
    }
    await outputFile('reports/metrics.txt', metrics.join('\n'));
  } finally {
    await chrome?.kill();
  }
}
