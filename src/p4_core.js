/* ============================================================
 *  Layer 2 : 应用内核 —— 路由 / 登录 / 导航 / 通用 CRUD 引擎
 * ============================================================ */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const now = () => { const d = new Date(), p = n => String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const today = () => now().slice(0,10);
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- 全局状态 ---------- */
const S = { user:null, view:'login', mod:'dashboard', tab:{}, page:{}, kw:{}, flt:{}, sel:{}, mobileRole:{app:'elder', mp:'elder'}, mpTab:0, appTab:0, folded:false };
try{ S.folded = localStorage.getItem('ky_proto_v1_fold')==='1'; }catch(e){}
const SEED = {};
function snapshot(){ GRP_ORDER.forEach(()=>{}); Object.keys(MODULES).forEach(k=>{ if(MODULES[k].rows && MODULES[k].rows.length) SEED[k]=clone(MODULES[k].rows); }); }
const LS = 'ky_proto_v1';
function persist(){ try{ const d={}; Object.keys(MODULES).forEach(k=>{ if(MODULES[k].rows) d[k]=MODULES[k].rows; }); localStorage.setItem(LS, JSON.stringify({u:S.user&&S.user.u, d})); }catch(e){} }
function restore(){ try{ const raw=localStorage.getItem(LS); if(!raw) return false; const o=JSON.parse(raw); if(!o.d) return false; Object.keys(o.d).forEach(k=>{ if(MODULES[k]) MODULES[k].rows=o.d[k]; }); UID=Math.max(UID,...Object.values(MODULES).flatMap(m=>(m.rows||[]).map(r=>r._id||0)),0); return true; }catch(e){ return false } }

/* ---------- toast ---------- */
function toast(msg, type){ const d=document.createElement('div'); d.className='toast '+(type||''); d.innerHTML=(type==='ok'?'✅ ':type==='err'?'⛔ ':type==='warn'?'⚠️ ':'💡 ')+esc(msg); $('toasts').appendChild(d); setTimeout(()=>{ d.style.transition='.3s'; d.style.opacity='0'; d.style.transform='translateY(-10px)'; setTimeout(()=>d.remove(),300); }, 2200); }

/* ---------- 弹层 ---------- */
const Modal = {
  open(title, body, foot, wide, footCls){ $('mTitle').innerHTML=title; $('mBody').innerHTML=body; $('mFoot').innerHTML=foot||'<button class="btn" onclick="Modal.close()">关闭</button>'; $('mFoot').className='m-f'+(footCls?' '+footCls:''); $('modal').className='modal'+(wide?' hdr':''); $('modal').dataset.wide = wide?'1':'0';
    /* APP / 小程序端：弹层收进手机屏宽度 */
    $('mask').classList.toggle('mob', S.view==='app'||S.view==='mp');
    $('mask').classList.add('on'); },
  close(){ $('mask').classList.remove('on'); },
  onOk(){ const f=$('mBody').querySelector('form'); if(f) f.requestSubmit ? f.dispatchEvent(new Event('submit',{cancelable:true})) : null; }
};
document.addEventListener('click', e=>{ if(e.target===$('mask')) Modal.close(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if($('mask')&&$('mask').classList.contains('on')){ Modal.close(); } else if($('emWin')&&$('emWin').classList.contains('on')){ emCloseWin(); } else { close3D(); } document.querySelectorAll('.dd.on').forEach(d=>d.classList.remove('on')); } });

/* ---------- 全屏 3D 视图查看器（内嵌独立单文件页面） ---------- */
function open3D(url, title){
  let ov = $('v3d');
  if(!ov){
    ov = document.createElement('div'); ov.id='v3d'; ov.className='v3d-mask';
    ov.innerHTML = `<div class="v3d-bar"><b id="v3dTitle"></b><div class="v3d-acts"><a id="v3dOpen" href="#" target="_blank" rel="noopener">↗ 新窗口打开</a><button class="btn" onclick="close3D()">✕ 关闭</button></div></div><iframe id="v3dFrame" src="about:blank" allow="fullscreen"></iframe>`;
    document.body.appendChild(ov);
  }
  $('v3dTitle').textContent = title||'3D 视图'; $('v3dOpen').setAttribute('href', url); $('v3dFrame').src = url;
  ov.classList.add('on');
}
function close3D(){ const ov=$('v3d'); if(ov && ov.classList.contains('on')){ ov.classList.remove('on'); $('v3dFrame').src='about:blank'; } }

/* ---------- 登录 ---------- */
function initLogin(){
  $('loginBg').style.backgroundImage = 'url(__LOGIN_BG__)';
  const remembered = localStorage.getItem(LS+'_user'); if(remembered) $('lgUser').value = remembered;
  document.querySelectorAll('.lg-tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.lg-tabs button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); const pwd=b.dataset.lt==='pwd'; $('lgPwd').style.display=pwd?'':'none'; $('lgSms').style.display=pwd?'none':''; });
  $('lgBtn').onclick = doLogin;
  [$('lgUser'),$('lgPwdIn')].forEach(i=>i.onkeydown=e=>{ if(e.key==='Enter') doLogin(); });
  $('showAcc').onclick = showAccounts;
}
function doLogin(){
  const u=$('lgUser').value.trim(), p=$('lgPwdIn').value, end=$('lgEnd').value;
  $('lgUserE').style.display = u?'none':''; $('lgPwdE').style.display = p?'none':'';
  if(!u||!p) return;
  const a = ACCOUNTS.find(x=>x.u===u);
  if(!a || a.p!==p){ toast('账号或密码错误，可点击下方“查看演示账号”','err'); return; }
  if(!a.ends.includes(end)){ toast(`${a.role} 无「${({admin:'Web 管理后台',screen:'数字大屏',app:'APP 端',mp:'小程序端',home:'门户首页'})[end]}」访问权限，已按权限进入门户`,'warn'); }
  S.user = a; if($('lgRemember').checked) localStorage.setItem(LS+'_user', u); else localStorage.removeItem(LS+'_user');
  logAct('登录系统', a.name+' / '+({admin:'Web 后台',screen:'数字大屏',app:'APP 端',mp:'小程序端',home:'门户首页'})[end], '低');
  toast(`欢迎回来，${a.name}（${a.role}）`,'ok');
  App.go(a.ends.includes(end)?end:'home');
}
function showAccounts(){
  const rows = ACCOUNTS.map(a=>`<div class="acc" onclick="fillAcc('${a.u}','${a.p}')">
    <b>${esc(a.name)}<span class="rl">${esc(a.role)}</span></b>
    <div class="un">${a.u} / ${a.p}</div>
    <div class="ends">可进入：${a.ends.map(e=>({admin:'Web 后台',screen:'大屏',app:'APP',mp:'小程序',home:'门户'})[e]).join(' · ')}</div>
    <div class="pv">点击填入</div></div>`).join('');
  Modal.open('🔑 演示账号一览（12 个角色 · 点击卡片自动填入）', `<div style="font-size:12.5px;color:var(--sub);margin-bottom:12px">原型为纯前端演示，账号密码固定写死。不同角色登录后可见的模块与可进入的端不同（RBAC 简化演示）；<b style="color:#e5484d">guard</b> 为「紧急监管 · 一级接警席」专属账号，可在 APP / 小程序端切到紧急监管端。超级管理员：<b style="color:var(--blue-d)">admin / admin123</b>，其余账号密码统一为 <b style="color:var(--green-d)">123456</b>。</div><div class="acc-list">${rows}</div>`,
    `<button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="fillAcc('admin','admin123')">使用超级管理员登录</button>`);
}
function fillAcc(u,p){ $('lgUser').value=u; $('lgPwdIn').value=p; Modal.close(); toast(`已填入 ${u} / ${p}，点击登录即可`,'ok'); }

/* ---------- 路由 ---------- */
const App = {
  go(view, mod){ location.hash = '#/'+view+(mod?('/'+mod):''); },
  boot(){
    snapshot();
    restore();
    initLogin();
    initTop();
    window.addEventListener('hashchange', route);
    setInterval(()=>{ const d=new Date(); const p=n=>String(n).padStart(2,'0'); if($('scClock')) $('scClock').textContent=`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; if($('hmTime')) $('hmTime').textContent=now()+':'+p(d.getSeconds()); }, 1000);
    if(S.user) route(); else route();
  },
  logout(){ logAct('退出登录', S.user?S.user.name:'-', '低'); S.user=null; App.go('login'); toast('已安全退出','ok'); },
  resetData(){ if(!confirm('确认重置全部演示数据？（新增/修改将清空）')) return; Object.keys(SEED).forEach(k=>MODULES[k].rows=clone(SEED[k])); localStorage.removeItem(LS); toast('演示数据已重置','ok'); route(); }
};
function route(){
  const hash = (location.hash||'#/login').replace(/^#\/?/,'');
  const [view, mod] = hash.split('/');
  let v = view||'login';
  if(v!=='login' && !S.user){ toast('请先登录','warn'); v='login'; location.hash='#/login'; }
  if(v==='admin' && S.user && !canAccess(mod||'dashboard')){ v='home'; }
  S.view = v; if(mod) S.mod = mod;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
  const node = $('v-'+v); if(!node){ App.go('login'); return; } node.classList.add('on');
  if(v==='home') renderHome();
  if(v==='admin'){ renderNav(); renderPage(); }
  if(v==='screen') initScreen();
  if((v==='app'||v==='mp') && S.user && ['elder','child','special'].includes(S.user.roleKey)){ S.mobileRole[v]=S.user.roleKey; }
  if(v==='app') renderMobile('app');
  if(v==='mp') renderMobile('mp');
  if(v==='login'){ const i=$('lgUser'); setTimeout(()=>i&&i.focus(),200); }
}
function canAccess(key){ if(!S.user) return false; const m=ROLE_MENUS[S.user.roleKey]; if(m==='*') return true; return m.includes(key); }
const TAB_CHILD = (()=>{ const s=new Set(); Object.keys(MODULES).forEach(k=>{ (MODULES[k].tabs||[]).forEach(t=>{ const c = t.includes('|')?t.split('|')[1]:t; if(MODULES[c] && !MODULES[c].tabs) s.add(c); }); }); return s; })();
function visibleModules(){ const m = S.user?ROLE_MENUS[S.user.roleKey]:'*'; return Object.keys(MODULES).filter(k=>{ if(TAB_CHILD.has(k)) return false; return m==='*' || m.includes(k); }); }

/* ---------- 门户首页 ---------- */
function renderHome(){
  const a=S.user; const p=n=>String(n).padStart(2,'0'); const d=new Date();
  $('hmWho').innerHTML = `<span class="av">${esc(a.name[0])}</span><span>${esc(a.name)} · ${esc(a.role)}</span>`;
  const h=d.getHours(); $('hmHi').innerHTML = `${h<6?'凌晨':h<11?'上午':h<13?'中午':h<18?'下午':'晚上'}好，<span>${esc(a.name)}</span>，欢迎回到智慧康养园区`;
  const cnt = k => (MODULES[k]&&MODULES[k].rows)?MODULES[k].rows.length:0;
  const elderN = cnt('archive'), dev = MODULES.device.rows, al = MODULES.devalarm.rows.filter(r=>r.status!=='已闭环'&&r.status!=='误报').length;
  const kpi = [
    ['在住长者', elderN+96, '人','↑ 本月新增 4 人'],
    ['今日告警待处置', al, '条', al>3?'⚠ 需立即处理':'状态可控'],
    ['在线设备', dev.filter(r=>r.online==='在线').length+' / '+dev.length, '台','在线率 '+Math.round(dev.filter(r=>r.online==='在线').length/dev.length*100)+'%'],
    ['今日活动', MODULES.activity.rows.filter(r=>r.date.slice(0,10)===today()||r.status==='报名中').length, '场','报名 '+(86+Math.floor(Math.random()*20))+' 人次'],
    ['待办审批', MODULES.leave.rows.filter(r=>r.status==='待审批').length + MODULES.complaint.rows.filter(r=>r.status==='待受理'||r.status==='已升级督办').length, '项','请假 / 投诉 / 计划'],
    ['本月消费', (Math.round(MODULES.order.rows.reduce((s,r)=>s+ (+r.amount||0),0)/1000)/10).toFixed(1)+' 万', '元','含子女代付 62%']
  ];
  $('hmKpi').innerHTML = kpi.map(k=>`<div class="k"><b>${esc(k[1])}</b><i>${esc(k[0])} · ${esc(k[2])}</i><u>${esc(k[3])}</u></div>`).join('');
  const ends = [
    {k:'admin', cls:'e1', ico:'🖥', t:'Web 管理后台', d:'27 个业务模块：档案、请假、活动、预约、关怀、消费、设备、系统管理与报表，支持增删改查与流程流转。', tag:'重点交付'},
    {k:'screen', cls:'e2', ico:'📊', t:'数字中心 · 大数据屏', d:'ECharts 实时可视化：经营趋势、健康风险、设备在线率、告警流与数字孪生园区地图。', tag:'1920×1080'},
    {k:'app', cls:'e3', ico:'📱', t:'APP 端原型', d:'长者端 / 子女端 / 特殊长者手环端三角色高保真原型：健康可视化、活动报名、订餐、AI 陪伴、SOS 呼救、到位置动打卡。', tag:'可交互'},
    {k:'mp', cls:'e4', ico:'💬', t:'小程序端原型', d:'微信胶囊导航 + 宫格服务：扫码签到、康养圈动态、请假与预约表单、子女授权查看、手环端自动打卡。', tag:'轻量入口'}
  ];
  $('hmEnds').innerHTML = ends.map(e=>{ const ok=a.ends.includes(e.k); return `<div class="end ${e.cls}" style="${ok?'':'opacity:.42;filter:grayscale(.5)'}" onclick="${ok?`App.go('${e.k}')`:`toast('${a.role} 无该端权限，可换 admin / manager / iot 等账号体验','warn')`}">
    <div class="badge">${ok?e.tag:'无权限'}</div><div class="ico">${e.ico}</div><h3>${e.t}</h3><p>${e.d}</p><div class="go">进入 →</div></div>`; }).join('');
  const roles = ACCOUNTS.map(x=>`<div><b>${esc(x.role)}</b>${x.u} / ${x.p}<br>${esc(x.desc)}</div>`).join('');
  $('hmRoles').innerHTML = roles;
  const todo = [];
  MODULES.leave.rows.filter(r=>r.status==='待审批').slice(0,3).forEach(r=>todo.push(['📝',`${r.name} 的${r.type}申请待审批`,r.start]));
  MODULES.complaint.rows.filter(r=>r.status==='待受理'||r.status==='已升级督办').slice(0,3).forEach(r=>todo.push(['⚠️',`${r.level}·${r.title}`,r.date]));
  MODULES.devalarm.rows.filter(r=>r.status==='待处置').slice(0,3).forEach(r=>todo.push(['🚨',`${r.level} ${r.kind} · ${r.obj}`,r.time]));
  MODULES.booking.rows.filter(r=>r.status==='待确认').slice(0,2).forEach(r=>todo.push(['📅',`预约待确认 · ${r.item}`,r.date]));
  MODULES.plan.rows.filter(r=>r.status==='待审批').slice(0,2).forEach(r=>todo.push(['🗂',`计划待审批 · ${r.title}`,r.end]));
  $('hmTodo').innerHTML = todo.slice(0,9).map(t=>`<li><span>${t[0]}</span><b style="flex:1">${esc(t[1])}</b><span style="color:rgba(255,255,255,.45)">${esc(t[2])}</span></li>`).join('') || '<li>暂无待办</li>';
  $('hmOpen').innerHTML = MODULES.api.rows.slice(0,7).map(r=>`<li><span>${r.status==='正常'?'🟢':r.status==='降级'?'🟡':''}</span><b style="flex:1">${esc(r.plat)} · ${esc(r.name)}</b><span style="color:rgba(255,255,255,.45)">${esc(r.succ)}</span></li>`).join('');
}

/* ---------- 侧栏导航 ---------- */
function renderNav(){
  const keys = visibleModules();
  let html = '';
  GRP_ORDER.forEach(g=>{
    const items = keys.filter(k=>MODULES[k].grp===g);
    if(!items.length) return;
    html += `<div class="grp" onclick="App.foldGroup(this)">${g}<span style="font-size:10px">▾</span></div>`;
    items.forEach(k=>{ const m=MODULES[k]; const c = badgeCount(k);
      html += `<a href="#/admin/${k}" class="${S.mod===k?'on':''}" data-k="${k}"><span class="ic">${m.icon}</span>${esc(m.title)}${c?`<span class="cnt ${k==='iot'||k==='devalarm'||k==='complaint'?'red':''}">${c}</span>`:''}</a>`; });
  });
  html += `<div class="grp">原型说明</div><a href="javascript:App.about()" class=""><span class="ic">ℹ️</span>关于本原型</a><a href="javascript:App.resetData()" class=""><span class="ic">♻️</span>重置演示数据</a>`;
  $('nav').innerHTML = html;
  applyFold();
  $('topAv').textContent = S.user.name[0]; $('topName').textContent = S.user.name; $('topRole').textContent = S.user.role;
  const al = MODULES.devalarm.rows.filter(r=>r.status==='待处置').length + MODULES.complaint.rows.filter(r=>r.status==='待受理').length;
  $('msgBdg').textContent = al; $('msgBdg').style.display = al?'':'none';
}
function badgeCount(k){
  const rows = (MODULES[k]&&MODULES[k].rows)||[];
  const map = { leave:r=>r.status==='待审批', complaint:r=>['待受理','已升级督办'].includes(r.status), devalarm:r=>r.status==='待处置',
    booking:r=>r.status==='待确认', plan:r=>r.status==='待审批', ocr:r=>r.status==='待校对', care:r=>r.status==='待执行',
    circle:r=>r.status==='待审核', fraud:r=>r.result==='关注中', auth2:r=>r.status==='待授权', remind:r=>r.status==='未确认',
    device:r=>['离线','故障'].includes(r.online), deviceops:r=>['待派单','处理中'].includes(r.status), clip:r=>r.auth==='待审批',
    video:r=>r.status==='离线', rec:r=>r.status!=='正常', serve:r=>r.alarm!=='无', psych:r=>['待干预','需转介'].includes(r.status),
    hospice:r=>r.stage==='危重期', ai:r=>r.alert!=='无', monitor:r=>false, sys:r=>false, meal:r=>false, consume:r=>false, iot:r=>false, bio:r=>false, open:r=>false,
    order:r=>r.status==='待支付', member:r=>r.status==='待续费', pkg:r=>r.status==='已售罄', access:r=>r.status==='已过期',
    biolib:r=>r.quality==='需重采', biorec:r=>r.result!=='通过', api:r=>['降级','熔断'].includes(r.status), apilog:r=>r.result!=='成功',
    account:r=>r.status==='锁定', log:r=>r.risk==='高', param:r=>false, org:r=>false, role:r=>false, archive:r=>r.status==='请假外出',
    health:r=>r.risk==='高', activity:r=>r.status==='进行中', sport:r=>r.status==='异常中止', class:r=>r.status==='开课中',
    menu:r=>r.status==='待上架', diet:r=>r.risk==='高', arrange:r=>r.cook==='待确认', family:r=>r.status==='待审核',
    clean:r=>r.inspect==='待整改', dashboard:r=>false, twin:r=>false, reports:r=>false, point:r=>false,
    space:r=>false, building:r=>r.status!=='在用', room:r=>['维修中','清洁中'].includes(r.status), stay:r=>['待签约','退租申请','换房中'].includes(r.status),
    album:r=>false, diary:r=>false, legacy:r=>r.status==='草稿' };
  return (map[k]?rows.filter(map[k]).length:0);
}
App.foldGroup = h => { let n=h.nextElementSibling; while(n && !n.classList.contains('grp')){ n.classList.toggle('hide'); n=n.nextElementSibling; } };
/* 侧栏收起/展开：只切换 .folded 类，样式由 CSS 接管，菜单重建后状态不丢失 */
function applyFold(){
  const s = $('side'); if(!s) return;
  s.classList.toggle('folded', !!S.folded);
  const b = $('foldBtn'); if(b){ b.title = S.folded?'展开侧栏':'收起侧栏'; b.textContent = S.folded?'»':'☰'; }
}
App.toggleFold = () => { S.folded = !S.folded; applyFold(); try{ localStorage.setItem(LS+'_fold', S.folded?'1':'0'); }catch(e){} };
App.about = () => Modal.open('ℹ️ 关于本原型', `<div style="font-size:13px;line-height:2">
  <p><b>康养项目综合管理平台 · 前端高保真原型</b>（单 HTML 文件，无后端，数据全部为模拟）</p>
  <p>· 依据 PRD V1.1 实现 Web 管理后台 <b>37 个一级入口 / 64 个模块</b>，支持<b>增删改查、条件检索、分页、批量删除、CSV 导出、流程状态流转与详情查看</b>。</p>
  <p>· 新增<b>空间资产</b>（分区→楼栋→房间→IoT 设备四级联动、入住绑定与退租）与<b>温暖传承</b>（相册、日记、AI 个人传记）两大产品域。</p>
  <p>· 门户首页可切换 <b>Web 后台 / 数字大屏 / APP 端 / 小程序端</b> 四端；数字大屏使用在线 ECharts 5.5.1。</p>
  <p>· 主色调：蓝 <code>#1668DC</code> · 黑 <code>#0A1524</code> · 绿 <code>#00B578</code>。</p>
  <p>· 数据保存在浏览器 localStorage，可在侧栏底部「重置演示数据」还原。</p>
  <p>· 演示账号：<b>admin / admin123</b>（超级管理员），其余角色账号密码统一 <b>123456</b>。</p></div>`);

/* ---------- 顶栏交互 ---------- */
function initTop(){
  $('endSw').onclick = e => { e.stopPropagation(); $('endDd').classList.toggle('on'); $('msgDd').classList.remove('on'); };
  $('endDd').addEventListener('click', e=>{ const b=e.target.closest('button[data-go]'); if(b){ $('endDd').classList.remove('on'); App.go(b.dataset.go); } });
  $('msgBtn').onclick = e => { e.stopPropagation(); $('msgDd').classList.toggle('on'); $('endDd').classList.remove('on'); renderMsg(); };
  document.addEventListener('click', ()=>{ $('endDd').classList.remove('on'); $('msgDd').classList.remove('on'); });
  $('foldBtn').onclick = App.toggleFold;
  $('globalSearch').addEventListener('keydown', e=>{ if(e.key==='Enter'){ const kw=e.target.value.trim(); if(!kw) return; S.kw.archive=kw; S.mod='archive'; App.go('admin','archive'); toast(`已在「个人档案管理」中检索：${kw}`,'ok'); } });
}
function renderMsg(){
  const items = [];
  MODULES.devalarm.rows.filter(r=>r.status==='待处置'||r.status==='处置中').slice(0,4).forEach(r=>items.push(['🚨',`${r.level} ${r.kind}`,`${r.obj} · ${r.time}`]));
  MODULES.complaint.rows.filter(r=>r.status==='已升级督办'||r.status==='待受理').slice(0,3).forEach(r=>items.push(['⚠️',r.title,`${r.from} 提交 · ${r.date}`]));
  MODULES.leave.rows.filter(r=>r.status==='逾期').forEach(r=>items.push(['⏰',`请假逾期 · ${r.name}`,`应于 ${r.end} 归园`]));
  MODULES.fraud.rows.filter(r=>r.result==='关注中').forEach(r=>items.push(['🛡',`防诈关注 · ${r.name}`,`${r.kind} · ${r.date}`]));
  $('msgDd').innerHTML = `<div style="padding:8px 10px;font-weight:600;border-bottom:1px solid var(--line)">消息中心（${items.length}）</div>` +
    (items.map(i=>`<div style="display:flex;gap:9px;padding:9px 10px;border-bottom:1px dashed var(--line)"><span>${i[0]}</span><div style="flex:1"><b style="font-size:12.8px">${esc(i[1])}</b><div class="tiny">${esc(i[2])}</div></div></div>`).join('') || '<div class="empty" style="padding:24px">暂无新消息</div>') +
    `<button style="width:100%;padding:9px;color:var(--blue);font-size:12.5px" onclick="App.go('admin','devalarm')">查看全部告警 →</button>`;
}

/* ---------- 页面渲染（含 tabs / 通用表格） ---------- */
function renderPage(){
  const key = S.mod; const m0 = MODULES[key];
  if(!m0){ App.go('admin','dashboard'); return; }
  if(key!=='emergency'){ if(typeof emHideWin==='function') emHideWin(); S._emBack = key; }
  if(m0.tabs){ renderTabs(key, m0); return; }
  if(m0.custom){ return CUSTOM[m0.custom] ? CUSTOM[m0.custom](key) : page404(); }
  renderTable(key);
}
function page404(){ $('crumb').innerHTML='首页'; $('page').innerHTML='<div class="card"><div class="empty"><div class="e">🚧</div>模块建设中</div></div>'; }
function renderTabs(key, m0){
  const subs = m0.tabs.map(t=>{ const [label, k] = t.includes('|')?t.split('|'):[t,t]; return {label:label||MODULES[k].title, k}; });
  const cur = S.tab[key] || subs[0].k;
  $('crumb').innerHTML = `首页 / ${esc(m0.grp)} / <b>${esc(m0.title)}</b>`;
  $('page').innerHTML = `<div class="page-h"><div><h2>${m0.icon} ${esc(m0.title)}</h2><p>${esc(m0.desc||MODULES[cur].desc||'')}</p></div>
    <div class="acts"><button class="btn" onclick="App.go('screen')">📊 大屏查看</button><button class="btn" onclick="App.exportCsv('${cur}')">⬇ 导出当前列表</button></div></div>
    <div class="card"><div class="tabs">${subs.map(s=>`<button class="${s.k===cur?'on':''}" onclick="S.tab['${key}']='${s.k}';renderPage()">${esc(s.label)}</button>`).join('')}</div>
    <div id="tabHost"></div></div>`;
  const host = $('tabHost'); const sm = MODULES[cur];
  host.innerHTML = tableHTML(cur, sm);
  bindTable(cur, host);
}

/* ---------- 通用表格 ---------- */
function colVal(col, row){ return row[col.k]; }
function tagHTML(col, v){
  if(v==='' || v==null) return '<span class="tiny">—</span>';
  if(col.tag){ const c = col.tag[v]; if(c) return `<span class="tag ${c}">${esc(v)}</span>`; if(col.tag && Object.keys(col.tag).length===0) return String(v).split(',').map(x=>`<span class="tag blue">${esc(x)}</span>`).join(' '); }
  return esc(v);
}
function cellHTML(col, row){
  let v = row[col.k];
  if(col.type==='avatar'){ const nm = v||'—'; return `<div class="nm"><span class="av">${esc(String(nm).slice(0,1))}</span><b>${esc(nm)}</b></div>`; }
  if(col.k==='online'||col.k==='status'&&/在线|离线/.test(String(v))) { /* handled below */ }
  if(col.type==='money' && v!=='' && v!=null) return `<b>${Number(v).toLocaleString()}</b>`;
  if(col.mono) return `<span class="mono">${esc(v)}</span>`;
  return tagHTML(col, v);
}
function filteredRows(key){
  const m = MODULES[key]; let rows = (m.rows||[]).slice();
  const kw = (S.kw[key]||'').trim();
  if(kw) rows = rows.filter(r => Object.keys(r).some(k=>k!=='_id' && String(r[k]).includes(kw)));
  const f = S.flt[key]||{}; Object.keys(f).forEach(k=>{ if(f[k]) rows = rows.filter(r=>String(r[k]).includes(f[k])); });
  return rows;
}
function tableHTML(key, m){
  const cols = (m.cols||[]).filter(c=>!c.notbl);
  const fcols = (m.cols||[]).filter(c=>c.filter);
  const rows = filteredRows(key);
  const size = m.page||8, page = S.page[key]||1, pages = Math.max(1, Math.ceil(rows.length/size));
  const cur = Math.min(page, pages); const view = rows.slice((cur-1)*size, cur*size);
  const sel = S.sel[key]||new Set();
  let h = `<div class="filters">
    <input class="inp" placeholder="🔍 关键词检索本模块" value="${esc(S.kw[key]||'')}" onchange="S.kw['${key}']=this.value;S.page['${key}']=1;renderPage()">
    ${fcols.map(c=>`<select class="sel" onchange="S.flt['${key}']=S.flt['${key}']||{};S.flt['${key}']['${c.k}']=this.value;S.page['${key}']=1;renderPage()"><option value="">${esc(c.t)}：全部</option>${(c.opts||[]).map(o=>`<option ${((S.flt[key]||{})[c.k]===o)?'selected':''}>${esc(o)}</option>`).join('')}</select>`).join('')}
    <div class="grow"></div>
    <span class="tiny">共 <b style="color:var(--blue-d)">${rows.length}</b> 条${sel.size?` · 已选 ${sel.size}`:''}</span>
    ${sel.size?`<button class="btn sm dg" onclick="Crud.batchDel('${key}')">批量删除</button>`:''}
    <button class="btn sm" onclick="S.kw['${key}']='';S.flt['${key}']={};S.page['${key}']=1;renderPage()">重置</button>
    <button class="btn sm" onclick="App.exportCsv('${key}')">⬇ 导出 CSV</button>
    ${m.noAdd?'':'<button class="btn sm p" onclick="Crud.open(\''+key+'\')">＋ 新增'+esc(m.title.replace(/管理$/,''))+'</button>'}
  </div>`;
  if(!view.length) return h + `<div class="empty"><div class="e">🗂</div>没有匹配的数据，试试调整筛选条件或点击「新增」</div></div>`;
  h += `<div class="tbwrap"><table class="tb"><thead><tr><th style="width:34px"><input type="checkbox" class="chk" onclick="Crud.all('${key}',this.checked)"></th>`+
    cols.map(c=>`<th>${esc(c.t)}</th>`).join('') + `<th style="width:${m.flow?190:150}px">操作</th></tr></thead><tbody>`;
  view.forEach(r=>{
    h += `<tr class="${sel.has(r._id)?'sel':''}"><td><input type="checkbox" class="chk" ${sel.has(r._id)?'checked':''} onclick="Crud.one('${key}',${r._id},this.checked)"></td>`;
    cols.forEach(c=> h += `<td>${cellHTML(c, r)}</td>` );
    h += `<td class="ops">${rowOps(key, m, r)}</td></tr>`;
  });
  h += `</tbody></table></div>` + pager(key, cur, pages, rows.length);
  return h;
}
function rowOps(key, m, r){
  let ops = `<span class="link" onclick="Crud.detail('${key}',${r._id})">详情</span>`;
  (FLOWS[m.flow]||[]).forEach((a,i)=>{ const from = [].concat(a.st||[]); if(!from.length || from.includes(r[a.f||'status'])) ops += `<span class="link ${a.danger?'dg':''}" onclick="Crud.flow('${key}',${r._id},${i})">${a.t}</span>`; });
  if(!m.noEdit) ops += `<span class="link" onclick="Crud.open('${key}',${r._id})">编辑</span>`;
  ops += `<span class="link dg" onclick="Crud.del('${key}',${r._id})">删除</span>`;
  return ops;
}
function pager(key, cur, pages, total){
  if(pages<=1) return `<div class="pager">共 ${total} 条</div>`;
  let b = `<button ${cur===1?'disabled':''} onclick="S.page['${key}']=1;renderPage()">首页</button><button ${cur===1?'disabled':''} onclick="S.page['${key}']=${cur-1};renderPage()">‹</button>`;
  for(let i=Math.max(1,cur-2); i<=Math.min(pages,cur+2); i++) b += `<button class="${i===cur?'on':''}" onclick="S.page['${key}']=${i};renderPage()">${i}</button>`;
  b += `<button ${cur===pages?'disabled':''} onclick="S.page['${key}']=${cur+1};renderPage()">›</button><button ${cur===pages?'disabled':''} onclick="S.page['${key}']=${pages};renderPage()">末页</button> 第 ${cur}/${pages} 页 · 每页 ${MODULES[key].page||8} 条`;
  return `<div class="pager">${b}</div>`;
}
function bindTable(){}

/* ---------- CRUD ---------- */
const Crud = {
  open(key, id){
    const m = MODULES[key]; const row = id?m.rows.find(r=>r._id===id):null;
    const fields = (m.cols||[]).filter(c=>!c.noform);
    const half = fields.filter(c=>c.type!=='textarea'), full = fields.filter(c=>c.type==='textarea');
    let html = `<form id="cform" onsubmit="return Crud.save(event,'${key}',${id||0})"><div class="grid2">`;
    half.forEach(c=>{ html += fieldHTML(key, c, row?row[c.k]:'', row); });
    html += `</div>`; full.forEach(c=>{ html += fieldHTML(key, c, row?row[c.k]:'', row); });
    if(row) html += `<div class="tiny" style="margin-top:6px;padding-top:10px;border-top:1px dashed var(--line)">记录编号 <b class="mono">#${row._id}</b> · 演示数据仅存于本机浏览器 localStorage</div>`;
    Modal.open(`${row?'编辑':'新增'} · ${m.title}`, html, `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="document.getElementById('cform').requestSubmit()">保存</button>`, true);
  },
  save(e, key, id){
    e.preventDefault(); const m = MODULES[key]; const data = {};
    (m.cols||[]).filter(c=>!c.noform).forEach(c=>{ const el=$('f_'+c.k); if(el) data[c.k] = c.type==='num'||c.type==='money' ? (el.value===''?'':Number(el.value)) : el.value.trim(); });
    let ok = true;
    (m.cols||[]).filter(c=>c.req&&!c.noform).forEach(c=>{ const err=$('e_'+c.k); if(!data[c.k]){ if(err){err.style.display='block';err.textContent=c.t+'不能为空';} ok=false; } else if(err) err.style.display='none'; });
    if(!ok){ toast('请完善必填项','err'); return false; }
    if(id){ const r = m.rows.find(x=>x._id===id); Object.assign(r, data); toast(`${m.title}：已更新 1 条记录`,'ok'); logAct('编辑记录', m.title+' / '+(data[m.cols[0].k]||data.name||''), '低'); }
    else { const r = { _id: ++UID, ...data }; autoFill(key, r); m.rows.unshift(r); toast(`${m.title}：新增成功，已置顶显示`,'ok'); logAct('新增记录', m.title+' / '+(data[m.cols[0].k]||''), '低'); }
    persist(); Modal.close(); renderPage(); renderNav(); return false;
  },
  del(key, id){
    const m = MODULES[key]; const r = m.rows.find(x=>x._id===id); if(!r) return;
    const label = m.cols.map(c=>r[c.k]).filter(Boolean).slice(0,2).join(' / ');
    Modal.open('⚠️ 删除确认', `<p style="font-size:13.5px;line-height:2">确认删除 <b>${esc(m.title)}</b> 中的记录：<br><span class="hl">${esc(label)}</span><br><br>删除后可通过「重置演示数据」恢复初始样例。</p>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" style="background:linear-gradient(135deg,#e5484d,#c22c31)" onclick="Crud._del('${key}',${id})">确认删除</button>`);
  },
  _del(key, id){ const m=MODULES[key]; const i=m.rows.findIndex(r=>r._id===id); if(i>-1){ const l=m.rows[i]; m.rows.splice(i,1); } Modal.close(); persist(); renderPage(); renderNav(); toast('已删除 1 条记录','ok'); logAct('删除记录', m.title, '中'); },
  one(key, id, on){ S.sel[key] = S.sel[key]||new Set(); on?S.sel[key].add(id):S.sel[key].delete(id); renderPage(); },
  all(key, on){ const m=MODULES[key]; const rows=filteredRows(key).slice(0,(m.page||8)); S.sel[key]=on?new Set(rows.map(r=>r._id)):new Set(); renderPage(); },
  batchDel(key){ const ids=[...(S.sel[key]||[])]; Modal.open('⚠️ 批量删除', `<p style="font-size:13.5px">确认删除已选中的 <b>${ids.length}</b> 条记录？该操作会写入操作日志。</p>`,
    `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" style="background:linear-gradient(135deg,#e5484d,#c22c31)" onclick="Crud._batch('${key}')">确认删除</button>`); },
  _batch(key){ const m=MODULES[key]; const ids=[...(S.sel[key]||[])]; m.rows=m.rows.filter(r=>!ids.includes(r._id)); S.sel[key]=new Set(); Modal.close(); persist(); renderPage(); renderNav(); toast(`已批量删除 ${ids.length} 条记录`,'ok'); logAct('批量删除', m.title+' × '+ids.length, '中'); },
  flow(key, id, i){
    const m=MODULES[key], acts=FLOWS[m.flow]||[], a=acts[i], r=m.rows.find(x=>x._id===id); if(!a||!r) return;
    const field = a.f||'status';
    if(a.ask){
      Modal.open(`${a.t} · ${m.title}`, `<div class="field"><label><i>*</i>${a.ask}</label><textarea class="txta" id="flowNote" placeholder="请填写处理说明，将写入留痕记录">${a.prefill||''}</textarea></div>
        <div class="tiny">状态流转：<b>${esc(r[field]||'—')}</b> → <b style="color:var(--blue-d)">${esc(a.to)}</b>${a.extra?`　<span style="color:var(--green-d)">${a.extra}</span>`:''}</div>`,
        `<button class="btn" onclick="Modal.close()">取消</button><button class="btn g" onclick="Crud._flow2('${key}',${id},${i})">确认${a.t}</button>`);
      window.__flowTmp = {key,id,i};
    } else { Crud._flow(key,id,i); }
  },
  _flow2(key,id,i){ const n=$('flowNote'); const m=MODULES[key], r=m.rows.find(x=>x._id===id), a=FLOWS[m.flow][i]; if(a.note) r[a.note]=n.value.trim(); if(a.also) Object.assign(r, a.also(n.value.trim())); Crud._flow(key,id,i); },
  _flow(key,id,i){
    const m=MODULES[key], r=m.rows.find(x=>x._id===id), a=FLOWS[m.flow][i], field=a.f||'status';
    r[field] = typeof a.to==='function'? a.to(r) : a.to;
    if(a.set) Object.assign(r, a.set(r));
    if(a.ts) r[a.ts] = now();
    if(a.after){ try{ a.after(r); }catch(err){ console.warn('流程联动失败', err); } }
    if(a.push) pushAlert(a.pushTitle, a.pushBody, r);
    persist(); Modal.close(); renderPage(); renderNav();
    toast(`${a.t}成功：${esc(r.name||r.title||r.no||'')} → ${r[field]}`,'ok');
    logAct(a.t, m.title+' / '+(r[m.cols[0].k]||''), a.risk||'中');
  },
  detail(key, id){
    const m=MODULES[key], r=m.rows.find(x=>x._id===id); if(!r) return;
    if(m.detail==='archive') return detailArchive(r);
    const cols=(m.cols||[]);
    let body = `<div class="dinfo">` + cols.map(c=>`<div><label>${esc(c.t)}</label>${cellHTML(c, r)||'<span class="tiny">—</span>'}</div>`).join('') + `</div>`;
    const rel = related(key, r);
    body += `<div style="height:16px"></div><div class="card-h" style="padding:10px 0;border-top:1px solid var(--line)"><h3>关联记录（自动汇聚）</h3></div>${rel}`;
    Modal.open(`📄 ${m.title} · 详情`, body, `<button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="Modal.close();Crud.open('${key}',${id})">编辑</button>`, true);
  }
};
function fieldHTML(key, c, v, row){
  const id='f_'+c.k, eid='e_'+c.k, full = c.type==='textarea';
  let inner='';
  if(c.type==='select'){ const opts = c.dyn? c.dyn() : (c.opts||[]);
    inner = `<select class="sel" id="${id}"><option value="">请选择${esc(c.t)}</option>${opts.map(o=>`<option ${String(o)===String(v)?'selected':''}>${esc(o)}</option>`).join('')}</select>`; }
  else if(c.type==='textarea') inner = `<textarea class="txta" id="${id}" placeholder="${esc(c.placeholder||'')}">${esc(v)}</textarea>`;
  else if(c.type==='date') inner = `<input class="inp" type="date" id="${id}" value="${esc(v||today())}">`;
  else if(c.type==='datetime') inner = `<input class="inp" type="datetime-local" id="${id}" value="${esc(String(v).replace(' ','T').slice(0,16))}">`;
  else if(c.type==='time') inner = `<input class="inp" type="time" id="${id}" value="${esc(v)}">`;
  else if(c.type==='num'||c.type==='money') inner = `<input class="inp" type="number" step="any" id="${id}" value="${esc(v)}" placeholder="${esc(c.placeholder||'')}">`;
  else inner = `<input class="inp" id="${id}" value="${esc(v)}" placeholder="${esc(c.placeholder||'')}">`;
  return `<div class="field" ${full?'style="grid-column:1/-1"':''}><label>${c.req?'<i>*</i>':''}${esc(c.t)}${c.unit?`（${c.unit}）`:''}</label>${inner}<div class="err" id="${eid}"></div></div>`;
}
function autoFill(key, r){
  const m=MODULES[key];
  const set=(k,v)=>{ if(r[k]===undefined||r[k]==='') r[k]=v; };
  if(/code$|no$/.test('') ) {}
  if(m.cols.some(c=>c.k==='status') && r.status===undefined) r.status = m.cols.find(c=>c.k==='status').opts[0];
  if(m.cols.some(c=>c.k==='online') && r.online===undefined) r.online='在线';
  if(m.cols.some(c=>c.k==='cook') && r.cook===undefined) r.cook='待确认';
  if(m.cols.some(c=>c.k==='auth') && r.auth===undefined) r.auth='待审批';
  if(m.cols.some(c=>c.k==='check') && r.check===undefined) r.check='待校验';
  if(m.cols.some(c=>c.k==='upload')) set('upload', now());
  if(m.cols.some(c=>c.k==='conf')) set('conf','待识别');
  if(m.cols.some(c=>c.k==='fields')) set('fields','—');
  if(m.cols.some(c=>c.k==='date')&&!r.date) r.date=today();
  if(m.cols.some(c=>c.k==='time')&&!r.time) r.time=now();
  const idc = m.cols.find(c=>c.noform&&/code|no$/.test(c.k));
  if(idc && !r[idc.k]) r[idc.k] = (key.slice(0,2).toUpperCase())+String(Date.now()).slice(-8);
}
function related(key, r){
  const name = r.name || r.author || r.elder || r.from || '';
  const hits = [];
  ['leave','health','care','booking','order','devalarm','fraud','circle','remind','psych'].forEach(k=>{
    if(k===key||!MODULES[k].rows) return;
    MODULES[k].rows.filter(x=>Object.values(x).some(v=>typeof v==='string'&&name&&v===name)).slice(0,2).forEach(x=>{
      const c = MODULES[k].cols.filter(cc=>!cc.notbl).slice(0,3).map(cc=>`${cc.t}：${x[cc.k]||'—'}`).join('　');
      hits.push([MODULES[k].title, c]);
    });
  });
  if(!hits.length) return '<div class="tiny">暂无跨模块关联记录。</div>';
  return `<ul class="lst">${hits.slice(0,8).map(h=>`<li><span class="ic g">🔗</span><div><b>${esc(h[0])}</b><p>${esc(h[1])}</p></div></li>`).join('')}</ul>`;
}
function detailArchive(r){
  const tab=(t,rows)=>`<div class="card-h" style="padding:12px 0 8px"><h3>${t}</h3></div>${rows}`;
  const byName = k => (MODULES[k].rows||[]).filter(x=>x.name===r.name);
  const health = byName('health'), leave = byName('leave'), care = byName('care'), sport = byName('sport'), order = byName('order'), fam = MODULES.family.rows.filter(x=>x.ename===r.name);
  const stayOf = (MODULES.stay.rows||[]).filter(x=>x.name===r.name), rm = roomOf(r.room);
  const albs = (MODULES.album.rows||[]).filter(a=>a.owner===r.name && a.status!=='已销毁'), dys = (MODULES.diary.rows||[]).filter(d=>d.name===r.name), bios = (MODULES.legacy.rows||[]).filter(b=>b.name===r.name);
  const kv = (o,cols)=>`<div class="dinfo">${cols.map(c=>`<div><label>${esc(c.t)}</label>${cellHTML(c,o)||'<span class="tiny">—</span>'}</div>`).join('')}</div>`;
  let body = `<div class="dwrap"><div class="dside">
      <div style="text-align:center;padding:14px;background:linear-gradient(160deg,#0f4c96,#127a63);border-radius:12px;color:#fff">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:28px">${esc(r.name.slice(0,1))}</div>
        <b style="font-size:17px">${esc(r.name)}</b><div style="font-size:12px;opacity:.85">${esc(r.sex)} · ${esc(r.age)} 岁</div>
        <div style="margin-top:8px;font-size:12px;opacity:.9">${esc(r.zone)} ${esc(r.room)}</div>
        <div style="margin-top:8px"><span class="tag green" style="background:rgba(255,255,255,.2);color:#fff">${esc(r.pkg)}</span></div></div>
      <div style="margin-top:12px" class="tiny">健康等级：${tagHTML({tag:{'自理':'green','半自理':'warn','失能':'red','专护':'red'}}, r.level)}<br>入住：${esc(r.inDate)}<br>标签：${esc(r.tags)}</div>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
        <button class="btn sm g" onclick="Modal.close();S.kw.leave='${r.name}';App.go('admin','leave')">查看请假</button>
        <button class="btn sm" onclick="Modal.close();S.kw.order='${r.name}';App.go('admin','order')">消费订单</button>
        <button class="btn sm" onclick="Modal.close();Crud.open('remind');setTimeout(()=>{const e=document.getElementById('f_target');if(e)e.value='${r.name}'},50)">发起提醒</button>
      </div></div>
    <div class="dmain">
      ${tab('📇 基本信息', kv(r, MODULES.archive.cols.filter(c=>['idcard','phone','guardian','gphone','allergy','history','inDate','status'].includes(c.k))))}
      ${tab('❤️ 健康与体征（'+health.length+'）', health.length?`<table class="tb"><thead><tr><th>日期</th><th>类型</th><th>心率</th><th>血氧</th><th>血压</th><th>风险</th></tr></thead><tbody>${health.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.hr)}</td><td>${esc(x.spo2)}</td><td>${esc(x.bp)}</td><td>${tagHTML({tag:{'低':'green','中':'warn','高':'red'}},x.risk)}</td></tr>`).join('')}</tbody></table>`:'<div class="tiny">暂无记录</div>')}
      ${tab('🔑 房间与入住（'+stayOf.length+' 份合同）', `${rm?`<div class="dinfo" style="margin-bottom:10px">${[['code','房号'],['area','分区'],['bld','楼栋'],['type','房型'],['beds','床位'],['size','面积'],['adapt','适老化'],['status','使用状态']].map(p=>`<div><label>${p[1]}</label>${esc(rm[p[0]]||'—')}</div>`).join('')}</div>`:'<div class="tiny">该长者当前未绑定有效房间</div>'}
        ${stayOf.length?`<table class="tb"><thead><tr><th>合同号</th><th>房号</th><th>套餐</th><th>起</th><th>止</th><th>绑定设备</th><th>状态</th></tr></thead><tbody>${stayOf.map(s=>`<tr><td class="mono">${esc(s.no)}</td><td class="mono">${esc(s.room)}</td><td>${esc(s.pkg)}</td><td>${esc(s.start)}</td><td>${esc(s.end)}</td><td>${esc(s.band||'—')}</td><td>${tagHTML({tag:{'待签约':'blue','已绑定':'green','换房中':'warn','退租申请':'warn','已退租':'ink'}},s.status)}</td></tr>`).join('')}</tbody></table>`:''}`)}
      ${tab('📸 温暖与传承（相册 '+albs.length+' · 日记 '+dys.length+' · 传记 '+bios.length+'）', `${albs.length?`<div class="sw-box">${albs.map(a=>`<div class="ck"><b>${a.cover||'📷'} ${esc(a.name)}</b><p>${esc(a.cate)} · ${(a.photos||[]).length} 张 · ${esc(a.priv)}${a.share!=='未分享'?' · 已分享':''}</p></div>`).join('')}</div>`:''}
        ${dys.length?`<ul class="lst">${dys.slice(0,4).map(d=>`<li><span class="ic ${d.kind==='录音'?'':d.kind==='画画'?'g':'w'}">${d.kind==='笔记'?'✍️':d.kind==='录音'?'🎙':d.kind==='画画'?'🎨':'📷'}</span><div><b>${esc(d.title)}</b><p>${esc(String(d.content||'').slice(0,42))}…</p></div><span class="tm">${esc(d.date)}</span></li>`).join('')}</ul>`:'<div class="tiny">暂无日记记录</div>'}
        ${bios.length?`<div class="tiny" style="margin-top:8px">传记：${bios.map(b=>`<b>${esc(b.title)}</b>（${esc(b.status)} · ${(b.chapters||[]).length} 章）`).join('　')}</div>`:''}`)}
      ${tab('👪 家属与授权（'+fam.length+'）', fam.length?fam.map(f=>`<div class="dinfo" style="margin-bottom:8px">${[['cname','子女'],['rel','关系'],['auth','授权范围'],['pay','代付权限'],['notice','通知偏好']].map(p=>`<div><label>${p[1]}</label>${esc(f[p[0]]||'—')}</div>`).join('')}</div>`).join(''):'<div class="tiny">未绑定子女/家属</div>')}
      ${tab('🎁 关怀与活动', `<ul class="lst">${care.slice(0,3).map(c=>`<li><span class="ic">🎁</span><div><b>${esc(c.type)}</b><p>${esc(c.content)}</p></div><span class="tm">${esc(c.date)}</span></li>`).join('')||'<li class="tiny">暂无关怀记录</li>'}${sport.slice(0,2).map(s=>`<li><span class="ic g">🏃</span><div><b>${esc(s.plan)}</b><p>${esc(s.dur)} 分钟 · ${esc(s.step)} 步 · ${esc(s.status)}</p></div><span class="tm">${esc(s.date)}</span></li>`).join('')}</ul>`)}
      ${tab('💳 消费记录（'+order.length+'）', order.length?`<table class="tb"><thead><tr><th>订单号</th><th>商品</th><th>金额</th><th>支付</th><th>状态</th></tr></thead><tbody>${order.map(o=>`<tr><td class="mono">${esc(o.no)}</td><td>${esc(o.goods)}</td><td><b>${Number(o.amount).toLocaleString()}</b></td><td>${esc(o.pay)}</td><td>${tagHTML({tag:{'待支付':'warn','已支付':'blue','已核销':'green','已退款':'ink','已取消':'red'}},o.status)}</td></tr>`).join('')}</tbody></table>`:'<div class="tiny">暂无消费</div>')}
      ${tab('🕒 最近流转', `<ul class="tl">${leave.slice(0,3).map(l=>`<li class="${l.status==='逾期'?'r':'g'}"><b>${esc(l.type)} · ${esc(l.status)}</b><label>${esc(l.start)} → ${esc(l.end)}　${esc(l.dest)}</label></li>`).join('')||'<li class="tiny">暂无请假流转</li>'}${MODULES.log.rows.slice(0,2).map(l=>`<li><b>${esc(l.act)}</b><label>${esc(l.time)} · ${esc(l.user)}</label></li>`).join('')}</ul>`)}
    </div></div>`;
  Modal.open(`📇 个人档案 · ${esc(r.name)}`, body, `<button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="Modal.close();Crud.open('archive',${r._id})">编辑档案</button><button class="btn g" onclick="Modal.close();Crud.open('care')">发起关怀</button>`, true);
}

/* ---------- 空间资产 · 跨模块联动（入住绑定 / 退租 / 换房 驱动房间台账与长者档案） ---------- */
function roomOf(code){ const c=String(code||'').trim().toUpperCase(); return (MODULES.room.rows||[]).find(r=>String(r.code).trim().toUpperCase()===c)||null; }
function archiveOf(name){ return (MODULES.archive.rows||[]).find(a=>a.name===name)||null; }
function bldZone(name){ const b=(MODULES.building.rows||[]).find(x=>x.name===name); return b? (b.zone||'') : ''; }
function roomDevKeys(code){ const c=String(code||'').trim().toUpperCase(); return [c, c.replace(/-/g,'')]; }
const SpaceLink = {
  /* 签约绑定：房间转已入住 + 住客写入 + 档案区域房号同步 + 设备绑定到人 */
  bind(stay){
    const room = roomOf(stay.room);
    if(room){ room.status='已入住'; room.guest=stay.name; if(stay.area) room.area=stay.area; if(stay.bld) room.bld=stay.bld; const z=bldZone(stay.bld); if(z) room.zone=z; }
    const a = archiveOf(stay.name);
    if(a){ if(room){ a.zone=room.zone||a.zone; a.room=room.code; } a.status='在院'; if(!a.inDate) a.inDate=stay.start||today(); }
    const keys = roomDevKeys(stay.room);
    (MODULES.device.rows||[]).forEach(d=>{ const txt=(d.no+' '+d.name+' '+d.pos+' '+(d.bind||'')).toUpperCase(); if(keys.some(k=>k&&txt.includes(k))) d.bind=stay.name; });
    return room;
  },
  /* 退租结算：房间释放空置 + 住客清空 + 档案离园 + 设备解绑 */
  release(stay){
    const room = roomOf(stay.room);
    if(room && room.guest===stay.name){ room.status='空置'; room.guest=''; }
    const a = archiveOf(stay.name); if(a) a.status='离园';
    const keys = roomDevKeys(stay.room);
    (MODULES.device.rows||[]).forEach(d=>{ const txt=(d.no+' '+d.name+' '+d.pos).toUpperCase(); if(keys.some(k=>k&&txt.includes(k)) && d.bind===stay.name) d.bind='—'; });
    return room;
  },
  /* 换房：释放原房间、绑定新房间，并把房号回写到合同 */
  move(stay){
    const raw = String(stay.newRoom||'');
    const m = raw.match(/[A-Za-z]\d?[-—]?\s?\d{3}/);
    const code = m ? m[0].replace(/[-—]\s?/,'-').toUpperCase() : '';
    if(stay.prevRoom){ const old=roomOf(stay.prevRoom); if(old && old.guest===stay.name){ old.status='空置'; old.guest=''; } }
    if(!code){ toast('未识别到新房号，房间台账未变动','warn'); return null; }
    stay.room = code; stay.newRoom=''; stay.prevRoom='';
    const room = roomOf(code);
    if(room){ room.status='已入住'; room.guest=stay.name; const z=bldZone(stay.bld); if(z) room.zone=z; }
    const a = archiveOf(stay.name); if(a){ a.room=code; if(room && room.zone) a.zone=room.zone; }
    return room;
  }
};

/* ---------- 流程动作定义 ---------- */
const FLOWS = {
  leave: [
    {t:'同意', st:'待审批', to:'已同意', set:r=>({approver:S.user?S.user.name:'—'}), ask:'审批意见（可空）', note:'result'},
    {t:'驳回', st:'待审批', to:'已驳回', set:r=>({approver:S.user?S.user.name:'—'})},
    {t:'外出', st:'已同意', to:'外出中'},
    {t:'销假', st:['已同意','外出中'], to:'已销假', ask:'归园情况确认'},
    {t:'逾期告警', st:'外出中', to:'逾期', push:'请假逾期告警', pushTitle:r=>'请假逾期 · 已通知子女与值班'}
  ],
  complaint: [
    {t:'受理', st:'待受理', to:'处理中', set:r=>({owner:S.user?S.user.name:r.owner})},
    {t:'处理完成', st:'处理中', to:'待回访', ask:'处理结果说明', note:'reply'},
    {t:'回访闭环', st:'待回访', to:'已闭环'},
    {t:'升级督办', st:['待受理','处理中'], to:'已升级督办', ask:'督办原因', note:'reply', push:'投诉升级督办', pushTitle:r=>'已推送管理决策层'}
  ],
  book: [
    {t:'确认', st:'待确认', to:'已确认'},
    {t:'到访', st:'已确认', to:'已到访'},
    {t:'完成', st:['已到访','已确认'], to:'已完成', ask:'体验评价与转化判断', also:v=>({lead:/高|强/.test(v)?'高意向':/中/.test(v)?'中意向':'低意向'})},
    {t:'取消', st:['待确认','已确认'], to:'已取消'}
  ],
  signup: [
    {t:'签到核销', st:['报名中','进行中'], to:'进行中', set:r=>({checkin:(+r.signed||0)})},
    {t:'结束复盘', st:['报名中','进行中'], to:'已结束', ask:'活动效果与满意度', also:v=>({sat:v.slice(0,40)})}
  ],
  plan: [ {t:'审批通过', st:'待审批', to:'进行中', set:r=>({prog:10})}, {t:'推进 10%', st:'进行中', to:r=>Math.min(90,(+r.prog||0)+10)>=90?'已完成':'进行中', set:r=>({prog:Math.min(100,(+r.prog||0)+10)})}, {t:'标记完成', st:'进行中', to:'已完成', set:r=>({prog:100})} ],
  push: [ {t:'立即推送', st:'待推送', to:'已推送', push:'提醒已多端触达', pushTitle:r=>'提醒推送成功'}, {t:'确认回执', st:'已推送', to:'已确认', set:r=>({ack:now()})}, {t:'催办', st:'已推送', to:'未确认'} ],
  check: [ {t:'验收合格', st:'已完成', to:'已完成', set:r=>({inspect:'合格'})}, {t:'登记问题', st:'已完成', to:'已完成', ask:'问题描述与整改要求', note:'issue', set:r=>({inspect:'待整改'})}, {t:'整改闭环', st:['已完成'], to:'已完成', set:r=>({inspect:'已整改'})} ],
  audit: [ {t:'通过发布', st:'待审核', to:'已发布'}, {t:'隐藏', st:['已发布','待审核'], to:'已隐藏'} ],
  sport: [ {t:'标记达标', st:['部分达标','未达标'], to:'已达标'}, {t:'安全中止', st:['已达标','部分达标','未达标'], to:'异常中止', ask:'中止原因与处置'} ],
  meal: [ {t:'厨房确认', st:['待确认'], to:'已确认', f:'cook'}, {t:'改单', st:['待确认','已确认'], to:'已改单', f:'cook', ask:'调整内容', note:'note'} ],
  psych: [ {t:'开始干预', st:'待干预', to:'干预中', ask:'干预措施', note:'act'}, {t:'已改善', st:['干预中','待干预'], to:'已改善'}, {t:'专业转介', st:'干预中', to:'需转介', push:'心理风险转介', pushTitle:r=>'已通知医护团队'} ],
  fraud: [ {t:'成功拦截', st:['关注中'], to:'成功拦截', f:'result', ask:'拦截措施', note:'act'}, {t:'已报案', st:['关注中','成功拦截'], to:'已报案', f:'result'}, {t:'安排关怀', st:[], to:'已安排', f:'care'}, {t:'结束关注', st:['关注中'], to:'未遂', f:'result', set:r=>({care:'已安排'})} ],
  ai: [ {t:'派关怀任务', st:[], to:'已派关怀任务', f:'alert', ask:'关怀内容', note:'snippet', prefill:'已生成人文关怀任务并指派管家：'}, {t:'通知子女', st:[], to:'已通知子女', f:'alert'}, {t:'忽略', st:[], to:'无', f:'alert'} ],
  member: [ {t:'升级', st:['正常','待续费'], to:'正常', ask:'升级理由与生效权益'}, {t:'冻结', st:'正常', to:'已冻结'}, {t:'解冻', st:['已冻结','已过期'], to:'正常'} ],
  verify: [ {t:'核销', st:['待支付','已支付'], to:'已核销', set:r=>({staff:S.user?S.user.name:'—'})}, {t:'退款', st:['已支付','已核销'], to:'已退款', ask:'退款原因与金额'}, {t:'取消', st:'待支付', to:'已取消'} ],
  device: [ {t:'上线', st:['离线','故障','维护中'], to:'在线'}, {t:'维护', st:['在线'], to:'维护中'}, {t:'报修', st:['在线','离线'], to:'故障', push:'设备故障', pushTitle:r=>'已生成运维工单'} ],
  alarm: [ {t:'开始处置', st:'待处置', to:'处置中', set:r=>({owner:S.user?S.user.name:'—'})}, {t:'处置闭环', st:['待处置','处置中'], to:'已闭环', ask:'处置记录（现场情况、联动结果）', note:'result'}, {t:'误报', st:['待处置','处置中'], to:'误报'}, {t:'转派', st:['待处置'], to:'处置中', ask:'转派对象与原因'} ],
  wo: [ {t:'派单', st:'待派单', to:'处理中', set:r=>({prog:20})}, {t:'完成', st:['处理中','待验收'], to:'已完成', set:r=>({prog:100})}, {t:'验收', st:'待验收', to:'已完成', set:r=>({prog:100})}, {t:'挂起', st:['处理中','待派单'], to:'已挂起'} ],
  bio: [ {t:'重新采集', st:['启用','停用','待入库'], to:'待入库', set:r=>({quality:'需重采'})}, {t:'入库启用', st:['待入库'], to:'启用', set:r=>({quality:'优',liveness:'通过'})}, {t:'停用', st:'启用', to:'停用'}, {t:'撤回授权', st:['启用','停用'], to:'停用', set:r=>({auth:'已撤回'})} ],
  ocr: [ {t:'校对入库', st:['待校对','需重扫'], to:'已入库', set:r=>({conf:'99.0%'})}, {t:'需重扫', st:'待校对', to:'需重扫'}, {t:'识别失败', st:['待校对'], to:'识别失败'} ],
  audit2: [ {t:'审批通过', st:'待审批', to:'已审批', f:'auth', set:r=>({status:'已完成'})}, {t:'驳回', st:'待审批', to:'已驳回', f:'auth', set:r=>({status:'失败'})}, {t:'执行导出', st:['已审批'], to:'已审批', f:'auth', set:r=>({status:'已完成'}), ask:'导出用途与水印声明', note:'purpose'} ],
  switch: [ {t:'启用', st:['停用','未启用','离线','降级','熔断','失效','已到期'], to:'启用', f:'status'}, {t:'停用', st:['启用','正常','生效'], to:'停用', f:'status'} ],
  acc: [ {t:'重置密码', st:['启用','停用','锁定'], to:'启用', ask:'新密码策略', prefill:'重置为初始密码 123456，强制下次登录修改'}, {t:'停用', st:'启用', to:'停用'}, {t:'解锁', st:['锁定','停用'], to:'启用'} ],
  perm: [ {t:'配置权限', st:[], to:'启用', ask:'勾选模块与数据范围（演示）', prefill:'模块：档案/请假/活动；数据范围：本区域；敏感数据：健康'}, {t:'停用角色', st:'启用', to:'停用'}, {t:'启用', st:'停用', to:'启用'} ],
  /* 空间资产 · 楼栋 */
  bld: [ {t:'报修停用', st:'在用', to:'维护中', ask:'维护内容与预计工期', note:'note'}, {t:'恢复启用', st:['维护中','停用'], to:'在用'}, {t:'停止使用', st:['维护中','在用'], to:'停用', ask:'停用原因与在住人员安置方案', note:'note'} ],
  /* 空间资产 · 房间 */
  room: [ {t:'安排维修', st:['空置','预留'], to:'维修中', ask:'维修内容与工期', note:'note'}, {t:'维修完成验收', st:'维修中', to:'空置'}, {t:'清洁消毒', st:['空置','维修中'], to:'清洁中'}, {t:'清洁完成', st:'清洁中', to:'空置'}, {t:'设为预留', st:'空置', to:'预留', ask:'预留对象与期限', note:'note'}, {t:'释放为空置', st:['预留','清洁中'], to:'空置'} ],
  /* 空间资产 · 入住绑定与退租（联动房间台账 + 长者档案 + 设备绑定） */
  stay: [ {t:'绑定房间', st:'待签约', to:'已绑定', ts:'bindTime', ask:'确认房号与绑定设备（如 A-305 / BW-A305-01 手环）', note:'note', after:r=>SpaceLink.bind(r)},
    {t:'办理换房', st:'已绑定', to:'已绑定', ask:'新房号（如 B-203），系统将自动释放原房间并同步档案', note:'newRoom', set:r=>({prevRoom:r.room}), after:r=>SpaceLink.move(r)},
    {t:'申请退租', st:'已绑定', to:'退租申请', ask:'退租原因与拟退租日期', note:'note'},
    {t:'退租结算', st:['退租申请','换房中','已绑定'], to:'已退租', ask:'结算明细（房费/押金/餐费/设备损耗）', note:'settle', set:r=>({outDate:today()}), after:r=>SpaceLink.release(r)},
    {t:'续签一年', st:'已绑定', to:'已绑定', ask:'续签备注与优惠', note:'note', set:r=>({end:plusYear(r.end)})} ]
};
function plusYear(dstr){ const s=String(dstr||today()); return (/^\d{4}/.test(s)) ? (Number(s.slice(0,4))+1)+s.slice(4) : s; }

/* 告警推送（写入大屏与消息中心） */
function pushAlert(title, body, r){
  const msg = typeof body==='function'? body(r) : body;
  MODULES.devalarm.rows.unshift({ _id:++UID, no:'AL'+String(Date.now()).slice(-10), time:now(), kind:title, level:'I 级（紧急）', obj:(r&&r.name)||'—', dev:'人工触发', value:msg||'', rule:'联动摄像头抓拍 → 推送值班与子女', owner:'—', status:'待处置', result:'' });
  toast(`${title}：已联动推送值班、子女端与大屏`,'warn');
}
function logAct(act, obj, risk){
  if(!MODULES.log) return;
  MODULES.log.rows.unshift({ _id:++UID, time:now()+':'+String(new Date().getSeconds()).padStart(2,'0'), user:S.user?S.user.name:'系统', role:S.user?S.user.role:'系统', act, obj, ip:'10.20.1.'+(S.user?S.user.u.length*3+12:1), end:({admin:'Web',screen:'大屏',app:'APP',mp:'小程序',home:'Web'})[S.view]||'Web', risk:risk||'低', result:'成功', detail:'' });
  if(MODULES.log.rows.length>60) MODULES.log.rows.length=60;
}

/* CSV 导出 */
App.exportCsv = key => {
  const m = MODULES[key]; if(!m) return;
  const cols = (m.cols||[]).filter(c=>!c.notbl);
  const rows = filteredRows(key);
  const head = cols.map(c=>c.t).join(',');
  const body = rows.map(r=>cols.map(c=>`"${String(r[c.k]==null?'':r[c.k]).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff'+head+'\n'+body], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`康养平台_${m.title}_${today()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  toast(`已导出 ${rows.length} 条「${m.title}」数据（CSV）`,'ok'); logAct('导出数据', m.title+' / '+rows.length+' 条', '高');
};
