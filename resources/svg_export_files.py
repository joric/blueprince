from xml.dom.minidom import parse, parseString

doc = parse('icons.svg')

for p in doc.getElementsByTagName('path'):
    id, d = map(p.getAttribute, ('id','d'))
    stroke = 'black' if id in ('yellow','white','pink','orange') else 'white';

    f=open(f'export/{id}.svg', "w")
    print(f'<svg viewBox="0 0 512 512"><path d="{d}" /></svg>', file=f)

