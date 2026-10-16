import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createSettings } from './render.js';

describe('createSettings', () => {
  it('should keep settings containing HTML inside a single script tag', () => {
    const settings = {
      definition: { description: 'Hello </script><script>alert(1)</script> <!-- world' },
    };
    const [, html] = createSettings(settings);

    // Only the real closing tag may exist; an unescaped `</script>` from the settings ends the
    // script early.
    expect(html.match(/<\/script/gi)).toHaveLength(1);
    expect(html).not.toContain('<!--');
    const script = html.slice('<script>'.length, -'</script>'.length);
    expect(JSON.parse(script.slice('window.settings='.length))).toStrictEqual(settings);
  });

  it('should return a CSP digest matching the script content', () => {
    const [digest, html] = createSettings({ a: '</script>' }, undefined, ['console.log(1)']);
    const script = html.slice('<script>'.length, -'</script>'.length);

    expect(script.endsWith(';console.log(1)')).toBe(true);
    expect(digest).toBe(`'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`);
  });
});
