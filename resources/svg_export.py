from xml.dom.minidom import parse, parseString

doc = parse('icons.svg')
f=open("icons.txt", "w")

for p in doc.getElementsByTagName('path'):
    print('  "%s": "%s",' % (p.getAttribute('id'), p.getAttribute('d')), file=f)

