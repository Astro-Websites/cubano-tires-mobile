import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTina } from 'tinacms/dist/react';
import { addImageEditStyles } from './preview-styles';
import { fillTokens, galleryQuery, pageQuery, renderDemo, type DemoPage, type Globals } from './demo-pages';

// Live preview inside the Tina editor: re-render the design from the form values and
// tag every text and image with data-tina-field so clicking it opens that field.
export function mountDemoPreview() {
  const root = document.querySelector<HTMLElement>('#cubano-demo-content');
  const script = document.querySelector('#cubano-tina-preview');
  if (!root || !script?.textContent) return;
  const { template, collection = 'page', relativePath, page, globals } = JSON.parse(script.textContent) as { template: string; collection?: 'page' | 'gallery'; relativePath: string; page: DemoPage; globals?: Globals };
  const query = collection === 'gallery' ? galleryQuery : pageQuery;
  addImageEditStyles();
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  // Stable references: useTina re-processes (and re-announces itself to the admin) whenever
  // these change, so creating them per render caused an endless re-render loop.
  const initialData = { [collection]: page };
  const variables = { relativePath };
  function TinaPage() {
    const { data } = useTina({ query, variables, data: initialData });
    const current = (data as Record<string, DemoPage | undefined>)[collection];
    useEffect(() => {
      if (!current) return;
      // Keep third-party widgets (the TIRESanytime shop search) alive across re-renders.
      const widget = root!.querySelector('#ta-widget-container');
      root!.innerHTML = renderDemo(template, current, { preview: true, globals });
      const fresh = root!.querySelector('#ta-widget-container');
      if (widget && fresh) fresh.replaceWith(widget);
      document.title = String(fillTokens(current.seoTitle || current.title, globals));
      document.querySelector('meta[name="description"]')?.setAttribute('content', String(fillTokens(current.description ?? '', globals)));
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaPage));
}
