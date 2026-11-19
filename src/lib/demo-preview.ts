import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTina } from 'tinacms/dist/react';
import { pageQuery, renderDemo, type DemoPage } from './demo-pages';
export function mountDemoPreview() {
  const root = document.querySelector<HTMLElement>('#cubano-demo-content');
  const script = document.querySelector('#cubano-tina-preview');
  if (!root || !script?.textContent) return;
  const {template,relativePath,page} = JSON.parse(script.textContent) as {template:string;relativePath:string;page:DemoPage};
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  function TinaPage() {
    const {data} = useTina({query:pageQuery,variables:{relativePath},data:{page}});
    useEffect(() => {
      if (!data.page) return;
      root!.innerHTML = renderDemo(template,data.page);
      document.title = data.page.title;
      document.querySelector('meta[name="description"]')?.setAttribute('content',data.page.description);
    },[data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaPage));
}
