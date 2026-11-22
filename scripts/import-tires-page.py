"""One-off: move the hardcoded /tires/ shop page into a designed page
(src/fragments/demo-pages/tires.html + src/content/page/tires.md). Reads the built
dist/tires/index.html, so run `npm run build:site` on the old page first."""
from pathlib import Path
from bs4 import BeautifulSoup
import yaml
root = Path(__file__).resolve().parents[1]
doc = BeautifulSoup((root / 'dist/tires/index.html').read_text(), 'html.parser')
sections, data = [], []
for i, node in enumerate(doc.find('main').find_all('section', recursive=False)):
    heading = node.find(['h1', 'h2'])
    values = {'label': heading.get_text(' ', strip=True) if heading else f'Section {i+1}', 'copy': [], 'links': [], 'images': []}
    for t in [node, *node.find_all()]:
        for attr in [a for a in t.attrs if a.startswith('data-astro')]: del t[attr]
        if t.name == 'a':
            k = len(values['links']); values['links'].append({'url': t['href'], 'label': t.get_text(' ', strip=True)}); t['href'] = f'@@{i}:links:{k}:url@@'
    for text in list(node.find_all(string=True)):
        raw = str(text); s = raw.strip()
        if not s or s == '›' or text.__class__.__name__ == 'Comment': continue
        k = len(values['copy']); values['copy'].append({'text': s}); text.replace_with(raw.replace(s, f'@@{i}:copy:{k}:text@@', 1))
    sections.append(str(node)); data.append(values)
(root / 'src/fragments/demo-pages/tires.html').write_text('\n'.join(sections) + '\n')
page = {'title': 'Shop Tires', 'seoTitle': doc.title.get_text(), 'description': doc.find('meta', attrs={'name': 'description'})['content'], 'demoSections': data, 'demoTemplate': 'tires'}
(root / 'src/content/page/tires.md').write_text('---\n' + yaml.safe_dump(page, allow_unicode=True, sort_keys=False, width=1000) + '---\n')
