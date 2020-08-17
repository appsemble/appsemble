import mermaid from 'mermaid';
import React, { ReactElement, useEffect, useRef } from 'react';

mermaid.initialize({
  securityLevel: 'loose',
});

interface MermaidProps {
  /**
   * The mermaid diagram to render.
   */
  graph: string;
}

/**
 * Render a [mermaid](https://mermaid-js.github.io/) diagram.
 */
export function Mermaid({ graph }: MermaidProps): ReactElement {
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    mermaid.render('mermaid-renderer', graph, (svg) => {
      ref.current.innerHTML = svg;
    });
  }, [graph]);

  return <div ref={ref} />;
}
