"""Make each button/link one Tina item: move the visible text of every <a> whose
text is a single copy slot into its links item (label + url), so editors see
Label and URL together. Safe to rerun."""
import re
from bs4 import BeautifulSoup
from designed_pages import SLOT, load_all, remove_items, save

for page in load_all():
    page['html'] = str(BeautifulSoup(page['html'], 'html.parser'))
    doc = BeautifulSoup(page['html'], 'html.parser')
    moves = []  # (section, link index, copy index)
    for a in doc.find_all('a'):
        m = SLOT.fullmatch(a.get('href') or '')
        if not m or m[2] != 'links': continue
        slots = [x for x in SLOT.finditer(''.join(str(t) for t in a.find_all(string=True))) if x[2] == 'copy']
        if len(slots) != 1 or slots[0][1] != m[1]: continue
        moves.append((int(m[1]), int(m[3]), int(slots[0][3])))
    for s, li, ci in moves:
        section = page['data']['demoSections'][s]
        slot = f'@@{s}:copy:{ci}:text@@'
        assert page['html'].count(slot) == 1, (page['md'], slot)
        page['html'] = page['html'].replace(slot, f'@@{s}:links:{li}:label@@')
        link = section['links'][li]
        role = 'Button' if link.get('role') == 'Button' else 'Link'
        section['links'][li] = {'role': role, 'label': section['copy'][ci]['text'], 'url': link['url']}
    by_section = {}
    for s, li, ci in moves: by_section.setdefault(s, []).append(ci)
    for s, idx in by_section.items(): remove_items(page, s, 'copy', idx)
    save(page)
    print(page['md'].stem, len(moves))
