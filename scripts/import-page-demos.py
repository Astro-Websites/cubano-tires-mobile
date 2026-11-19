"""Import the approved Cubano demo bodies (requires beautifulsoup4 and PyYAML)."""
import shutil
import sys
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup, Comment
import yaml

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]); files = sorted(source.glob('*.html'))
assert len(files) == 18
slugs = {f.stem: f.stem for f in files}
slugs.update({'index': '', 'blog-index': 'blog', 'blog-post': 'blog/can-a-tire-with-a-nail-be-patched'})
frags = root/'src/fragments/demo-pages'; frags.mkdir(exist_ok=True)
assets = root/'public/uploads/cubano-pages'; assets.mkdir(parents=True, exist_ok=True)
allowed = set('a article aside blockquote br circle details div figcaption figure h1 h2 h3 img li nav ol p path section span strong summary svg ul'.split())
attrs = set('alt aria-hidden aria-label cx cy d fill href id open r role src style viewbox'.split())
for file in files:
    if file.stem == 'index': continue
    doc = BeautifulSoup(file.read_text(), 'html.parser')
    sections = doc.body.div.find_all('section', recursive=False)
    assert sections and doc.h1
    meta = doc.find('meta', attrs={'name':'description'})
    data = {'title': doc.title.get_text(strip=True), 'description': meta['content'] if meta else doc.h1.get_text(' ', strip=True), 'demoSections': []}
    for i, section in enumerate(sections):
        heading = section.find(['h1','h2','h3'])
        values = {'label': heading.get_text(' ',strip=True) if heading else (section.get('id') or section.get('aria-label') or f'Section {i+1}'), 'copy': [], 'links': [], 'images': []}
        for comment in section.find_all(string=lambda t:isinstance(t,Comment)): comment.extract()
        for t in [section, *section.find_all()]:
            assert t.name in allowed and set(t.attrs)<=attrs, (file,t.name,t.attrs.keys())
            assert not any(x in t.get('style','').lower() for x in ('url(', 'expression(', '@import', '\\'))
            if t.has_attr('viewbox'): t['viewBox'] = t.attrs.pop('viewbox')
            if t.has_attr('href'):
                link=t['href']; parsed=urlsplit(link)
                if parsed.path.endswith('.html') and not parsed.scheme:
                    dest=slugs[Path(parsed.path).stem];link='/' + (dest+'/' if dest else '') + ('#'+parsed.fragment if parsed.fragment else '')
                else: assert link.startswith('#') or parsed.scheme in ('https','tel','sms'), link
                k=len(values['links']);values['links'].append({'url':link,'label':t.get_text(' ',strip=True) or 'Link'});t['href']=f'@@{i}:links:{k}:url@@'
            if t.name=='img':
                image = Path(t['src']);assert image.parent == Path('images') and image.suffix in ('.png','.jpg')
                shutil.copyfile(source/image,assets/image.name)
                k=len(values['images']);values['images'].append({'source':'/uploads/cubano-pages/'+image.name,'alt':t.get('alt','')});t['src']=f'@@{i}:images:{k}:source@@';t['alt']=f'@@{i}:images:{k}:alt@@'
        for text in list(section.find_all(string=True)):
            raw=str(text); stripped=raw.strip()
            if not stripped: continue
            k=len(values['copy']);values['copy'].append({'text':stripped});text.replace_with(raw.replace(stripped,f'@@{i}:copy:{k}:text@@',1))
        data['demoSections'].append(values)
    (frags/(file.stem+'.html')).write_text('\n'.join(map(str,sections))+'\n')
    out = root/'src/content/page'/ (slugs[file.stem]+'.md');out.parent.mkdir(parents=True,exist_ok=True)
    data['demoTemplate']=file.stem
    out.write_text('---\n'+yaml.safe_dump(data,allow_unicode=True,sort_keys=False,width=1000)+'---\n')
