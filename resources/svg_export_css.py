from xml.dom.minidom import parse, parseString

doc = parse('icons.svg')
f=open("icons.css", "w")

def truncate_path(d):
    def truncate(s):
        try:
            return str(int(float(s)))
        except:
            pass
        return s
    def process(s: str) -> bool:
        return ','.join(map(truncate, s.split(',')))
    return ' '.join(map(process, d.split()))

for p in doc.getElementsByTagName('path'):
    id, d = map(p.getAttribute, ('id','d'))
    d = truncate_path(d)
    print(f'.{id}::after {{ mask:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path style="stroke-width: 25px; fill: none; stroke: black;" d="{d}" /></svg>\') }}', file=f)

