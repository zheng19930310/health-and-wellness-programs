/* ================= 小康 · 智能交流助手（Web 管理后台 · 任意界面 · 可多窗口） =================
   能力：① 聊当前菜单内容  ② 快速跳转任意功能  ③ 查模块数据  ④ 聊天记入笔记（localStorage 持久化）
   形态：右下角悬浮按钮随时唤起；支持同时开多个可拖拽会话窗口；原型内置规则知识库（未接大模型）。 */
const XK = {
  wins: [], seq: 0, zTop: 850, notes: [], fab: null, maxWin: 6,
  NKEY: LS + '_xk',

  /* 别名表：口语词 → 模块 key（运行时校验 MODULES 是否存在） */
  ALIAS: [
    {k:'emergency',w:['紧急','预警','接警','备勤','执勤','sos','三级响应','雷达']},
    {k:'archive',  w:['档案','长者','老人','住户','长者档案','长者信息','人员档案']},
    {k:'health',   w:['健康','体征','心率','血压','血氧','病例','体检']},
    {k:'leave',    w:['请假','外出','销假']},
    {k:'care',     w:['关怀','走访','慰问']},
    {k:'family',   w:['子女','家属','授权管理']},
    {k:'complaint',w:['投诉','意见','督办','满意度']},
    {k:'activity', w:['活动','报名','签到']},
    {k:'booking',  w:['预约','理疗预约','体验']},
    {k:'plan',     w:['计划','照护计划']},
    {k:'remind',   w:['提醒','待办']},
    {k:'clean',    w:['清洁','卫生','保洁','消毒']},
    {k:'circle',   w:['康养圈','动态','时光']},
    {k:'meal',     w:['订餐','点餐','营养餐']},
    {k:'arrange',  w:['配餐','排餐','食谱']},
    {k:'diet',     w:['膳食','饮食']},
    {k:'order',    w:['消费','订单','收银','账单']},
    {k:'point',    w:['积分']},
    {k:'member',   w:['会员']},
    {k:'consume',  w:['储值','充值','代付']},
    {k:'iot',      w:['设备','物联网','手环','在线率']},
    {k:'devalarm', w:['告警','报警','异常处置']},
    {k:'video',    w:['视频','监控','录像','摄像头']},
    {k:'bio',      w:['生物识别','人脸','指纹']},
    {k:'ocr',      w:['证照','扫描识别']},
    {k:'deviceops',w:['运维','工单','报修']},
    {k:'sys',      w:['系统','权限','账号','角色','参数']},
    {k:'fraud',    w:['防诈','诈骗','反诈']},
    {k:'ai',       w:['陪伴','智能陪伴']},
    {k:'class',    w:['课堂','课程']},
    {k:'sport',    w:['运动','锻炼']},
    {k:'psych',    w:['心理','情绪']},
    {k:'hospice',  w:['临终','安宁']},
    {k:'reports',  w:['报表','统计报表']},
    {k:'twin',     w:['数字孪生','孪生','三维','室内导航','样板间']},
    {k:'dashboard',w:['驾驶舱','首页','总览','看板']}
  ],

  /* ---------- 挂载与可见性 ---------- */
  mount(){
    if(this.fab) return;
    const d=document.createElement('div'); d.id='xkFab'; d.title='小康 · 智能交流助手（任意界面可唤起，可多开）';
    d.innerHTML='<span class="fi">🌿</span><b>小康</b><small>智能交流</small>';
    d.onclick=()=>XK.open();
    document.body.appendChild(d); this.fab=d;
    this.loadNotes();
  },
  sync(){
    if(!this.fab) this.mount();
    const on = !!(S.user && S.view==='admin');
    this.fab.classList.toggle('on', on);
    this.wins.slice().forEach(w=>{
      w.el.style.display = on ? '' : 'none';
      if(!on) return;
      const t=S.mod;
      if(w.lastMod!==t){
        const m=MODULES[t];
        w.el.querySelector('.ctx').textContent = m ? ('📍 '+m.title) : '';
        if(w.lastMod) this.push(w,'sys','当前菜单已切换到「'+esc(m?m.title:t)+'」，可以继续问我');
        w.lastMod=t;
      }
    });
  },

  /* ---------- 会话窗口 ---------- */
  open(){
    if(this.wins.length>=this.maxWin) return toast('最多同时打开 '+this.maxWin+' 个会话窗口','warn');
    const i=++this.seq, n=this.wins.length;
    const win={ id:i, msgs:[], min:false, lastMod:null, x:0, y:0, el:null };
    const el=document.createElement('div'); el.className='xk-win';
    win.x=Math.max(12, innerWidth-384-24-n*28); win.y=Math.min(innerHeight-140, Math.max(70, 84+n*28));
    el.style.left=win.x+'px'; el.style.top=win.y+'px'; el.style.zIndex=++this.zTop;
    const chips=['这页能干什么？','系统有哪些功能？','跳转到 投诉与意见','3D 入口','多少位长者？','记录到笔记'];
    el.innerHTML = `<div class="xk-hd"><span>🌿</span><span class="t">小康 · 会话${i}</span><span class="ctx"></span><span class="sp"></span>`
      + `<button title="保存聊天到笔记" onclick="XK.noteAsk(this)">📝</button>`
      + `<button title="新建会话（支持多窗口）" onclick="XK.open()">➕</button>`
      + `<button title="最小化" onclick="XK.min(this)">▾</button>`
      + `<button title="关闭" onclick="XK.close(this)">✕</button></div>`
      + `<div class="xk-msgs"></div>`
      + `<div class="xk-chips">${chips.map(t=>`<button onclick="XK.chip(this,'${t}')">${t}</button>`).join('')}</div>`
      + `<div class="xk-in"><input placeholder="输入问题，回车发送…" onkeydown="if(event.key==='Enter')XK.send(this)"><button onclick="XK.send(this.previousElementSibling)">➤</button></div>`;
    el.__xk=win; win.el=el; document.body.appendChild(el);
    this.wins.push(win); this.front(el); this.drag(win);
    const cur=MODULES[S.mod];
    el.querySelector('.ctx').textContent = cur ? ('📍 '+cur.title) : '';
    win.lastMod=S.mod;
    this.push(win,'ai','新会话已开启 🌿<br>你现在在<b>管理后台</b>，任何菜单界面都可以找我。'+(cur?`当前菜单：<b>${cur.icon} ${esc(cur.title)}</b>`:''));
    this.push(win,'ai',this.helpHTML());
  },
  drag(win){
    const hd=win.el.querySelector('.xk-hd');
    hd.onpointerdown = e => {
      if(e.target.closest('button')) return;
      this.front(win.el);
      const sx=e.clientX-win.x, sy=e.clientY-win.y;
      const mv=ev=>{ win.x=Math.min(innerWidth-70,Math.max(4,ev.clientX-sx)); win.y=Math.min(innerHeight-50,Math.max(4,ev.clientY-sy));
        win.el.style.left=win.x+'px'; win.el.style.top=win.y+'px'; };
      const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); };
      addEventListener('pointermove',mv); addEventListener('pointerup',up);
    };
    win.el.onpointerdown = ()=>this.front(win.el);
  },
  front(el){ el.style.zIndex=++this.zTop; this.wins.forEach(w=>w.el.classList.toggle('act', w.el===el)); },
  min(btn){ const win=btn.closest('.xk-win').__xk; win.min=!win.min; win.el.classList.toggle('min',win.min); btn.textContent=win.min?'▴':'▾'; },
  close(btn){ const el=btn.closest('.xk-win'); const win=el.__xk; this.wins=this.wins.filter(w=>w!==win); el.remove(); },

  /* ---------- 消息流 ---------- */
  push(win, who, html){
    const m={who, html, ts:now()}; win.msgs.push(m);
    const box=win.el.querySelector('.xk-msgs');
    const d=document.createElement('div'); d.className='xk-m '+who;
    d.innerHTML = who==='sys' ? `<span class="xk-b">${html}</span>`
      : `<span class="av">${who==='ai'?'🌿':(S.user?esc(S.user.name[0]):'我')}</span><span class="xk-b">${html}</span>`;
    box.appendChild(d); box.scrollTop=box.scrollHeight;
    return d;
  },
  chip(btn, text){ const inp=btn.closest('.xk-win').querySelector('.xk-in input'); inp.value=text; this.send(inp); },
  send(inp){
    const win=inp.closest('.xk-win').__xk; const t=inp.value.trim(); if(!t) return; inp.value='';
    this.push(win,'me',esc(t));
    const ti=this.push(win,'ai','<span style="color:var(--sub-l)">小康正在回复</span>');
    ti.classList.add('xk-typing');
    setTimeout(()=>{ ti.classList.remove('xk-typing'); ti.querySelector('.xk-b').innerHTML=this.reply(win,t);
      ti.closest('.xk-msgs').scrollTop=99999; }, 380+Math.random()*360);
  },

  /* ---------- 回复引擎（内置规则知识库） ---------- */
  reply(win, q){
    const m=MODULES[S.mod];
    if(/^(你好|您好|嗨|hi|hello)|你是谁|能做什么|会什么|帮助|怎么用|功能列表/i.test(q)) return this.helpHTML();
    /* 笔记：保存 / 查看 */
    if(/笔记/.test(q) && /(保存|记录|记到|写入|存成|存到)/.test(q)) return this.doNote(win);
    if(/笔记/.test(q) && /(查看|打开|列出|看看|列表|我的)/.test(q)){ this.showNotes(); return '已为你打开<b>笔记面板</b> 📚，可查看、复制或删除全部会话笔记。'; }
    /* 3D / 大屏入口 */
    if(/3d|三维|孪生|样板间|室内导航|全局查看|效果图/.test(q) && !/紧急监管|监管端/.test(q)) return '管理后台「数字孪生 / 3D 监控」页内置了三个 3D 入口，我可以直接帮你打开：'+this.d3HTML()+`<button class="btn sm" onclick="XK.go('twin',this)">🏙 先进入「数字孪生 / 3D 监控」菜单</button>`;
    if(/大屏|数据屏|投屏/.test(q)) return '好的，大数据屏是独立的投放端：<div class="xk-btns"><button class="btn p sm" onclick="App.go(\'screen\')">📊 打开数字中心大屏</button></div>';
    /* 跳转意图 */
    if(/跳转|打开|前往|进入|跳到|去一下|切换到|导航到/.test(q)){
      const hits=this.findMod(q);
      if(hits.length){ let s='已定位到菜单，点击即可<b>快速跳转</b>：<div class="xk-btns">'+hits.map(h=>this.jumpBtn(h)).join('')+'</div>';
        if(hits.length>1) s+='<span style="font-size:11px;color:var(--sub-l)">匹配到多个，选一个最接近的</span>';
        else s+=this.summarize(hits[0].k); return s; }
      return '没找到与「'+esc(q)+'」匹配的菜单 🙈<br>'+this.moduleHint();
    }
    /* 当前菜单讲解 */
    if(/(这|本)(个|页|菜单|界面)?(页面|菜单|模块|界面|是)|当前|这里是|现在在|能干什么|有什么内容/.test(q)) return this.curPageHTML();
    /* 模块总览 */
    if(/有哪些|全部功能|所有(模块|菜单)|菜单(结构|列表)|能管什么/.test(q)) return this.listHTML();
    /* 数据查询 */
    if(/多少|统计|有几|数量|分布|排名|待处理|紧急|总(量|额|计)/.test(q)){ const r=this.dataQA(q); if(r) return r; }
    /* 提到某模块 → 给跳转+摘要 */
    const hits=this.findMod(q);
    if(hits.length) return '您是想找「<b>'+esc(MODULES[hits[0].k].title)+'</b>」吗？<div class="xk-btns">'+hits.map(h=>this.jumpBtn(h)).join('')+'</div>'+this.summarize(hits[0].k);
    /* 兜底 */
    return '这个问题我暂时答不上来 😅（原型演示为内置知识库，未接大模型）。不过我可以：<br>· 讲解<b>当前菜单</b>'+(m?'「'+esc(m.title)+'」':'')+'<br>· <b>快速跳转</b>到任意功能（如「打开 数字孪生」）<br>· 查<b>数据分布</b>（如「有多少位长者？」）<br>· 把聊天<b>记录到笔记</b>，随时查看';
  },

  helpHTML(){
    return '我是<b>小康</b> 🌿，康养平台的智能交流助手。试试这些玩法：<br>'
      + '① <b>聊菜单</b>：「这个页面是干什么的？」<br>② <b>快跳转</b>：「打开 投诉与意见」<br>③ <b>查数据</b>：「告警分布怎么样？」<br>④ <b>记笔记</b>：「记录到笔记」→「查看我的笔记」<br>⑤ <b>多窗口</b>：点标题栏 ➕ 再开一个会话，随意拖动'
      + '<br><span style="font-size:11px;color:var(--sub-l)">支持多开 · 任意管理界面可用 · 笔记存本机浏览器</span>';
  },
  moduleHint(){
    const keys=visibleModules().slice(0,8);
    return '换个说法试试，比如：'+keys.map(k=>`<span class="xk-sug" onclick="XK.go('${k}',this)">${esc(MODULES[k].title)}</span>`).join(' ')+' …（共 '+visibleModules().length+' 个模块）';
  },

  /* ---------- 菜单匹配 ---------- */
  findMod(q){
    const QL=q.toLowerCase(), out=[];
    visibleModules().forEach(k=>{
      const m=MODULES[k]; let s=0;
      const t=(m.title||'').replace(/[（(].*$/,'').trim();
      if(QL.includes(t.toLowerCase())) s=12;
      if(!s) t.split(/[\/、  ]/).filter(x=>x.length>=2).forEach(x=>{ if(q.includes(x)) s=Math.max(s,7); });
      if(!s){ const a=this.ALIAS.find(a=>a.k===k && MODULES[a.k]); if(a) a.w.forEach(w=>{ if(QL.includes(w.toLowerCase())) s=Math.max(s,8); }); }
      if(s) out.push({k,s});
    });
    out.sort((a,b)=>b.s-a.s);
    return out.slice(0,3);
  },
  jumpBtn(h){ const m=MODULES[h.k]; return `<button class="btn ${h.s>=10?'p':''} sm" onclick="XK.go('${h.k}',this)">➡️ ${m.icon} ${esc(m.title)}</button>`; },
  go(key, btn){
    const win = btn && btn.closest ? btn.closest('.xk-win') && btn.closest('.xk-win').__xk : this.wins[this.wins.length-1];
    App.go('admin', key);
    if(win) this.push(win,'sys','已为你打开 <b>'+esc(MODULES[key].title)+'</b>');
  },

  /* ---------- 讲解与摘要 ---------- */
  curPageHTML(){
    const m=MODULES[S.mod]; if(!m) return '当前不在具体功能菜单页，打开任意左侧菜单后再问我。';
    let s=`📍 <b>${m.icon} ${esc(m.title)}</b><br>分组：${esc(m.grp)}<br>简介：${esc(m.desc||'—')}<br>`;
    if(m.tabs){ s+='本模块包含子页：'+m.tabs.map(t=>{ const p=t.split('|'); const k=p[1]||p[0]; return esc(p.length>1?p[0]:(MODULES[k]&&MODULES[k].title)||k); }).join(' / ')+'<br>'; }
    else if(m.custom){ s+='这是<b>定制可视化页</b>（非普通表格），聚合了图表、三维模型与联动操作，支持图层开关与点选。<br>'; }
    else{
      const nl=(m.cols||[]).filter(c=>!c.notbl).length;
      s+=`共 <b>${nl}</b> 个列表字段、<b>${(m.rows||[]).length}</b> 条演示数据，支持<b>检索 / 筛选 / 分页 / 新增 / 编辑 / 批量删除 / 导出 CSV</b>`;
      s+=(m.flow?`，并带流程流转（${FLOWS[m.flow].map(a=>a.t).join(' → ')}）`:'')+'。<br>'+this.dist(m);
    }
    if(!m.tabs && !m.custom){
      s+='<div class="xk-btns" style="flex-direction:row"><button class="btn sm" onclick="Crud.open(\''+S.mod+'\')">＋ 新增一条</button><button class="btn sm" onclick="App.exportCsv(\''+S.mod+'\')">⬇ 导出 CSV</button></div>';
    }
    return s;
  },
  summarize(key){
    const m=MODULES[key]; if(!m || key===S.mod) return '';
    let s=`<div style="margin-top:6px;font-size:12px;color:var(--sub)">「${esc(m.title)}」：${esc((m.desc||'').slice(0,60))}`;
    if(m.rows&&m.cols) s+='，当前 '+m.rows.length+' 条数据。'+this.dist(m);
    return s+'</div>';
  },
  dist(m){
    const c=(m.cols||[]).find(x=>x.tag&&['status','result','cook','inspect'].includes(x.k))||(m.cols||[]).find(x=>x.tag);
    if(!c||!m.rows||!m.rows.length) return '';
    const cnt={}; m.rows.forEach(r=>{ const v=r[c.k]||'—'; cnt[v]=(cnt[v]||0)+1; });
    const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,4);
    return `「${esc(c.t)}」分布：`+top.map(x=>`${esc(x[0])} <b>${x[1]}</b>`).join(' · ');
  },
  listHTML(){
    const keys=visibleModules(), g={};
    keys.forEach(k=>{ const m=MODULES[k]; (g[m.grp]=g[m.grp]||[]).push(k); });
    let s='当前角色（'+esc(S.user.role)+'）可见 <b>'+keys.length+'</b> 个模块，点名称即可跳转：<br>';
    Object.entries(g).forEach(([gn,ks])=>{
      s+='<div style="margin:5px 0 2px"><b style="color:var(--green-d)">'+esc(gn)+'</b>　'
        +ks.map(k=>`<span class="xk-sug" onclick="XK.go('${k}',this)">${MODULES[k].icon}${esc(MODULES[k].title)}</span>`).join(' ')+'</div>';
    });
    return s;
  },
  dataQA(q){
    const hits=this.findMod(q); if(!hits.length) return null;
    const k=hits[0].k, m=MODULES[k], rows=(m.rows||[]);
    if(k==='emergency' && typeof EME!=='undefined'){ EME.seed(); EME.syncCounts();
      const open = EME.openCnt();
      const byLvl = [1,2,3].map(l=>EME.list.filter(x=>x.lvl===l && !['已闭环','误报'].includes(x.status)).length);
      const hot = EM_SCENES.filter(s=>EME.scenes[s.k]&&EME.scenes[s.k].open).map(s=>esc(s.name)+' <b>'+EME.scenes[s.k].open+'</b>');
      return `🚨 <b>紧急监管</b>：当前接入 <b>${EME.list.length}</b> 条告警，待处理/处置中 <b>${open}</b> 条。<br>`
        + `一级 <b>${byLvl[0]}</b> · 二级 <b>${byLvl[1]}</b> · 三级 <b>${byLvl[2]}</b>；`
        + `紧急场景：${hot.length?hot.join(' · '):'无，园区安全运行'}。<br>`
        + `执勤 ${EM_DUTY.length} 人 · 备勤 ${EM_STANDBY.length} 人。<div class="xk-btns">${this.jumpBtn({k:'emergency',s:12})}</div>`;
    }
    let s=`📊 <b>${m.icon} ${esc(m.title)}</b>：共 <b>${rows.length}</b> 条演示数据。<br>`+this.dist(m)+'<br>';
    if(k==='order'){ const amt=rows.reduce((a,r)=>a+(+r.amount||0),0); s+='消费总金额约 <b>¥'+amt.toLocaleString()+'</b>。<br>'; }
    if(q.includes('长者')||q.includes('老人')||k==='archive'){ const lv={}; rows.forEach(r=>lv[r.level]=(lv[r.level]||0)+1); if(Object.keys(lv).length) s+='照护等级：'+Object.entries(lv).map(x=>x[0]+' <b>'+x[1]+'</b>').join(' · ')+'。<br>'; }
    s+='<div class="xk-btns">'+this.jumpBtn({k,s:12})+'</div>';
    return s;
  },
  d3HTML(){
    return `<div class="xk-btns">`+(typeof D3_VIEWS!=='undefined'?D3_VIEWS.map(v=>
      `<button class="btn ${v.cls||'p'} sm" onclick="open3D('${v.url}','${v.title}')">${v.ico} ${v.t}</button>`).join(''):'')+`</div>`;
  },

  /* ---------- 聊天 → 笔记 ---------- */
  noteAsk(btn){ const win=btn.closest('.xk-win').__xk; const r=this.doNote(win); this.push(win,'ai',r); },
  doNote(win){
    const lines=win.msgs.filter(m=>m.who!=='sys').map(m=>`[${m.ts}] ${m.who==='ai'?'小康':(S.user?S.user.name:'我')}：${this.strip(m.html)}`).filter(x=>x.length>16);
    if(!lines.length) return '当前会话还没有实质内容，先聊两句再保存吧 🙂';
    const first=win.msgs.find(m=>m.who==='me'), m=MODULES[S.mod];
    const title=(first?this.strip(first.html):(m?m.title:'会话')).slice(0,26);
    const note={ id:Date.now(), t:now(), mod:m?m.title:'—', title, lines };
    this.notes.unshift(note); this.saveNotes();
    logAct('小康助手','保存会话笔记「'+title+'」','低');
    return `📝 已把本次会话（<b>${lines.length}</b> 条消息）记入笔记：<b>「${esc(title)}」</b><div class="xk-btns"><button class="btn p sm" onclick="XK.showNotes()">📚 查看我的笔记</button></div>`;
  },
  showNotes(){
    const body=this.notes.length ? this.notes.map(n=>`<details class="xk-note"><summary>${esc(n.title)} <span style="font-weight:400;font-size:11px;color:var(--sub)">· ${esc(n.mod)} · ${esc(n.t)} · ${n.lines.length} 条</span></summary>`
      +n.lines.map(l=>`<div class="ln">${esc(l)}</div>`).join('')
      +`<div style="margin-top:8px;display:flex;gap:8px"><button class="btn sm" onclick="XK.copyNote(${n.id})">📋 复制全文</button><button class="btn sm dg" onclick="XK.delNote(${n.id})">🗑 删除</button></div></details>`).join('')
      : '<div class="empty" style="padding:30px">暂无笔记，先在会话里说「记录到笔记」吧</div>';
    Modal.open('📚 小康 · 会话笔记（'+this.notes.length+'）',
      '<div style="font-size:12px;color:var(--sub);margin-bottom:10px">按会话保存，支持展开查看 · 复制 · 删除；笔记存放在本机浏览器 localStorage，刷新不丢失。</div>'+body,
      '<button class="btn" onclick="Modal.close()">关闭</button>');
  },
  copyNote(id){
    const n=this.notes.find(x=>x.id===id); if(!n) return;
    const txt=n.title+'\n'+n.lines.join('\n');
    const fb=()=>{ const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('笔记已复制到剪贴板','ok'); };
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast('笔记已复制到剪贴板','ok')).catch(fb); else fb();
    logAct('小康助手','复制笔记「'+n.title+'」','低');
  },
  delNote(id){ this.notes=this.notes.filter(x=>x.id!==id); this.saveNotes(); this.showNotes(); toast('笔记已删除'); },
  saveNotes(){ try{ localStorage.setItem(this.NKEY, JSON.stringify(this.notes)); }catch(e){} },
  loadNotes(){ try{ this.notes=JSON.parse(localStorage.getItem(this.NKEY)||'[]'); }catch(e){ this.notes=[]; } },
  strip(h){ const d=document.createElement('div'); d.innerHTML=String(h).replace(/<button[\s\S]*?<\/button>/g,''); return (d.textContent||'').replace(/\s+/g,' ').trim(); }
};

/* ---------- 挂载并包装 route（主脚本之后执行，路由每次变化同步小康状态） ---------- */
(function(){
  const _xkRoute = route;
  route = function(){ _xkRoute.apply(this, arguments); try{ XK.sync(); }catch(e){} };
  if(document.readyState==='loading') addEventListener('DOMContentLoaded', ()=>XK.mount()); else XK.mount();
  if(S.user) XK.sync();
})();
