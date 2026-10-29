/* 从 src/ 分层文件重建 index.html（本地构建脚本，可重复执行）
 * 结构：p1_head.html(CSS+head) → p2_body.html(HTML骨架) → 单个 <script>：p3+p4+p5+p6+p7 → </body></html>
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const rd = f => fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n');

const head = rd('p1_head.html');      // 以 </style>\n</head>\n<body> 结尾
const body = rd('p2_body.html');      // HTML shell, no <script>
const js = ['p3_data.js', 'p4_core.js', 'p5_charts.js', 'p6_mobile.js', 'p7_assist.js']
  .map(rd).join('\n');

/* 站点图标内联：保持单文件 index.html 双击即可显示 favicon（缺失时回退到真实文件路径） */
const asset = (f, mime, token, fallback) => {
  const p = path.join(root, 'assets', f);
  if (!fs.existsSync(p)) { console.warn('!! assets/' + f + ' 缺失，' + token + ' 回退为文件路径（可运行 powershell -File make-icons.ps1 重新生成）'); return fallback; }
  return 'data:' + mime + ';base64,' + fs.readFileSync(p).toString('base64');
};
const icons = [
  ['favicon.svg', 'image/svg+xml', '__FAVICON_SVG__', 'assets/favicon.svg'],
  ['favicon-32.png', 'image/png', '__FAVICON_PNG__', 'assets/favicon-32.png'],
  ['favicon-180.png', 'image/png', '__FAVICON_APPLE__', 'assets/favicon-180.png'],
];
let html = head + '\n' + body + '\n<script>\n' + js + '\n</script>\n</body>\n</html>\n';
icons.forEach(([f, mime, token, fb]) => { html = html.split(token).join(asset(f, mime, token, fb)); });
const left = html.match(/__[A-Z_]+__/g);
if (left) console.warn('!! 仍有未替换占位符：', [...new Set(left)].join(', '));

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
console.log('index.html rebuilt:', html.split('\n').length, 'lines,', (html.length / 1024).toFixed(1), 'KB');
