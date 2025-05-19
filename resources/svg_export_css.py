from xml.dom.minidom import parse, parseString

doc = parse('icons.svg')
f=open("icons.txt", "w")

for p in doc.getElementsByTagName('path'):
    id, d = map(p.getAttribute, ('id','d'))
    stroke = 'black' if id in ('yellow','white','pink','orange') else 'white';
    print(f'.{id}::after {{ mask:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path style="stroke-width: 25px; fill: none; stroke: {stroke};" d="{d}" /></svg>\') }}', file=f)

