import { createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { tinaField, useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { addImageEditStyles } from './preview-styles';

const query = `query CubanoSimplePage($relativePath: String!) {
  simplePage(relativePath: $relativePath) { __typename _sys { filename relativePath } title seoTitle description heading intro image imageAlt body }
}`;

// Live preview for Simple Pages inside the Tina editor, with click-to-edit.
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
  function TinaSimplePage() {
    const { data } = useTina<{ simplePage: any }>({ query, variables: { relativePath }, data: { simplePage: null } });
    useEffect(() => {
      const page = data?.simplePage;
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
      document.title = page.seoTitle || page.title;
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaSimplePage));
}
