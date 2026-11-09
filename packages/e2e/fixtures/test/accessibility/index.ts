import { appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { test as base } from '@playwright/test';

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

type ImpactValue = NonNullable<AxeViolation['impact']>;

type FailingRule = Omit<AxeViolation, 'nodes'> & {
  nodes: (AxeViolation['nodes'][number] & { component: string })[];
};

export interface AccessibilityViolation {
  /**
   * The ID of the failing axe-core rule.
   */
  id: string;

  /**
   * How severely the violation affects users.
   */
  impact: ImpactValue | undefined;

  /**
   * A short description of the rule.
   */
  help: string;

  /**
   * A link to the documentation of the rule.
   */
  helpUrl: string;

  /**
   * The number of elements on the page that fail the rule.
   */
  nodes: number;
}

export interface PageAccessibilityReport {
  /**
   * The URL of the scanned page.
   */
  url: string;

  /**
   * The accessibility score of the page, from 0 to 100.
   */
  score: number;

  /**
   * The WCAG rules the page fails.
   */
  violations: AccessibilityViolation[];
}

export interface AppAccessibilityReport {
  /**
   * The average score of the scanned pages, from 0 to 100.
   */
  score: number;

  /**
   * The reports of the scanned pages, lowest score first.
   */
  pages: PageAccessibilityReport[];
}

export interface AccessibilityFixtures {
  /**
   * Crawl the app that is open in the page and score the accessibility of every page.
   *
   * Starting at the current page, the crawl follows links to other pages of the same app. Paths
   * that only differ in numeric or UUID segments, such as resource detail pages, are scanned once.
   * A link that redirects to a page that is already scanned is not scanned again.
   *
   * Each page is checked against WCAG 2.2 level A and AA using axe-core. A page scores 100 minus a
   * penalty per failing rule, regardless of how many elements fail it: 10 for critical, 7 for
   * serious, 3 for moderate and 1 for minor violations, with a minimum of 0.
   *
   * The report is attached to the test as `accessibility.json`. It is also attached as
   * `accessibility.html`, a self-contained page that lists the failing elements of each rule with
   * their block, selector, markup and how to fix them. The block is named with its path in the app
   * definition, elements outside blocks belong to the app shell. The app score is added as the
   * `accessibility score` annotation, which the JUnit reporter writes as a test case property. The
   * score is also written as the metric `accessibility_<name>` to `accessibility-metrics.txt` in
   * the output directory of the project, in the format of a GitLab metrics report. The failing
   * elements are written to `gl-accessibility-<name>.json` in the output directory of the project,
   * in the Pa11y format of a GitLab accessibility report. GitLab compares these elements with the
   * report of the target branch, so IDs in their selector and markup, which differ between
   * pipelines, are masked.
   *
   * @param options Options for the crawl. `name` identifies the app in the metrics report.
   *   `maxPages` limits the number of scanned pages, 50 by default.
   * @returns The accessibility report of the app.
   */
  scanAppAccessibility: (options: {
    name: string;
    maxPages?: number;
  }) => Promise<AppAccessibilityReport>;
}

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const penalties: Record<ImpactValue, number> = {
  critical: 10,
  serious: 7,
  moderate: 3,
  minor: 1,
};

const dynamicSegment = /\/(?:\d+|[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})(?=[^\w-]|$)/gi;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function maskIds(value: string): string {
  return value.replaceAll(dynamicSegment, '/:id');
}

export const test = base.extend<AccessibilityFixtures>({
  async scanAppAccessibility({ page }, use, testInfo) {
    await use(async ({ maxPages = 50, name }) => {
      const { origin } = new URL(page.url());
      const queue = [page.url()];
      const seen = new Set(queue.map((url) => maskIds(new URL(url).pathname)));
      const scanned = new Set<string>();
      const pages: PageAccessibilityReport[] = [];
      const failingRules = new Map<PageAccessibilityReport, FailingRule[]>();

      while (queue.length && pages.length < maxPages) {
        await page.goto(queue.shift()!);
        await page.waitForLoadState('networkidle');
        const url = page.url();
        const pattern = maskIds(new URL(url).pathname);
        if (scanned.has(pattern)) {
          continue;
        }
        scanned.add(pattern);

        const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        const components = await page.evaluate(
          (targets) =>
            targets.map((paths) =>
              paths.map((path) => {
                let root: Document | ShadowRoot | null | undefined = document;
                let element: Element | null | undefined;
                for (const selector of path) {
                  element = root?.querySelector(selector);
                  root = element?.shadowRoot;
                }
                while (element) {
                  const block = element.closest<HTMLElement>('[data-block]');
                  if (block) {
                    const blockName = block.dataset.block!;
                    const [scope, directory] = blockName.split('/');
                    return scope === '@appsemble'
                      ? `${blockName} (blocks/${directory}) at ${block.dataset.path}`
                      : `${blockName} at ${block.dataset.path}`;
                  }
                  element = (element.getRootNode() as ShadowRoot).host;
                }
                return 'app shell (packages/app)';
              }),
            ),
          violations.map(({ nodes }) => nodes.map(({ target }) => target.flat() as string[])),
        );
        const pageReport = {
          url,
          score: Math.max(
            0,
            100 - violations.reduce((sum, { impact }) => sum + (impact ? penalties[impact] : 0), 0),
          ),
          violations: violations.map(({ help, helpUrl, id, impact, nodes }) => ({
            id,
            impact: impact ?? undefined,
            help,
            helpUrl,
            nodes: nodes.length,
          })),
        };
        pages.push(pageReport);
        failingRules.set(
          pageReport,
          violations.map((violation, index) => ({
            ...violation,
            nodes: violation.nodes.map((node, nodeIndex) => ({
              ...node,
              component: components[index][nodeIndex],
            })),
          })),
        );

        const hrefs = await page
          .locator('a[href]')
          .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
        for (const href of hrefs) {
          const link = new URL(href);
          link.hash = '';
          link.search = '';
          const linkPattern = maskIds(link.pathname);
          if (link.origin === origin && !seen.has(linkPattern)) {
            seen.add(linkPattern);
            queue.push(String(link));
          }
        }
      }

      pages.sort((a, b) => a.score - b.score);
      const report = {
        score: Math.round(pages.reduce((sum, { score }) => sum + score, 0) / pages.length),
        pages,
      };
      const reportPath = testInfo.outputPath('accessibility.json');
      await writeFile(reportPath, JSON.stringify(report, null, 2));
      await testInfo.attach('accessibility.json', {
        path: reportPath,
        contentType: 'application/json',
      });

      const sections = pages.map((pageReport, index) => {
        const { score, url } = pageReport;
        const rules = failingRules.get(pageReport)!.map(
          ({ help, helpUrl, id, impact, nodes }) => `
    <details>
      <summary>${escapeHtml(`${impact ?? 'unknown'}: ${help} (${id}, failing elements: ${nodes.length})`)}</summary>
      <p><a href="${escapeHtml(helpUrl)}">How to fix ${escapeHtml(id)}</a></p>
      <ol>${nodes
        .map(
          ({ component, failureSummary, html, target }) => `
        <li>
          <p>${escapeHtml(component)}</p>
          <code>${escapeHtml(target.flat().join(' >>> '))}</code>
          <pre>${escapeHtml(html)}</pre>
          <pre>${escapeHtml(failureSummary ?? '')}</pre>
        </li>`,
        )
        .join('')}
      </ol>
    </details>`,
        );
        return `
  <section aria-labelledby="page-${index}">
    <h2 id="page-${index}"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></h2>
    <p>Score: ${score}</p>${rules.length ? rules.join('') : '\n    <p>No WCAG violations found.</p>'}
  </section>`;
      });
      const htmlPath = testInfo.outputPath('accessibility.html');
      await writeFile(
        htmlPath,
        `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(`Accessibility report: ${name}`)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 80rem; padding: 0 1rem; }
    summary { cursor: pointer; }
    pre { background: #f5f5f5; overflow-x: auto; padding: 0.5rem; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(`Accessibility report: ${name}`)}</h1>
  <p>Score: ${report.score}, the average of ${pages.length} pages checked against WCAG 2.2 A and AA.</p>${sections.join('')}
</body>
</html>
`,
      );
      await testInfo.attach('accessibility.html', { path: htmlPath, contentType: 'text/html' });
      testInfo.annotations.push({ type: 'accessibility score', description: String(report.score) });
      await appendFile(
        join(testInfo.project.outputDir, 'accessibility-metrics.txt'),
        `accessibility_${name} ${report.score}\n`,
      );
      await writeFile(
        join(testInfo.project.outputDir, `gl-accessibility-${name}.json`),
        JSON.stringify({
          results: Object.fromEntries(
            pages.map((pageReport) => [
              pageReport.url,
              failingRules
                .get(pageReport)!
                .flatMap(({ description, help, helpUrl, id, impact, nodes }) =>
                  nodes.map(({ component, html, target }) => ({
                    code: id,
                    type: 'error',
                    typeCode: 1,
                    message: `${help}: ${component}`,
                    context: maskIds(html),
                    selector: maskIds(target.flat().join(' >>> ')),
                    runner: 'axe',
                    runnerExtras: { description, impact, help, helpUrl },
                  })),
                ),
            ]),
          ),
        }),
      );

      return report;
    });
  },
});
