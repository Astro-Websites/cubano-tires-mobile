import { createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';

const blogQuery = `query CubanoBlog($relativePath: String!) {
  blog(relativePath: $relativePath) { __typename _sys { filename relativePath } title seoTitle description quickAnswer body }
}`;

type BlogPreview = { title?: string; seoTitle?: string; description?: string; quickAnswer?: string; body?: any };

export function mountBlogPreview() {
  const script = document.querySelector('#cubano-blog-preview');
  if (!script?.textContent) return;
  const { relativePath } = JSON.parse(script.textContent) as { relativePath?: string };
  if (!relativePath) return;
  const field = (name: string) => document.querySelector<HTMLElement>(`[data-blog-field="${name}"]`);
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  let bodyRoot: Root | undefined;

  function TinaBlog() {
    const { data } = useTina<{ blog: BlogPreview | null }>({ query: blogQuery, variables: { relativePath }, data: { blog: null } });
    useEffect(() => {
      const blog = data?.blog;
      if (!blog) return;
      const title = field('title');
      if (title && blog.title) title.textContent = blog.title;
      const quick = field('quickAnswer');
      if (quick) quick.textContent = blog.quickAnswer || '';
      const body = field('body');
      if (body && blog.body) {
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
