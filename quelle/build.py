# Baut aus app.html + body.js die veröffentlichten Dateien:
#  dist/app.html  (Fragment für die Claude-Vorschau)  und  repo/index.html (vollständiges Dokument für GitHub Pages)
import re, os
src = open('app.html').read()
body = open('body.js').read().replace('export function', 'function')
body = "/* =====================================================================\n   KAROSSERIE (aus body.js eingebunden)\n   ===================================================================== */\n" + body.split('*/', 1)[1] if body.startswith('/*') else body
full = src.replace('/*@@BODY@@*/', body)
assert '/*@@BODY@@*/' not in full
os.makedirs('dist', exist_ok=True)
import base64
glb = base64.b64encode(open('dist/trabant.glb','rb').read()).decode() if os.path.exists('dist/trabant.glb') else ''
embed = '<script>window.TRABANT_GLB_B64 = "' + glb + '";</script>\n' if glb else ''
open('dist/app.html', 'w').write(full.replace('<script type="importmap">', embed + '<script type="importmap">', 1))
head_end = full.index('-->') + 3
comment, rest = full[:head_end], full[head_end:]
t = rest.index('</style>') + len('</style>')
doc = ('<!doctype html>\n' + comment + '\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<meta name="description" content="Interaktiver 3D-Antriebsstrang des Trabant 601 Limousine: Karosserie aus Einzelteilen, Motor P63, Zündanlage, Kraftstoffanlage, Getriebe, Fahrwerk.">\n'
       '<meta name="theme-color" content="#0e1216">\n' + rest[:t].strip() + '\n</head>\n<body>\n' + rest[t:].strip() + '\n</body>\n</html>\n')
open('repo/index.html', 'w').write(doc)
print('gebaut', len(full), len(doc))
