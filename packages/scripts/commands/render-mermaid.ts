import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { AppsembleError, logger, opendirSafe } from '@appsemble/node-utils';
import { hashMermaidDiagram, mermaidAssetsDir } from '@appsemble/webpack-core/mermaid';
import { type Code, type Root } from 'mdast';
import { createMermaidRenderer } from 'mermaid-isomorphic';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { type Argv } from 'yargs';

export const command = 'render-mermaid';
export const description = 'Pre-render Mermaid diagrams in the docs to committed SVGs';

export function builder(argv: Argv): Argv<any> {
  return argv;
}

/**
 * The documentation roots whose Mermaid blocks are pre-rendered.
 *
 * These are the only Markdown trees the studio serves through the MDX webpack pipeline.
 */
const docsRoots = ['packages/studio/pages/docs', 'trainings'];

interface Diagram {
  hash: string;
  diagram: string;
  location: string;
}

async function collectDiagrams(): Promise<Diagram[]> {
  const processor = unified().use(remarkParse);
  const diagrams: Diagram[] = [];
  const seen = new Set<string>();

  for (const root of docsRoots) {
    await opendirSafe(
      join(process.cwd(), root),
      async (path, stats) => {
        if (!stats.isFile() || !/\.mdx?$/.test(path)) {
          return;
        }
        const file = await readFile(path, 'utf8');
        const ast = processor.parse(file) as Root;
        visit(ast, 'code', (node: Code) => {
          if (node.lang !== 'mermaid') {
            return;
          }
          const hash = hashMermaidDiagram(node.value);
          const location = `${basename(path)}:${node.position?.start.line ?? '?'}`;
          if (seen.has(hash)) {
            return;
          }
          seen.add(hash);
          diagrams.push({ hash, diagram: node.value, location });
        });
      },
      { recursive: true },
    );
  }

  return diagrams;
}

export async function handler(): Promise<void> {
  const diagrams = await collectDiagrams();
  logger.info(`Found ${diagrams.length} unique Mermaid diagram(s)`);

  await mkdir(mermaidAssetsDir, { recursive: true });

  const render = createMermaidRenderer();
  const expected = new Set<string>();

  for (const { diagram, hash, location } of diagrams) {
    // Render each diagram on its own so the in-SVG element ids are deterministic (`mermaid-0`),
    // matching the `inline-svg` output `rehype-mermaid` produces at build time.
    const [result] = await render([diagram]);
    if (result.status === 'rejected') {
      throw new AppsembleError(`Failed to render Mermaid diagram in ${location}: ${result.reason}`);
    }
    const filename = `${hash}.svg`;
    expected.add(filename);
    await writeFile(join(mermaidAssetsDir, filename), result.value.svg);
    logger.info(`Rendered ${location} → ${filename}`);
  }

  // Prune SVGs that no longer correspond to a diagram so removals are caught by the CI diff check.
  for (const file of await readdir(mermaidAssetsDir)) {
    if (file.endsWith('.svg') && !expected.has(file)) {
      await rm(join(mermaidAssetsDir, file));
      logger.warn(`Removed stale SVG ${file}`);
    }
  }
}
