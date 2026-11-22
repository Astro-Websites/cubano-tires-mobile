"""One-off: turn the hardcoded homepage body (src/fragments/body.html) into an
editable designed-page template plus Tina content, the same way the other
designed pages work. Inline base64 images are written to public/uploads/home/.
Requires beautifulsoup4 and PyYAML. Already run: body.html was removed after the import."""
import base64, hashlib, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, Comment, NavigableString
import yaml

root = Path(__file__).resolve().parents[1]
source = (root / 'src/fragments/body.html').read_text()
assets = root / 'public/uploads/home'; assets.mkdir(parents=True, exist_ok=True)
doc = BeautifulSoup(source, 'html.parser')
seen = {}

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:60] or 'image'

def save_image(uri, alt):
    head, data = uri.split(',', 1)
    ext = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg'}[head[5:].split(';')[0]]
    raw = base64.b64decode(data)
    digest = hashlib.sha256(raw).hexdigest()
    if digest in seen: return seen[digest]
    name = slug(alt); path = assets / f'{name}.{ext}'; n = 2
    while path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        path = assets / f'{name}-{n}.{ext}'; n += 1
    path.write_bytes(raw)
    seen[digest] = f'/uploads/home/{path.name}'
    return seen[digest]

link_fixes = {'#shop': '/tires/', '#coupons': '/coupons/'}
sections, data = [], []
label = None
for node in doc.contents:
    if isinstance(node, Comment):
        label = node.strip(); continue
    if getattr(node, 'name', None) != 'section': continue
    i = len(sections)
    heading = node.find(['h1', 'h2', 'h3'])
    values = {'label': label or (heading.get_text(' ', strip=True) if heading else f'Section {i+1}'), 'copy': [], 'links': [], 'images': []}
    label = None
    for c in node.find_all(string=lambda t: isinstance(t, Comment)): c.extract()
    for t in [node, *node.find_all()]:
        if t.name == 'a' and t.has_attr('href'):
            href = link_fixes.get(t['href'], t['href'])
            assert href.startswith(('/', '#', 'https://', 'tel:', 'sms:')), href
            k = len(values['links']); values['links'].append({'url': href, 'label': t.get_text(' ', strip=True) or t.get('aria-label') or 'Link'})
            t['href'] = f'@@{i}:links:{k}:url@@'
        style = t.get('style', '')
        bg = re.search(r'url\((data:[^)]+)\)', style)
        if bg:
            k = len(values['images']); alt = t.get('aria-label') or f"{values['label']} background"
            values['images'].append({'source': save_image(bg.group(1), alt), 'alt': alt})
            t['style'] = style.replace(bg.group(0), f'url(@@{i}:images:{k}:source@@)')
        if t.name == 'img':
            src = t['src']
            if src.startswith('data:'): src = save_image(src, t.get('alt') or values['label'])
            k = len(values['images']); values['images'].append({'source': src, 'alt': t.get('alt', '')})
            t['src'] = f'@@{i}:images:{k}:source@@'; t['alt'] = f'@@{i}:images:{k}:alt@@'
    for text in list(node.find_all(string=True)):
        if isinstance(text, Comment): continue
        raw = str(text); stripped = raw.strip()
        if not stripped: continue
        k = len(values['copy']); values['copy'].append({'text': stripped})
        text.replace_with(raw.replace(stripped, f'@@{i}:copy:{k}:text@@', 1))
    sections.append(str(node)); data.append(values)

(root / 'src/fragments/demo-pages/homepage.html').write_text('\n'.join(sections) + '\n')
md = root / 'src/content/page/homepage.md'
front = yaml.safe_load(md.read_text().split('---')[1])
out = {'title': front['title'], 'description': front['description'], 'demoSections': data, 'demoTemplate': 'homepage'}
md.write_text('---\n' + yaml.safe_dump(out, allow_unicode=True, sort_keys=False, width=1000) + '---\n')
print(len(sections), 'sections,', len(seen), 'images extracted')
