import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTina } from 'tinacms/dist/react';
import { addImageEditStyles } from './preview-styles';
import { pageQuery, renderDemo, type DemoPage, type Globals } from './demo-pages';

// Live preview inside the Tina editor: re-render the design from the form values and
// tag every text and image with data-tina-field so clicking it opens that field.
export function mountDemoPreview() {
  const root = document.querySelector<HTMLElement>('#cubano-demo-content');
  const script = document.querySelector('#cubano-tina-preview');
  if (!root || !script?.textContent) return;
  const { template, relativePath, page, globals } = JSON.parse(script.textContent) as { template: string; relativePath: string; page: DemoPage; globals?: Globals };
  addImageEditStyles();
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  // Stable references: useTina re-processes (and re-announces itself to the admin) whenever
  // these change, so creating them per render caused an endless re-render loop.
  const initialData = { page };
  const variables = { relativePath };
  function TinaPage() {
    const { data } = useTina({ query: pageQuery, variables, data: initialData });
    useEffect(() => {
      if (!data.page) return;
      // Keep third-party widgets (the TIRESanytime shop search) alive across re-renders.
      const widget = root!.querySelector('#ta-widget-container');
      root!.innerHTML = renderDemo(template, data.page, { preview: true, globals });
      const fresh = root!.querySelector('#ta-widget-container');
      if (widget && fresh) fresh.replaceWith(widget);
      document.title = data.page.seoTitle || data.page.title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', data.page.description);
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaPage));
}
