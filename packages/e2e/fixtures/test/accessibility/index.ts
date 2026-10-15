import { AxeBuilder } from '@axe-core/playwright';
import { test as base } from '@playwright/test';

type ImpactValue = NonNullable<
  Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]['impact']
>;

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
   *
   * Each page is checked against WCAG 2.2 level A and AA using axe-core. A page scores 100 minus a
   * penalty per failing rule, regardless of how many elements fail it: 10 for critical, 7 for
   * serious, 3 for moderate and 1 for minor violations, with a minimum of 0.
   *
   * The report is attached to the test as `accessibility.json`.
   *
   * @param options Options for the crawl. `maxPages` limits the number of scanned pages, 50 by
   *   default.
   * @returns The accessibility report of the app.
   */
  scanAppAccessibility: (options?: { maxPages?: number }) => Promise<AppAccessibilityReport>;
}

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const penalties: Record<ImpactValue, number> = {
  critical: 10,
  serious: 7,
  moderate: 3,
  minor: 1,
};

const dynamicSegment = /^(\d+|[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})$/i;

function getRoutePattern(url: URL): string {
  return url.pathname
    .split('/')
    .map((segment) => (dynamicSegment.test(segment) ? ':id' : segment))
    .join('/');
}

export const test = base.extend<AccessibilityFixtures>({
  async scanAppAccessibility({ page }, use, testInfo) {
    await use(async ({ maxPages = 50 } = {}) => {
      const { origin } = new URL(page.url());
      const queue = [page.url()];
      const seen = new Set(queue.map((url) => getRoutePattern(new URL(url))));
      const pages: PageAccessibilityReport[] = [];

      while (queue.length && pages.length < maxPages) {
        const url = queue.shift()!;
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        pages.push({
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
        });

        const hrefs = await page
          .locator('a[href]')
          .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
        for (const href of hrefs) {
          const link = new URL(href);
          link.hash = '';
          link.search = '';
          const pattern = getRoutePattern(link);
          if (link.origin === origin && !seen.has(pattern)) {
            seen.add(pattern);
            queue.push(String(link));
          }
        }
      }

      pages.sort((a, b) => a.score - b.score);
      const report = {
        score: Math.round(pages.reduce((sum, { score }) => sum + score, 0) / pages.length),
        pages,
      };
      await testInfo.attach('accessibility.json', {
        body: JSON.stringify(report, null, 2),
        contentType: 'application/json',
      });

      return report;
    });
  },
});
