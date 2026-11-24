import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { tinaField, useTina } from 'tinacms/dist/react';

// Blog copy that lives in Global Config > Blog Archive (archive heading, bottom call to action,
// post sidebar). In the Tina editor this keeps it live and click-to-edit on every blog page.
const query = `query CubanoBlogCopy {
  globalConfig(relativePath: "config.json") { blog { eyebrow heading intro ctaHeading ctaText ctaButton sidebarHeading sidebarText sidebarButton } }
}`;

export function mountBlogCopyPreview() {
  const nodes = [...document.querySelectorAll<HTMLElement>('[data-global-field]')];
  if (!nodes.length) return;
  const mount = document.createElement('div');
  mount.hidden = true;
  document.body.append(mount);
  const initialData = { globalConfig: null };
  const variables = {};
  function TinaBlogCopy() {
    const { data } = useTina<{ globalConfig: { blog?: Record<string, string> } | null }>({ query, variables, data: initialData });
    useEffect(() => {
      const blog = data?.globalConfig?.blog;
      if (!blog) return;
      for (const node of nodes) {
        const name = node.dataset.globalField!;
        node.textContent = blog[name] || '';
        node.setAttribute('data-tina-field', tinaField(blog as any, name as any));
      }
    }, [data]);
    return null;
  }
  createRoot(mount).render(createElement(TinaBlogCopy));
}
