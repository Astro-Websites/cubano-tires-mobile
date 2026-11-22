"""Give every text/link/image slot of a designed page a 'role' (Heading, Eyebrow,
Button text, Paragraph...) derived from the design, so the Tina sidebar lists
"Heading: We bring the tire shop..." instead of a bare list of strings.
Safe to rerun after content or template changes."""
import re
from bs4 import BeautifulSoup, NavigableString
from designed_pages import SLOT, load_all, save

def role_for_text(node):
    el = node.parent
    for anc in [el, *el.parents]:
        if anc.name == 'nav' and 'readcrumb' in (anc.get('aria-label') or ''): return 'Breadcrumb'
    for anc in [el, *el.parents]:
        if anc.name == 'a': return 'Button or link text'
        if anc.name == 'summary': return 'Question'
        if anc.name == 'figcaption': return 'Caption'
        if anc.name in ('h1',): return 'Main heading'
        if anc.name in ('h2',): return 'Heading'
        if anc.name in ('h3', 'h4'): return 'Subheading'
        if anc.name == 'li': return 'List item'
        if anc.name == 'blockquote': return 'Quote'
        if anc.name in ('p', 'span', 'strong'):
            style = (anc.get('style') or '').replace(' ', '')
            if 'letter-spacing' in style: return 'Eyebrow'
            if 'border-radius:999px' in style: return 'Badge'
            if anc.name == 'p': return 'Paragraph'
            if 'font-weight:800' in style or 'font-weight:900' in style or anc.name == 'strong': return 'Bold text'
            continue
    return 'Text'

for page in load_all():
    doc = BeautifulSoup(page['html'], 'html.parser')
    roles = {}
    for node in doc.find_all(string=True):
        for m in SLOT.finditer(str(node)):
            if m[2] == 'copy': roles[(int(m[1]), 'copy', int(m[3]))] = role_for_text(node)
    for el in doc.find_all('a'):
        m = SLOT.search(el.get('href', ''))
        if m:
            heading = 'Button' if 'border-radius: 999px' in (el.get('style') or '') else 'Link'
            roles[(int(m[1]), 'links', int(m[3]))] = heading
    for el in doc.find_all(True):
        for attr in ('src', 'style'):
            m = SLOT.search(el.get(attr) or '')
            if m and m[2] == 'images': roles[(int(m[1]), 'images', int(m[3]))] = 'Background image' if attr == 'style' else ('Logo' if 'height: 2' in (el.get('style') or '') else 'Image')
    for s, section in enumerate(page['data']['demoSections']):
        for kind in ('copy', 'links', 'images'):
            for i, item in enumerate(section.get(kind) or []):
                role = roles.get((s, kind, i))
                if role:
                    item.pop('role', None)
                    section[kind][i] = {'role': role, **item}
    save(page)
    print(page['md'].stem, len(roles))
