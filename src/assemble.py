import pathlib, re, sys
B = pathlib.Path('/data/work/build')
parts = [ (B/'p1_head.html').read_text('utf-8'),
          (B/'p2_body.html').read_text('utf-8'),
          (B/'p3_data.js').read_text('utf-8'),
          (B/'p4_core.js').read_text('utf-8'),
          (B/'p5_charts.js').read_text('utf-8'),
          (B/'p6_mobile.js').read_text('utf-8') ]
js = '\n'.join(parts[2:])
if '</script>' in js:
    sys.exit('ERROR: literal </script> found in JS layers')
b64 = (B/'login-bg.b64').read_text('utf-8').strip()
html = parts[0] + parts[1] + '\n<script>\n' + js + '\n</script>\n</body>\n</html>\n'
html = html.replace('__LOGIN_BG__', 'data:image/jpeg;base64,' + b64)
out = B/'index.html'
out.write_text(html, 'utf-8')
print('index.html bytes =', out.stat().st_size)
print('placeholder left =', html.count('__LOGIN_BG__'))
