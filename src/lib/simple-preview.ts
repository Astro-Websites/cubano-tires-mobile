import { createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { tinaField, useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { addImageEditStyles } from './preview-styles';

const query = `query CubanoSimplePage($relativePath: String!) {
  page(relativePath: $relativePath) { ... on PageSimple { __typename _sys { filename relativePath } title seoTitle description heading intro image imageAlt body sitemap { sections { key heading description } cta { heading text button { label href newTab } } } } }
}`;

// Live preview for simple pages (Tina: Pages, "Simple page" type) inside the Tina editor, with click-to-edit.
export function mountSimplePreview() {
  const script = document.querySelector('#cubano-simple-preview');
  if (!script?.textContent) return;
  const { relativePath } = JSON.parse(script.textContent) as { relativePath: string };
  const el = (name: string) => document.querySelector<HTMLElement>(`[data-simple-field="${name}"]`);
  addImageEditStyles();
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  let bodyRoot: Root | undefined;
  const initialData = { page: null };
  const variables = { relativePath };
  function TinaSimplePage() {
    const { data } = useTina<{ page: any }>({ query, variables, data: initialData });
    useEffect(() => {
      const page = data?.page;
      if (!page) return;
      const set = (name: string, text: string | undefined, field = name) => {
        const node = el(name);
        if (!node) return;
        node.textContent = text || '';
        node.hidden = !text;
        node.setAttribute('data-tina-field', tinaField(page, field));
      };
      set('title', page.title);
      set('heading', page.heading || page.title, page.heading ? 'heading' : 'title');
      set('intro', page.intro);
      const image = el('image') as HTMLImageElement | null;
      if (image) {
        image.hidden = !page.image;
        if (page.image) image.src = page.image;
        image.alt = page.imageAlt || '';
        image.setAttribute('data-tina-field', tinaField(page, 'image'));
      }
      const body = el('body');
      if (body) {
        body.setAttribute('data-tina-field', tinaField(page, 'body'));
        bodyRoot ??= createRoot(body);
        bodyRoot.render(createElement(TinaMarkdown, { content: page.body }));
      }
      // Sitemap page: group headings, descriptions and the bottom call to action.
      const sitemap = page.sitemap;
      (sitemap?.sections || []).forEach((section: any) => {
        if (!section?.key) return;
        document.querySelectorAll<HTMLElement>(`[data-sitemap-heading="${section.key}"]`).forEach((node) => {
          if (section.heading) node.textContent = section.heading;
          node.setAttribute('data-tina-field', tinaField(section, 'heading'));
        });
        document.querySelectorAll<HTMLElement>(`[data-sitemap-desc="${section.key}"]`).forEach((node) => {
          node.textContent = section.description || '';
          node.hidden = !section.description;
          node.setAttribute('data-tina-field', tinaField(section, 'description'));
        });
      });
      if (sitemap?.cta) {
        const cta = sitemap.cta;
        const ctaNode = (name: string) => document.querySelector<HTMLElement>(`[data-sitemap-cta="${name}"]`);
        for (const name of ['heading', 'text']) {
          const node = ctaNode(name);
          if (!node) continue;
          node.textContent = cta[name] || '';
          node.hidden = !cta[name];
          node.setAttribute('data-tina-field', tinaField(cta, name));
        }
        const button = ctaNode('button') as HTMLAnchorElement | null;
        if (button && cta.button) {
          button.textContent = cta.button.label || '';
          button.hidden = !cta.button.label;
          button.setAttribute('data-tina-field', tinaField(cta.button, 'label'));
        }
      }
      document.title = page.seoTitle || page.title;
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaSimplePage));
}
