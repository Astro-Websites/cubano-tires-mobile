"""One-off: turn repeated blocks in designed pages (FAQs, rebates, team, photos,
reviews, steps, links...) into Tina "cards" lists the client can add to,
reorder and remove. Each group becomes <!--repeat:S:type-->item<!--/repeat-->
in the template and demoSections[S].cards entries with _template: type."""
import html, re
from bs4 import BeautifulSoup
from designed_pages import SLOT, load_all, remove_items, save

def norm(s): return SLOT.sub('@@P@@', s).replace(' open=""', '')

def runs(markup):
    doc = BeautifulSoup(markup, 'html.parser')
    for el in doc.find_all():
        kids = [k for k in el.children if getattr(k, 'name', None)]
        cur = []
        for k in kids + [None]:
            if k is not None and cur and norm(str(k)) == norm(str(cur[-1])): cur.append(k); continue
            if len(cur) >= 2: yield cur
            cur = [k] if k is not None else []

def first(value): return str(value).strip()

def classify(page, run, slots):
    tpl = page['data']['demoTemplate']; tag = run[0].name; n = len(run)
    sig = tuple(k for _, k, _, _ in slots); s = int(slots[0][0])
    val = lambda j: first(page['data']['demoSections'][s][slots[j][1]][int(slots[j][2])][slots[j][3]])
    item = str(run[0])
    if tag == 'details' and sig == ('copy', 'copy'): return 'faq', {'copy': ['question', 'answer']}
    if tag == 'article' and tpl == 'coupons': return 'rebate', {'copy': ['brand', 'tag', 'amount', 'details', 'buttonLabel'], 'links': ['buttonUrl']}
    if tpl == 'homepage' and s == 3: return 'service', {'images': [('image', 'imageAlt')], 'copy': ['title', 'text', 'learnMoreLabel', 'callLabel'], 'links': ['learnMoreUrl', 'callUrl']}
    if tpl == 'homepage' and s == 9 and 'images' in sig: return 'review', {'images': [None], 'copy': ['quote', 'author']}
    if tpl == 'homepage' and s == 6: return 'photo', {'images': [('image', 'imageAlt')], 'copy': ['title', 'caption']}
    if tag == 'figure' and sig == ('images', 'images', 'copy', 'copy', 'copy'): return 'person', {'images': [('photo', 'photoAlt')], 'copy': ['name', 'role', 'bio']}
    if tag == 'figure' and sig == ('images', 'images', 'copy', 'copy'): return 'person', {'images': [('photo', 'photoAlt')], 'copy': ['name', 'role']}
    if tag == 'figure' and sig == ('images', 'images', 'copy'): return 'photo', {'images': [('image', 'imageAlt')], 'copy': ['caption']}
    if tag == 'div' and sig == ('copy', 'copy'):
        if val(0)[:1] in '"“': return 'review', {'copy': ['quote', 'author']}
        if re.match(r'[\d$]', val(0)): return 'stat', {'copy': ['value', 'label']}
        if n >= 3: return 'feature', {'copy': ['title', 'text']}
    if tag == 'li' and sig == ('copy', 'copy') and n >= 3: return 'feature', {'copy': ['title', 'text']}
    if tag == 'div' and sig == ('copy', 'copy', 'copy') and val(0).isdigit(): return 'step', {'copy': ['number', 'title', 'text']}
    if tag == 'a' and sig == ('links', 'copy') and n >= 3: return ('arrowLink' if '→' in item else 'pill'), {'links': ['url'], 'copy': ['label']}
    if tag == 'a' and sig == ('links', 'images', 'images'): return 'logo', {'links': ['url'], 'images': [('image', 'imageAlt')]}
    if tag == 'a' and sig == ('links', 'images', 'images', 'copy', 'copy'): return 'linkCard', {'links': ['url'], 'images': [('image', 'imageAlt')], 'copy': ['title', 'text']}
    if tag == 'a' and sig == ('links', 'copy', 'copy', 'copy'): return 'linkCard', {'links': ['url'], 'copy': ['title', 'text', 'cta']}
    return None, None

def convert(page):
    done = 0
    page['html'] = str(BeautifulSoup(page['html'], 'html.parser'))  # canonical markup so blocks can be found by text
    while True:
        for run in runs(page['html']):
            items = [str(el) for el in run]
            slots = [SLOT.findall(x) for x in items]
            if not slots[0] or len({x[0] for sl in slots for x in sl}) != 1: continue
            kind, spec = classify(page, run, slots[0])
            if kind: break
        else:
            return done
        s = int(slots[0][0][0]); section = page['data']['demoSections'][s]
        start = page['html'].index(items[0]); pos = start
        for x in items:
            nxt = page['html'].index(x, pos); assert not page['html'][pos:nxt].strip(), (page['md'], kind); pos = nxt + len(x)
        assert kind not in {c['_template'] for c in section.get('cards', [])}, (page['md'], kind)
        used = {'copy': [], 'links': [], 'images': []}
        cards = []
        pattern = None
        for x, sl in zip(items, slots):
            order = {}  # (list, index) -> nth distinct item of that list in this block
            for _, k, i, _ in sl: order.setdefault((k, i), sum(1 for kk, _ in order if kk == k))
            card = {'_template': kind}; out = x
            for _, k, i, f in sl:
                name = spec[k][order[(k, i)]]
                value = section[k][int(i)][f]
                if isinstance(name, tuple): name = name[0] if f == 'source' else name[1]
                slot = f'@@{s}:{k}:{i}:{f}@@'
                out = out.replace(slot, html.escape(str(value), quote=True) if name is None else f'@@{s}:cards:#:{name}@@')
                if name is not None: card[name] = value
                used[k].append(int(i))
            pattern = pattern or out.replace(' open=""', '')
            cards.append(card)
        page['html'] = page['html'][:start] + f'<!--repeat:{s}:{kind}-->' + pattern + '<!--/repeat-->' + page['html'][pos:]
        for k, idx in used.items():
            if idx: remove_items(page, s, k, idx)
        section.setdefault('cards', []).extend(cards)
        print(f"  {page['md'].stem}: section {s} -> {len(cards)} x {kind}")
        done += 1

for page in load_all():
    if convert(page): save(page)
