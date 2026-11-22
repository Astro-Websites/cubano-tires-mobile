"""One-off: stars, arrows and breadcrumb separators are design, not copy.
Bake them into the templates so editors only see real text."""
from designed_pages import load_all, inline_copy, save
DECORATIVE = {'★★★★★', '→', '›', '·', '|'}
for page in load_all():
    n = 0
    for s, section in enumerate(page['data']['demoSections']):
        for i in reversed(range(len(section['copy']))):
            if section['copy'][i]['text'] in DECORATIVE:
                inline_copy(page, s, i); n += 1
    save(page)
    print(page['md'].name, n)
