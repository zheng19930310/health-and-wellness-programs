/* 从 src/ 分层文件重建 index.html（本地构建脚本，可重复执行）
 * 结构：p1_head.html(CSS+head) → p2_body.html(HTML骨架) → 单个 <script>：p3+p4+p5+p6+p7 → </body></html>
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const rd = f => fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n');

const head = rd('p1_head.html');      // 以 </style>\n</head>\n<body> 结尾
const body = rd('p2_body.html');      // HTML 骨架（不含 script）
const js = ['p3_data.js', 'p4_core.js', 'p5_charts.js', 'p6_mobile.js', 'p7_assist.js']
  .map(rd).join('\n');

const out = head + '\n' + body + '\n<script>\n' + js + '\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), out, 'utf8');
console.log('index.html rebuilt:', out.split('\n').length, 'lines');
