import { createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { tinaField, useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { addImageEditStyles } from './preview-styles';

const blogQuery = `query CubanoBlog($relativePath: String!) {
  blog(relativePath: $relativePath) { __typename _sys { filename relativePath } title seoTitle description quickAnswer heroImage heroImageAlt
    faqs { question answer } relatedService { label url } body }
}`;

type Faq = { question?: string; answer?: string };
type BlogPreview = { title?: string; seoTitle?: string; description?: string; quickAnswer?: string; heroImage?: string; heroImageAlt?: string; faqs?: Faq[]; relatedService?: { label?: string; url?: string }; body?: any };

// Live preview for blog posts inside the Tina editor: updates the text as you type and tags every
// part of the post with data-tina-field, so clicking it in the preview opens that field.
export function mountBlogPreview() {
  const script = document.querySelector('#cubano-blog-preview');
  if (!script?.textContent) return;
  const { relativePath } = JSON.parse(script.textContent) as { relativePath?: string };
  if (!relativePath) return;
  const all = (name: string) => [...document.querySelectorAll<HTMLElement>(`[data-blog-field="${name}"]`)];
  const field = (name: string) => all(name)[0];
  addImageEditStyles();
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  let bodyRoot: Root | undefined;

  const initialData = { blog: null };
  const variables = { relativePath };
  function TinaBlog() {
    const { data } = useTina<{ blog: BlogPreview | null }>({ query: blogQuery, variables, data: initialData });
    useEffect(() => {
      const blog = data?.blog;
      if (!blog) return;
      const tag = (node: HTMLElement | undefined, name: string, text?: string) => {
        if (!node) return;
        node.setAttribute('data-tina-field', tinaField(blog as any, name as any));
        if (text !== undefined) node.textContent = text;
      };
      tag(field('title'), 'title', blog.title || '');
      tag(field('quickAnswer'), 'quickAnswer', blog.quickAnswer || '');
      for (const node of all('category')) tag(node, 'categories');
      for (const node of all('author')) tag(node, 'author');
      tag(field('date'), 'pubDate');
      const hero = field('heroImage') as HTMLImageElement | undefined;
      if (hero) {
        tag(hero, 'heroImage');
        if (blog.heroImage) hero.src = blog.heroImage;
        hero.alt = blog.heroImageAlt || blog.title || '';
      }
      all('faq').forEach((node, index) => {
        const faq = blog.faqs?.[index];
        if (!faq) return;
        const question = node.querySelector<HTMLElement>('summary');
        const answer = node.querySelector<HTMLElement>('p');
        if (question) { question.textContent = faq.question || ''; question.setAttribute('data-tina-field', tinaField(faq as any, 'question' as any)); }
        if (answer) { answer.textContent = faq.answer || ''; answer.setAttribute('data-tina-field', tinaField(faq as any, 'answer' as any)); }
      });
      const service = field('relatedService');
      if (service && blog.relatedService) {
        service.setAttribute('data-tina-field', tinaField(blog.relatedService as any, 'label' as any));
        const label = service.querySelector<HTMLElement>('[data-blog-label]');
        if (label) label.textContent = blog.relatedService.label || '';
      }
      const body = field('body');
      if (body && blog.body) {
        body.setAttribute('data-tina-field', tinaField(blog as any, 'body' as any));
        bodyRoot ??= createRoot(body);
        bodyRoot.render(createElement(TinaMarkdown, { content: blog.body }));
      }
      document.title = blog.seoTitle || blog.title || document.title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', blog.description || '');
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaBlog));
}
