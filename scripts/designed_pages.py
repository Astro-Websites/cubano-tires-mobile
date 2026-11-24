"""Helpers for one-off edits to designed-page templates and their Tina content.
A designed page is src/fragments/demo-pages/<template>.html (markup with
@@section:list:index:field@@ slots) plus src/content/<collection>/**.md (the values)."""
import glob, html, re
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
SLOT = re.compile(r'@@(\d+):(copy|links|images):(\d+):(\w+)@@')

def load_all():
    pages = []
    files = [f for c in ('page', 'areas', 'services', 'tires', 'vehicles', 'gallery') for f in glob.glob(str(ROOT / f'src/content/{c}/**/*.md'), recursive=True)]
    for f in sorted(files):
        text = Path(f).read_text()
        _, front, body = text.split('---', 2)
        data = yaml.safe_load(front)
        if not data.get('demoTemplate'): continue
        tpl = ROOT / f"src/fragments/demo-pages/{data['demoTemplate']}.html"
        pages.append({'md': Path(f), 'body': body, 'data': data, 'tpl': tpl, 'html': tpl.read_text()})
    return pages

def save(page):
    page['md'].write_text('---\n' + yaml.safe_dump(page['data'], allow_unicode=True, sort_keys=False, width=1000) + '---' + page['body'])
    page['tpl'].write_text(page['html'])

def remove_items(page, section, kind, indices):
    """Drop list items and renumber the slots that point past them."""
    indices = sorted(set(indices))
    items = page['data']['demoSections'][section][kind]
    for i in reversed(indices): del items[i]
    def renumber(m):
        s, k, i, f = int(m[1]), m[2], int(m[3]), m[4]
        if s != section or k != kind: return m[0]
        assert i not in indices, m[0]
        return f'@@{s}:{k}:{i - sum(1 for x in indices if x < i)}:{f}@@'
    page['html'] = SLOT.sub(renumber, page['html'])

def inline_copy(page, section, index):
    """Bake a copy item into the template as fixed text."""
    value = page['data']['demoSections'][section]['copy'][index]['text']
    slot = f'@@{section}:copy:{index}:text@@'
    assert page['html'].count(slot) == 1, slot
    page['html'] = page['html'].replace(slot, html.escape(value, quote=True))
    remove_items(page, section, 'copy', [index])
