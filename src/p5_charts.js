/* ============================================================
 *  Layer 3 : 可视化 —— 驾驶舱 / 数字孪生 / 报表 / 实时监测 / 大数据屏
 * ============================================================ */
function renderTable(key){
  const m = MODULES[key];
  $('crumb').innerHTML = `首页 / ${esc(m.grp)} / <b>${esc(m.title)}</b>`;
  const kpi = moduleKpi(key);
  $('page').innerHTML = `<div class="page-h"><div><h2>${m.icon} ${esc(m.title)}</h2><p>${esc(m.desc||'')}</p></div>
    <div class="acts"><button class="btn" onclick="App.go('screen')">📊 大屏</button><button class="btn" onclick="Crud.open('${key}')">＋ 新增</button><button class="btn" onclick="App.exportCsv('${key}')">⬇ 导出</button></div></div>
    ${kpi}<div class="card">${tableHTML(key, m)}</div>`;
  afterCharts(key, m);
}
function moduleKpi(key){
  const rows = MODULES[key].rows||[]; if(!rows.length) return '';
  const stat = MODULES[key].kpi || defaultKpi(key, rows);
  if(!stat.length) return '';
  return `<div class="kpis">${stat.map(s=>`<div class="kpi"><i><span class="e">${s[3]||'📊'}</span>${esc(s[0])}</i><b>${esc(s[1])}</b><span>${esc(s[2])}</span></div>`).join('')}</div>`;
}
function defaultKpi(key, rows){
  const cnt = f => rows.filter(f).length;
  const st = (k) => { const m={}; rows.forEach(r=>{ const v=r[k]||'—'; m[v]=(m[v]||0)+1 }); return m; };
  const out = [['总记录数', rows.length, '当前模块全量数据','📋']];
  if(key==='archive'){ out.push(['在院长者', cnt(r=>r.status==='在院'),'占比 '+Math.round(cnt(r=>r.status==='在院')/rows.length*100)+'%','🛏'],['需专护/失能', cnt(r=>['失能','专护'].includes(r.level)),'重点关注','⚕️'],['高健康风险', (MODULES.health.rows||[]).filter(h=>h.risk==='高').length,'来自体征与评估','❤️']); }
  else if(key==='leave'){ const s=st('status'); out.push(['待审批', s['待审批']||0,'需及时处理','⏳'],['外出中', s['外出中']||0,'定位与归期跟踪','🚶'],['逾期', s['逾期']||0,'已自动告警','🚨']); }
  else if(key==='complaint'){ const s=st('status'); out.push(['待受理', s['待受理']||0,'24h 内响应','⏳'],['处理中', s['处理中']||0,'含升级督办','🔧'],['已闭环', s['已闭环']||0,'闭环率 '+Math.round((s['已闭环']||0)/rows.length*100)+'%','✅']); }
  else if(key==='activity'){ out.push(['报名中', cnt(r=>r.status==='报名中'),'开放报名','🎟'],['总报名', rows.reduce((s,r)=>s+(+r.signed||0),0),'人次','👥'],['进行中', cnt(r=>r.status==='进行中'),'现场签到中','🎪']); }
  else if(key==='device'){ out.push(['在线', cnt(r=>r.online==='在线'),'在线率 '+Math.round(cnt(r=>r.online==='在线')/rows.length*100)+'%','🟢'],['离线/故障', cnt(r=>['离线','故障'].includes(r.online)),'需运维介入','🔌'],['低电量', cnt(r=>+r.batt<50&&r.batt!==100),'建议本周更换','🔋']); }
  else if(key==='devalarm'){ const s=st('status'); out.push(['待处置', s['待处置']||0,'I 级需 3 分钟响应','🚨'],['处置中', s['处置中']||0,'值班跟进中','🧰'],['已闭环', s['已闭环']||0,'含误报复盘','✅']); }
  else if(key==='order'){ out.push(['订单金额', '¥'+rows.reduce((s,r)=>s+(+r.amount||0),0).toLocaleString(),'含待支付','💰'],['已核销', cnt(r=>r.status==='已核销'),'核销率 '+Math.round(cnt(r=>r.status==='已核销')/rows.length*100)+'%','✅'],['代付占比', '62%','子女代付/联合支付','👪']); }
  else if(key==='member'){ out.push(['会员总数', rows.length,'含钻石/金卡','💳'],['钻石会员', cnt(r=>r.lv==='钻石会员'),'高价值客户','💎'],['待续费', cnt(r=>r.status==='待续费'),'需运营触达','⏰']); }
  else if(key==='fraud'){ out.push(['本月事件', rows.length,'含拦截与关注','🛡'],['成功拦截', cnt(r=>['成功拦截','未遂'].includes(r.result)),'止损 ¥'+rows.filter(r=>r.result==='已止损').reduce((s,r)=>s+(+r.amount||0),0).toLocaleString(),'✅'],['关注中', cnt(r=>r.result==='关注中'),'需关怀跟进','❤️']); }
  else if(key==='psych'){ out.push(['中重度风险', cnt(r=>['中度','重度'].includes(r.risk)),'需干预/转介','🧠'],['待干预', cnt(r=>r.status==='待干预'),'24h 内响应','⏳'],['需转介', cnt(r=>r.status==='需转介'),'联动医护','🏥']); }
  else if(key==='clean'){ out.push(['待执行', cnt(r=>r.status==='待执行'),'按排期推进','🧹'],['待整改', cnt(r=>r.inspect==='待整改'),'闭环整改','⚠️'],['完成率', Math.round(cnt(r=>r.status==='已完成')/rows.length*100)+'%','本周累计','✅']); }
  else if(key==='booking'){ const s=st('status'); out.push(['待确认', s['待确认']||0,'资源冲突校验','⏳'],['已完成', s['已完成']||0,'体验评价','✅'],['高意向线索', cnt(r=>r.lead==='高意向'),'衔接消费转化','']); }
  else if(key==='circle'){ out.push(['动态数', rows.length,'含待审核','🌈'],['待审核', cnt(r=>r.status==='待审核'),'内容合规','🔍'],['总互动', rows.reduce((s,r)=>s+(+r.likes||0)+(+(r.cmts||0)),0),'点赞+评论','💬']); }
  else { const s=st('status'); const top=Object.keys(s).sort((a,b)=>s[b]-s[a])[0]; if(top) out.push([top, s[top],'按状态统计','📈']); out.push(['今日更新', cnt(r=>String(r.date||r.time||'').slice(0,10)===today()),'当日新增/变更','🕒'],['数据量', rows.length,'条记录','🗄']); }
  return out.slice(0,4);
}
function afterCharts(){}

/* ---------- ECharts 工具 ---------- */
const CHARTS = {};
const PALETTE = ['#1668dc','#00b578','#22d3c5','#4aa8ff','#7c5cff','#f5a623','#e5484d','#0d8f66'];
function ec(id, opt, dark){
  const el = $(id); if(!el) return;
  if(!window.echarts){ el.innerHTML = '<div class="noech">⚠ ECharts 在线资源未加载（需联网）。图表区域已占位，其余功能不受影响。</div>'; return; }
  if(CHARTS[id]){ CHARTS[id].dispose(); }
  const c = echarts.init(el, dark?'dark':null, {renderer:'canvas'});
  if(dark){ opt.backgroundColor='transparent'; opt.color = opt.color||['#4aa8ff','#5ce0b0','#22d3c5','#ffb347','#7c5cff','#ff6b6b']; opt.textStyle = Object.assign({color:'#bfe0ff'}, opt.textStyle); }
  c.setOption(opt); CHARTS[id]=c; return c;
}
window.addEventListener('resize', ()=>Object.values(CHARTS).forEach(c=>{ try{c.resize()}catch(e){} }));
function axisBase(dark){ const col = dark?'rgba(159,212,255,.35)':'#8a99ad'; return { axisLine:{lineStyle:{color:dark?'rgba(74,168,255,.35)':'#dfe6ef'}}, axisLabel:{color:col, fontSize:11}, axisTick:{show:false}, splitLine:{lineStyle:{color:dark?'rgba(74,168,255,.12)':'#eef2f7'}} }; }

/* ---------- 园区孪生地图 ---------- */
function parkHTML(host, opts){
  const o = opts||{};
  const devs = MODULES.device.rows;
  const zonePos = { '康养区 A 栋':{l:'6%',t:'10%',w:'26%',h:'38%'}, '康养区 B 栋':{l:'6%',t:'52%',w:'26%',h:'38%'}, '康养区 C 栋':{l:'34%',t:'10%',w:'24%',h:'40%'}, '文化区':{l:'34%',t:'54%',w:'24%',h:'36%'}, '旅游区 旅居客房':{l:'60%',t:'10%',w:'36%',h:'38%'}, '公共/走廊':{l:'60%',t:'52%',w:'17%',h:'38%'}, '营养餐厅':{l:'79%',t:'52%',w:'17%',h:'38%'} };
  let h = `<svg viewBox="0 0 800 400" preserveAspectRatio="none">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f3f7d" stop-opacity=".5"/><stop offset="1" stop-color="#0b6b57" stop-opacity=".4"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)"/></pattern></defs>
    <rect width="800" height="400" fill="url(#grid)"/>
    <path d="M0 300 Q200 250 380 300 T800 270" fill="none" stroke="rgba(92,224,176,.35)" stroke-width="2" stroke-dasharray="6 6"/>
    <path d="M120 0 L160 400" stroke="rgba(74,168,255,.25)" stroke-width="14" fill="none"/>
    <ellipse cx="700" cy="120" rx="70" ry="34" fill="url(#pg)" stroke="rgba(74,168,255,.4)"/>
    <text x="700" y="124" fill="rgba(191,224,255,.6)" font-size="12" text-anchor="middle">镜湖</text>
    <text x="30" y="392" fill="rgba(191,224,255,.45)" font-size="11">园区 3D 底图 · 旅游区 / 康养区 / 文化区三大分区 · 点击设备点查看实时数据与视频联动</text>
  </svg>`;
  Object.keys(zonePos).forEach(z=>{ const p=zonePos[z]; const n=devs.filter(d=>d.zone===z).length;
    h += `<div class="zone" style="left:${p.l};top:${p.t};width:${p.w};height:${p.h}"><b>${z}</b>${n} 台设备 · ${o.zoneP?o.zoneP(z):''}</div>`; });
  const cats = { '智能手环':{c:'b',ic:'⌚'}, '摄像头':{c:'',ic:'📹'}, '门禁':{c:'',ic:'🚪'}, '温湿度传感器':{c:'b',ic:'🌡'}, '加湿器':{c:'b',ic:'💧'}, '空调/新风':{c:'b',ic:'❄'}, '照明':{c:'b',ic:'💡'}, '床垫监测':{c:'',ic:'🛏'}, '紧急呼叫按钮':{c:'al',ic:'🆘'}, '烟感报警':{c:'al',ic:'🔥'}, '人脸识别终端':{c:'',ic:'🙂'}, '智能体测设备':{c:'b',ic:'🏋'}, '运动手环':{c:'b',ic:'⌚'}, '智能插座':{c:'b',ic:'🔌'} };
  devs.forEach((d,i)=>{ const zp = zonePos[d.zone]||{l:'40%',t:'40%',w:'20%',h:'20%'};
    const col = i%4, row = Math.floor(i/4)%4;
    const left = parseFloat(zp.l)+4+col*(parseFloat(zp.w)/4.4), top = parseFloat(zp.t)+16+row*16;
    const al = ['离线','故障'].includes(d.online);
    h += `<div class="pmark ${al?'al':(cats[d.cate]||{c:''}).c}" style="left:${left}%;top:${top}%" onclick="parkTip(event,${d._id})" title="${esc(d.name)}"><i></i></div>`; });
  h += `<div class="legend"><div><em style="background:#00b578"></em>正常在线</div><div><em style="background:#4aa8ff"></em>环控/穿戴设备</div><div><em style="background:#e5484d"></em>离线 / 故障（告警）</div></div>`;
  const el=$(host); if(el){ el.innerHTML = h; }
}
function parkTip(e, id){
  e.stopPropagation();
  const d = MODULES.device.rows.find(x=>x._id===id); if(!d) return;
  const al = MODULES.devalarm.rows.filter(a=>a.dev===d.no).slice(0,3);
  Modal.open(`📡 ${esc(d.name)} · 孪生点位`, `<div class="dinfo">
    ${[['no','设备编号'],['cate','类别'],['zone','区域'],['pos','位置'],['fw','固件'],['batt','电量(%)'],['online','状态'],['bind','绑定对象'],['last','最近上报']].map(p=>`<div><label>${p[1]}</label>${esc(d[p[0]]||'—')}</div>`).join('')}</div>
    <div class="card-h" style="padding:14px 0 8px"><h3>实时读数（模拟）</h3></div>
    <div class="sw-box">${liveReadings(d).map(r=>`<div class="ck"><b>${r[0]}</b><p>${r[1]}</p></div>`).join('')}</div>
    <div class="card-h" style="padding:14px 0 8px"><h3>视频与联动</h3></div>
    <div class="park" style="height:150px;background:linear-gradient(150deg,#08203a,#0b2f3a)">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;color:rgba(191,224,255,.8);font-size:12.5px;gap:6px">
        <div style="font-size:34px">📹</div>CAM-${esc(d.zone.slice(0,3))} 画面联动 · AI 抓拍已开启</div>
      <div style="position:absolute;left:10px;top:8px;font-size:11px;color:#5ce0b0">● LIVE ${today()} 21:0${Math.floor(Math.random()*9)}</div></div>
    ${al.length?`<div class="card-h" style="padding:14px 0 8px"><h3>关联告警</h3></div><ul class="lst">${al.map(a=>`<li><span class="ic r">🚨</span><div><b>${esc(a.kind)} · ${esc(a.level)}</b><p>${esc(a.obj)} · ${esc(a.value)}</p></div><span class="tm">${esc(a.time)}</span></li>`).join('')}</ul>`:''}`,
    `<button class="btn" onclick="Modal.close()">关闭</button><button class="btn" onclick="Modal.close();S.kw.device='${d.no}';App.go('admin','iot')">设备详情</button><button class="btn p" onclick="Modal.close();S.tab.iot='deviceops';App.go('admin','iot');Crud.open('deviceops')">派发工单</button>`, true);
}
function liveReadings(d){
  const rnd=(a,b)=>Math.round(a+Math.random()*(b-a));
  const map = { '智能手环':[['心率',rnd(62,96)+' bpm'],['血氧',rnd(93,99)+' %'],['步数',rnd(1200,9800)+' 步'],['定位',d.zone]],
    '运动手环':[['心率',rnd(88,126)+' bpm'],['运动时长',rnd(12,48)+' min'],['步频',rnd(80,120)+'/min']],
    '温湿度传感器':[['温度',(18+Math.random()*8).toFixed(1)+' ℃'],['湿度',rnd(32,62)+' %RH'],['PM2.5',rnd(12,45)+' µg/m³']],
    '加湿器':[['运行状态','加湿中'],['目标湿度','50 %RH'],['水箱','充足']],
    '空调/新风':[['送风温度',rnd(20,26)+' ℃'],['模式','制冷/自动'],['滤网',rnd(60,96)+'% 寿命']],
    '照明':[['照度',rnd(80,320)+' lx'],['开关','开（感应）'],['能耗',rnd(4,18)+' W']],
    '门禁':[['今日通行',rnd(40,320)+' 次'],['状态','正常布防'],['异常',rnd(0,3)+' 次']],
    '摄像头':[['码流',rnd(2,8)+' Mbps'],['AI 分析','跌倒/闯入'],['录像','连续 90 天']],
    '床垫监测':[['离床状态',Math.random()>.5?'在床':'离床'],['心率',rnd(52,72)+' bpm'],['睡眠评分',rnd(72,94)]],
    '紧急呼叫按钮':[['线路自检','正常'],['最近呼叫','无'],['电池',d.batt+'%']],
    '烟感报警':[['烟雾浓度',(Math.random()*3).toFixed(1)+' %obs/m'],['温度',rnd(20,30)+' ℃'],['联动','新风+告警']],
    '人脸识别终端':[['今日识别',rnd(80,420)+' 次'],['通过率',rnd(96,99.9).toFixed(1)+'%'],['库容','1,200 人']],
    '智能体测设备':[['今日体测',rnd(6,28)+' 人'],['校准状态','正常'],['版本','v2.2.1']],
    '智能插座':[['功率',rnd(20,600)+' W'],['今日电量',rnd(1,12)+' kWh'],['异常','无']] };
  return map[d.cate] || [['状态',d.online],['最近上报',d.last]];
}

/* ---------- 自定义页面：驾驶舱 ---------- */
const CUSTOM = {
  dashboard(key){
    const m = MODULES[key];
    $('crumb').innerHTML = `首页 / 园区总览 / <b>${esc(m.title)}</b>`;
    const devs = MODULES.device.rows, on = devs.filter(d=>d.online==='在线').length;
    const orders = MODULES.order.rows.reduce((s,r)=>s+(+r.amount||0),0);
    const kpi = [
      ['🛏','在住长者','118','床位 156 · 入住率 75.6%','<u>↑ 4</u> 本月新增'],
      ['🎪','今日活动','6','报名 236 人次 · 签到率 92%','<u>进行中 1</u>'],
      ['📅','今日预约','12','到访核销 8 · 转化线索 3','<u>待确认 2</u>'],
      ['💰','本月消费','¥'+(orders*18).toLocaleString(),'储值/代付占比 62%','<u>↑ 12.4%</u>'],
      ['🚨','待处置告警',MODULES.devalarm.rows.filter(r=>r.status==='待处置').length,'I 级 '+MODULES.devalarm.rows.filter(r=>r.status==='待处置'&&r.level.includes('I')).length+' 条','<dn>需 3 分钟响应</dn>'],
      ['📡','设备在线率',Math.round(on/devs.length*100)+'%',on+' / '+devs.length+' 台','离线 <dn>'+devs.filter(d=>d.online==='离线').length+'</dn> 台'],
      ['⚠️','投诉待处理',MODULES.complaint.rows.filter(r=>['待受理','已升级督办'].includes(r.status)).length,'本月闭环率 87%','督办 <dn>1</dn>'],
      ['❤️','高健康风险',MODULES.health.rows.filter(h=>h.risk==='高').length,'需医护干预 · 已联动','<u>值班已通知</u>']
    ];
    $('page').innerHTML = `<div class="page-h"><div><h2>🛰 数字中心驾驶舱</h2><p>${esc(m.desc)}　·　当前视角：${esc(S.user.role)}　·　数据每 6 秒模拟刷新</p></div>
      <div class="acts"><div class="seg" id="dashView"><button class="on" data-v="biz">经营看板</button><button data-v="twin">数字孪生</button><button data-v="nav3">3D 导航监控</button></div>
      <button class="btn" onclick="App.go('screen')">🖥 投放大屏</button><button class="btn p" onclick="App.go('admin','reports')">📑 报表中心</button></div></div>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">${kpi.slice(0,4).map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]} · ${k[4]}</span></div>`).join('')}</div>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">${kpi.slice(4).map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]} · ${k[4]}</span></div>`).join('')}</div>
      <div id="dashBody"></div>`;
    $('dashView').onclick = e => { const b=e.target.closest('button'); if(!b) return; [...$('dashView').children].forEach(x=>x.classList.remove('on')); b.classList.add('on'); dashView(b.dataset.v); };
    dashView('biz');
  },
  twin(key){
    const m=MODULES[key];
    $('crumb').innerHTML = `首页 / 园区总览 / <b>${esc(m.title)}</b>`;
    $('page').innerHTML = `<div class="page-h"><div><h2>🏙 数字孪生与 3D 导航监控</h2><p>${esc(m.desc)}</p></div>
      <div class="acts"><div class="seg" id="layers"><button class="on" data-l="dev">设备层</button><button class="on" data-l="al">告警层</button><button data-l="per">人员层</button><button data-l="ene">能耗层</button></div>
      <button class="btn" onclick="App.go('screen')">全屏模式</button></div></div>
      <div class="bar2"><div class="card"><div class="card-h"><h3>园区三维模型（孪生视图）</h3><span class="tiny">分块加载 · 支持点选与图层开关</span></div>
      <div class="card-b"><div class="park" id="twinPark" style="height:460px"></div>
      <div class="sw-box" style="margin-top:12px">${[['建筑图层','3 大分区 · 12 栋'],['设备图层',MODULES.device.rows.length+' 台已映射'],['人员图层','在住 118 · 员工 42'],['告警图层',MODULES.devalarm.rows.filter(a=>a.status!=='已闭环').length+' 条未闭环'],['时间回溯','支持 7 日回放'],['推演模拟','客流/能耗预测']].map(x=>`<div class="ck"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>
      <div style="margin-top:12px">${d3Btns()}</div></div></div>
      <div><div class="card"><div class="card-h"><h3>3D 导航与路线指引</h3></div><div class="card-b">
        <div class="field"><label>目的地检索</label><input class="inp" id="navTo" value="康复理疗室 2（康养区 B 栋）"></div>
        <div id="navPath" style="display:flex;flex-direction:column;gap:9px"></div>
        <div style="height:12px"></div><button class="btn g blk" onclick="navRoute()">🧭 生成导航路线并推送长者端</button></div></div>
      <div class="card"><div class="card-h"><h3>视频联动墙</h3><span class="tiny">告警自动弹窗</span></div><div class="card-b"><div class="grid3" style="gap:10px" id="vidWall"></div></div></div>
      </div></div>`;
    parkHTML('twinPark');
    $('layers').onclick = e => { const b=e.target.closest('button'); if(!b) return; b.classList.toggle('on'); toast(`图层「${b.textContent}」已${b.classList.contains('on')?'开启':'关闭'}`); };
    navRoute();
    $('vidWall').innerHTML = ['A 栋大堂','3F 走廊','理疗室','书画室','营养餐厅','周界东段'].map((n,i)=>`<div style="position:relative;height:96px;border-radius:10px;background:linear-gradient(150deg,#08203a,#0b2f3a);border:1px solid var(--line);overflow:hidden">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;opacity:.55">📹</div>
      <div style="position:absolute;left:6px;top:5px;font-size:10.5px;color:#cfe6ff">${n}</div>
      <div style="position:absolute;right:6px;top:5px;font-size:10px;color:${i===1?'#ff8a8a':'#5ce0b0'}">● ${i===1?'ALARM':'LIVE'}</div></div>`).join('');
  },
  reports(key){
    const m=MODULES[key];
    $('crumb').innerHTML = `首页 / 园区总览 / <b>${esc(m.title)}</b>`;
    $('page').innerHTML = `<div class="page-h"><div><h2>📑 数据统计与报表</h2><p>${esc(m.desc)}</p></div>
      <div class="acts"><select class="sel" style="width:130px" onchange="toast('报表口径已切换：'+this.value)"><option>近 30 日</option><option>本月</option><option>本季度</option><option>本年度</option></select>
      <select class="sel" style="width:130px"><option>全园区</option><option>康养区</option><option>文化区</option><option>旅游区</option></select>
      <button class="btn" onclick="App.exportCsv('order')">⬇ 导出明细</button><button class="btn p" onclick="toast('报表已生成并发送至邮箱（演示）','ok')">📧 订阅报表</button></div></div>
      <div class="kpis"><div class="kpi"><i><span class="e">💰</span>营业总收入</i><b>¥ 268.4 万</b><span>环比 <u>↑ 12.4%</u> · 目标完成 82%</span></div>
      <div class="kpi"><i><span class="e">🛏</span>平均入住率</i><b>75.6%</b><span>床位 156 · 空置 38</span></div>
      <div class="kpi"><i><span class="e">🎯</span>体验转化率</i><b>31.8%</b><span>到访 126 → 签约 40</span></div>
      <div class="kpi"><i><span class="e">😊</span>服务满意度</i><b>4.72 / 5</b><span>投诉闭环率 87%</span></div></div>
      <div class="bar2"><div class="card"><div class="card-h"><h3>经营与消费趋势</h3><span class="tiny">收入 / 入住 / 转化</span></div><div class="card-b"><div id="r1" class="chart lg"></div></div></div>
      <div class="card"><div class="card-h"><h3>服务量构成</h3><span class="tiny">按模块</span></div><div class="card-b"><div id="r2" class="chart lg"></div></div></div></div>
      <div class="twin" style="margin-top:16px"><div class="card"><div class="card-h"><h3>长者结构与照护等级</h3></div><div class="card-b"><div id="r3" class="chart"></div></div></div>
      <div class="card"><div class="card-h"><h3>安全与设备指标</h3></div><div class="card-b"><div id="r4" class="chart"></div></div></div></div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>多维汇总表（可切换维度）</h3><div class="seg" id="rseg"><button class="on" data-d="zone">按区域</button><button data-d="pkg">按套餐</button><button data-d="level">按健康等级</button></div></div>
      <div id="rtable"></div></div>`;
    drawReports('zone');
    $('rseg').onclick = e=>{ const b=e.target.closest('button'); if(!b) return; [...$('rseg').children].forEach(x=>x.classList.remove('on')); b.classList.add('on'); drawReports(b.dataset.d); };
  },
  monitor(key){
    const m=MODULES[key];
    $('crumb').innerHTML = `首页 / 设备安防 / <b>${esc(m.title)}</b>`;
    const live = MODULES.device.rows.filter(d=>['智能手环','温湿度传感器','床垫监测','空调/新风','加湿器'].includes(d.cate)).slice(0,8);
    $('page').innerHTML = `<div class="page-h"><div><h2>📈 设备实时监测</h2><p>${esc(m.desc)}　·　刷新间隔 3 秒（模拟 ≤5s 延迟要求）</p></div>
      <div class="acts"><span class="tag green"><span class="dot on"></span>数据流正常</span><button class="btn" onclick="renderPage()">↻ 手动刷新</button></div></div>
      <div class="kpis">${live.slice(0,4).map(d=>{const r=liveReadings(d)[0];return `<div class="kpi"><i><span class="e">${d.cate.slice(0,2)}</span>${esc(d.name)}</i><b>${esc(r[1])}</b><span>${esc(d.zone)} ${esc(d.pos)} · ${esc(d.online)}</span></div>`}).join('')}</div>
      <div class="bar2"><div class="card"><div class="card-h"><h3>手环体征曲线（徐世昌 / 孙德福）</h3><span class="tiny">近 12 小时</span></div><div class="card-b"><div id="mo1" class="chart lg"></div></div></div>
      <div class="card"><div class="card-h"><h3>环控数据（温湿度 / 湿度阈值）</h3></div><div class="card-b"><div id="mo2" class="chart lg"></div></div></div></div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>设备实时读数</h3><span class="tiny">点击卡片可查看联动与视频</span></div>
      <div class="card-b"><div class="sw-box">${live.map(d=>`<div class="ck" style="cursor:pointer" onclick="parkTip(event,${d._id})"><b><span class="dot ${d.online==='在线'?'on':'al'}"></span>${esc(d.name)}</b><p>${liveReadings(d).map(r=>esc(r[0]+' '+r[1])).join('　')}</p></div>`).join('')}</div></div></div>`;
    drawMonitor();
  },
  emergency(key){
    const m = MODULES[key];
    $('crumb').innerHTML = `首页 / 园区总览 / <b>${esc(m.title)}</b>`;
    EME.seed();
    emEnsureWin().innerHTML = `<div class="page-h"><div><h2>🚨 紧急监管</h2><p>${esc(m.desc)}　·　一级 3 分钟升级 / 二级 15 分钟升级 / 三级按工单时效</p></div>
      <div class="acts"><span class="tag red"><span class="dot" style="background:#ff6b6b"></span>实时接收中</span>
      <button class="btn" onclick="emRules()">📜 三级响应规则</button><button class="btn" onclick="EME.spawn(true)">⚡ 模拟一条新告警</button></div></div>
    <div class="em3">
      <div class="card"><div class="card-h"><h3>场景安全状态</h3><span class="tiny">🟢 安全 · 🔴 紧急</span></div><div class="card-b" id="emScenes" style="max-height:660px;overflow:auto;padding:12px 12px"></div></div>
      <div>
        <div class="em-kpis" id="emKpi"></div>
        <div class="card"><div class="card-h"><h3>园区实时扫描雷达</h3><span class="tiny" id="emRadarTip">正常巡逻</span></div>
          <div class="card-b" style="display:flex;justify-content:center;padding:8px"><canvas id="emRadar" width="360" height="360"></canvas></div></div>
        <div class="card" style="margin-top:12px"><div class="card-h"><h3>备勤人员 · 快速通话</h3><span class="tiny">点击 📞 立即呼叫</span></div><div class="card-b" id="emStandby" style="padding:10px 14px"></div></div>
      </div>
      <div class="card"><div class="card-h"><h3>实时紧急信息</h3><span class="tiny">最新在上 · 自动滚动</span></div><div class="card-b"><div id="emFeed" class="em-feed"></div></div></div>
    </div>`;
    $('emStandby').innerHTML = EM_STANDBY.map(s=>`<div class="em-pw"><div class="av">🛡</div><div style="flex:1"><b>${esc(s.name)}</b><div class="tiny">${esc(s.role)} · ${esc(s.phone)}</div></div>
      <button class="btn sm g" onclick="emCall('${esc(s.name)}','${esc(s.role)}','${esc(s.phone)}')">📞 通话</button></div>`).join('')
      + `<div class="tiny" style="margin-top:8px">执勤 ${EM_DUTY.length} 人（安保中控室 24h 在岗）：${EM_DUTY.map(d=>esc(d.name)).join(' / ')}</div>`;
    EME.start();
  }
};

/* ============================================================
 *  紧急监管 · 三级响应实时引擎（纯前端模拟，无后端）
 * ============================================================ */
/* ---------- 紧急监管 · 全屏值守窗口（Web 端专用，独立弹层展示，可关闭返回菜单） ---------- */
function emEnsureWin(){
  let w = $('emWin');
  if(!w){
    w = document.createElement('div'); w.id = 'emWin'; w.className = 'em-win';
    w.innerHTML = `<div class="bar"><div class="bt"><b>🚨 紧急监管 · 全屏实时值守台</b><span class="tip">独立窗口 · 实时接警 · 三级响应快速处置</span></div>`
      + `<button class="btn" onclick="emCloseWin()">✕ 关闭窗口</button></div>`
      + `<div class="body" id="emWinBody"></div>`;
    document.body.appendChild(w);
  }
  w.classList.add('on');
  document.body.style.overflow = 'hidden';
  return $('emWinBody');
}
function emHideWin(){ const w=$('emWin'); if(w) w.classList.remove('on'); document.body.style.overflow=''; if(typeof EME!=='undefined') EME.stop(); }
function emCloseWin(){
  const w = $('emWin'); if(!w || !w.classList.contains('on')) return;
  emHideWin();
  const back = (S._emBack && S._emBack!=='emergency') ? S._emBack : 'dashboard';
  App.go('admin', back);
  toast('已关闭紧急监管全屏窗口，返回菜单页','ok');
}

function emRules(){
  Modal.open('📜 紧急监管 · 三级响应规则', `<div class="tbwrap"><table class="tb"><thead><tr><th>级别</th><th>触发场景</th><th>第一接警</th><th>主处置</th><th>升级</th></tr></thead><tbody>`+
    EM_RULES.map(r=>`<tr><td data-k="级别"><span class="tag ${r.color}">${esc(r.lvl)}</span></td><td data-k="触发场景">${esc(r.scenes)}</td><td data-k="第一接警">${esc(r.first)}</td><td data-k="主处置">${esc(r.main)}</td><td data-k="升级时限">${esc(r.esc)}</td></tr>`).join('')+
    `</tbody></table></div><div class="tiny" style="margin-top:10px">一级（紧急）由安保中控室第一接警，医护部 + 护理/管家主处置，3 分钟未确认升级院长/值班领导，必要时拨 120；二级 15 分钟未处理升级部门主管；三级由 IoT 后台自动派单，按工单时效升级。</div>`,
    `<button class="btn" onclick="Modal.close()">关闭</button>`);
}
function emCall(name, role, phone){
  Modal.open('📞 快速通话 · '+esc(name), `<div class="em-pw" style="border:0;padding:0 0 12px"><div class="av" style="width:46px;height:46px;font-size:22px">🛡</div>
    <div style="flex:1"><b style="font-size:15px">${esc(name)}</b><div class="tiny">${esc(role)} · ${esc(phone)}</div></div>
    <span class="tag green" id="emCallSt">呼叫中…</span></div>
    <div class="tiny">通话经由安保中控室总机转接（演示）　·　<span id="emCallTm">00:00</span></div>`,
    `<button class="btn" onclick="clearInterval(window.__emCall);Modal.close()">挂断</button>`);
  clearInterval(window.__emCall); let s=0;
  const tick=()=>{ const n=$('emCallTm'); if(!n){ clearInterval(window.__emCall); return; }
    s++; n.textContent = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    if(s===3){ const st=$('emCallSt'); if(st){ st.textContent='已接通'; st.className='tag blue'; } toast(`已接通 ${name}（${role}）`,'ok'); } };
  tick(); window.__emCall = setInterval(tick, 1000);
  logAct('紧急监管 · 快速通话', name+' / '+role, '中');
}
const EME = {
  list:[], timers:null, seq:0, scenes:{}, raf:null, angle:0, fly:[],
  seed(){
    if(this._seeded) { this.syncCounts(); return; }
    this._seeded = true;
    EM_SCENES.forEach(s=>{ this.scenes[s.k] = { n: 3 + Math.floor(Math.random()*26), open:0 }; });
    /* 预置一批历史告警：一级 2 条（含 1 条已闭环）、二级 3 条、三级 3 条，覆盖各状态便于演示 */
    const plan = [[0,2,'open'],[1,6,'open'],[2,11,'open'],[4,4,'open'],[5,9,'open'],[6,18,'done'],[7,7,'open'],[8,26,'open'],[3,3,'false'],[9,14,'done']];
    const ar = MODULES.archive.rows;
    plan.forEach((x,i)=>{ const sc = EM_SCENES[x[0]], a = ar[i%ar.length];
      const obj = i%2 ? (a.name+' · '+a.room) : sc.place[i%sc.place.length];
      const it = this._mk(sc, obj, '历史采集越限', x[2], x[1]);
      if(x[2]==='done'){ it.owner = EM_DUTY[i%EM_DUTY.length].name; it.result = '现场处置完毕，已回访长者与家属'; }
      this.list.push(it); });
    this.syncCounts();
  },
  /* 同步各场景未闭环数量 */
  syncCounts(){ EM_SCENES.forEach(s=>{ const st=this.scenes[s.k]; if(!st) return; st.open = this.list.filter(x=>x.scene===s.k && !['已闭环','误报'].includes(x.status)).length; }); },
  _mk(sc, obj, val, st, ago){
    const d = new Date(Date.now()-(ago||0)*60000), p = n=>String(n).padStart(2,'0');
    return { id:++this.seq, lvl:sc.lvl, scene:sc.k, ico:sc.ico, kind:sc.name, obj:obj||sc.place[0], val:val||'—',
      rule: EM_RULES[sc.lvl-1].esc,
      time: d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes()),
      ts: d.getTime(), status: st==='done'?'已闭环':st==='false'?'误报':'待处理', owner: st==='done'?(EM_DUTY[0].name):'—', result: st==='done'?'现场处置完毕，已回访':'', esc: st==='esc' };
  },
  start(){ this.stop(); this._feedSig=''; this._shownMaxId=0; this.renderAll();
    this.timers = { t1:setInterval(()=>this.tick(),1000), t2:setInterval(()=>{ if(!this.live()) return; if(Math.random()>0.42) this.spawn(); },8000) };
    this.radar();
  },
  /* 仅当当前停留在紧急监管页时保持推送 */
  live(){ return S.view==='admin' && S.mod==='emergency' && !!document.querySelector('#emKpi'); },
  stop(){ const t=this.timers||{}; clearInterval(t.t1); clearInterval(t.t2); this.timers=null; if(this.raf) cancelAnimationFrame(this.raf); this.raf=null; },
  tick(){ if(!this.live()) return this.stop(); this.renderKpi(); this.renderFeed(); this.escalate(); },
  /* 生成一条新告警（force=true 为手动模拟） */
  spawn(force){
    const sc = force ? EM_SCENES[Math.floor(Math.random()*4)] : EM_SCENES[Math.floor(Math.random()*EM_SCENES.length)];
    const ar = MODULES.archive.rows, a = ar[Math.floor(Math.random()*ar.length)];
    const vals = { sos:'紧急按钮触发，语音已接通', fall:'毫米波识别跌倒姿态，未起身', heart:'心率 132bpm，超阈值 22%', fence:'越过东区电子围栏 12m',
      bed:'夜间离床 21 分钟未归', env:'湿度 31%RH，低于下限 35%', door:'非授权时段开启（22:41）', offline:'心跳超时 3 分钟', bat:'电量 8%，需更换/充电', drift:'CO₂ 980ppm，轻微偏高' };
    const obj = Math.random()>0.5 ? (a.name+' · '+a.room) : sc.place[Math.floor(Math.random()*sc.place.length)];
    const it = this._mk(sc, obj, vals[sc.k]||'实时采集越限', 'open', 0);
    this.list.unshift(it); if(this.list.length>40) this.list.length=40;
    this.scenes[sc.k].n++; this.syncScene();
    MODULES.devalarm.rows.unshift({ _id:++UID, no:'EM'+String(Date.now()).slice(-8), time:it.time, kind:sc.name, level:['','I 级（紧急）','II 级（重要）','III 级（提示）'][sc.lvl],
      obj:obj, dev:'紧急监管实时通道', value:it.val, rule:it.rule, owner:'—', status:'待处置', result:'' });
    if(MODULES.devalarm.rows.length>40) MODULES.devalarm.rows.length=40;
    if(sc.lvl===1){ this.notify(it); }
    else toast(`${sc.ico} ${sc.name}：${obj}（${sc.lvl===2?'二级 警告':'三级 提示'}）`, sc.lvl===2?'warn':'');
    if($('emFeed')){ this.renderAll(); const f=$('emFeed'); if(f) f.scrollTop=0; }
    persist();
  },
  /* 一级紧急：语音播报 + 震动 + 红色告警条 */
  notify(it){
    toast(`🚨 一级紧急：${it.kind} · ${it.obj}，请立即接警处置`,'err');
    try{ if(navigator.vibrate) navigator.vibrate([240,120,240]); }catch(e){}
    try{ if(window.speechSynthesis){ const u=new SpeechSynthesisUtterance('一级紧急告警，'+it.kind+'，位置'+it.obj+'，请安保中控室立即接警处置'); u.lang='zh-CN'; u.rate=1.05; speechSynthesis.speak(u); } }catch(e){}
  },
  /* 超时未处理 → 按三级响应规则自动升级 */
  escalate(){
    const lim = {1:3, 2:15, 3:60}; let ch=false;
    this.list.forEach(it=>{ if(it.status!=='待处理'||it.esc) return;
      if((Date.now()-it.ts)/60000 > lim[it.lvl]){ it.esc=true; it.status='升级中'; ch=true;
        if(it.lvl===1){ const u=EM_STANDBY[0]; it.owner=u.name; toast(`⏫ 一级告警 3 分钟未确认，已升级 ${u.name}（${u.role}）`,'err'); } } });
    if(ch){ this.renderFeed(); this.renderKpi(); }
  },
  openCnt(){ return this.list.filter(x=>x.status==='待处理'||x.status==='处置中'||x.status==='升级中').length; },
  /* ---------- 渲染 ---------- */
  renderAll(){ this.renderScenes(); this.renderKpi(); this.renderFeed(); },
  renderScenes(){
    const host=$('emScenes'); if(!host) return;
    host.innerHTML = EM_SCENES.map(s=>{ const st=this.scenes[s.k]||{n:0,open:0};
      return `<div class="em-sc" onclick="EME.scene('${s.k}')">
        <span class="ico">${s.ico}</span><div class="nm"><b>${esc(s.name)}</b><i>${s.lvl===1?'一级 紧急':s.lvl===2?'二级 警告':'三级 提示'} · ${esc(s.place[0])}等 ${s.place.length} 处</i></div>
        <span class="em-tag${st.open?' hot':''}">${st.open?'紧急':'安全'}</span><span class="em-dot${st.open?' al':''}"></span>
        <span class="cnt">${st.n}</span></div>`; }).join('');
  },
  renderKpi(){
    const host=$('emKpi'); if(!host) return;
    const d=new Date(), p=n=>String(n).padStart(2,'0'), clock=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
    const open=this.openCnt(), urg=this.list.filter(x=>x.lvl===1&&(x.status==='待处理'||x.status==='处置中'||x.status==='升级中')).length;
    const last=this.list.length?this.list.slice().sort((a,b)=>b.ts-a.ts)[0]:null;
    host.innerHTML = `<div class="em-kpi"><i>当前时间</i><b style="font-size:17px">${clock}</b></div>
      <div class="em-kpi ${last?'warn':''}"><i>最近预警时间</i><b style="font-size:17px">${last?esc(last.time.slice(11))+' · '+esc(last.ico+last.kind):'暂无'}</b></div>
      <div class="em-kpi ${open?'red':''}"><i>待处理告警</i><b>${open} 条${urg?` <span style="font-size:12px;color:#e5484d">一级 ${urg}</span>`:''}</b></div>
      <div class="em-kpi"><i>执勤 / 备勤人员</i><b>${EM_DUTY.length} <span style="font-size:12px;color:var(--sub)">执勤</span> + ${EM_STANDBY.length} <span style="font-size:12px;color:var(--sub)">备勤</span></b></div>`;
  },
  renderFeed(){
    const host=$('emFeed'); if(!host) return;
    const order = {'待处理':0,'升级中':1,'处置中':2,'已闭环':3,'误报':4};
    const arr = this.list.slice().sort((a,b)=> (order[a.status]||0)-(order[b.status]||0) || b.ts-a.ts);
    const now = Date.now(), prevMax = this._shownMaxId||0;
    /* 快照签名：仅当集合/状态/处置人/分钟级年龄变化时才重绘，杜绝每秒重建导致的闪烁 */
    const sig = arr.map(it=> it.id+':'+it.status+':'+(it.owner||'')+':'+Math.max(0,Math.floor((now-it.ts)/60000))).join('|');
    if(sig === this._feedSig) return;
    const hasNew = arr.some(it=> it.id>prevMax), keepTop = host.scrollTop;
    host.innerHTML = arr.length?arr.map(it=>{
      const mins = Math.max(0, Math.floor((now-it.ts)/60000));
      const done = it.status==='已闭环'||it.status==='误报';
      const isNew = it.id>prevMax;
      const tag = it.status==='待处理'?'red':it.status==='升级中'?'red':it.status==='处置中'?'warn':it.status==='误报'?'ink':'green';
      return `<div class="em-it l${it.lvl}${done?' done':''}${isNew?' em-new':''}">
        <div class="top"><b>${it.ico} ${esc(it.kind)}</b><span class="tm">${esc(it.time.slice(5))}</span></div>
        <p>${esc(it.obj)}　·　${esc(it.val)}</p>
        <div class="rt"><span class="lv v${it.lvl}">${it.lvl===1?'一级':it.lvl===2?'二级':'三级'}</span>
          <span class="tag ${tag}">${esc(it.status)}</span><span class="tiny">${esc(it.owner||'—')}</span>
          <span class="age">${mins<1?'刚刚':mins+' 分钟前'}</span></div>
        <div class="rt">${done?`<span class="tiny">${esc(it.result||'已归档')}</span>`:
          `<button class="btn sm p" onclick="EME.handle(${it.id})">🚑 处理</button>`+
          (it.status==='处置中'?`<button class="btn sm g" onclick="EME.close2(${it.id})">✓ 闭环</button>`:'')+
          `<button class="btn sm" onclick="EME.falsify(${it.id})">误报</button>`+
          `<button class="btn sm" onclick="EME.callOut(${it.id})">📞 呼叫</button>`}</div></div>`;
    }).join('') : `<div class="noech">暂无告警，园区安全运行中</div>`;
    host.scrollTop = hasNew ? 0 : keepTop;
    this._feedSig = sig;
    this._shownMaxId = arr.reduce((m,x)=> x.id>m?x.id:m, prevMax);
  },
  /* 场景状态同步（左栏红/绿） */
  syncScene(){ this.escalate(); this.syncCounts(); this.renderScenes(); },
  handle(id){
    const it=this.list.find(x=>x.id===id); if(!it) return;
    const pool = it.lvl===1?EM_DUTY.slice(0,3).concat(EM_STANDBY.slice(0,2)):it.lvl===2?EM_DUTY.slice(1):EM_STANDBY.slice(3);
    const rule = EM_RULES[it.lvl-1];
    Modal.open(`${it.ico} 告警处置 · ${esc(it.kind)}（${it.lvl===1?'一级 紧急':it.lvl===2?'二级 警告':'三级 提示'}）`,
      `<div class="grid2"><div class="field"><label>触发位置 / 对象</label><input class="txt" value="${esc(it.obj)}" readonly></div>
        <div class="field"><label>采集数值</label><input class="txt" value="${esc(it.val)}" readonly></div>
        <div class="field"><label>上报时间</label><input class="txt" value="${esc(it.time)}" readonly></div>
        <div class="field"><label>指派处置人</label><select class="txt" id="emOwner">${pool.map(o=>`<option>${esc(o.name)} · ${esc(o.role)}</option>`).join('')}</select></div></div>
      <div class="field"><label>处置措施</label><textarea class="txta" id="emAct" placeholder="到场确认 → 处置记录 → 回访家属 → 闭环归档">${it.lvl===1?'对讲机通知就近护理员 30 秒内到场，医护同步待命，已推送子女端':'安排值班人员现场确认并登记工单'}</textarea></div>
      <div class="tiny" style="margin-top:4px">响应要求：<b>${esc(rule.first)}</b> 接警 → <b>${esc(rule.main)}</b> 主处置 → <b style="color:#e5484d">${esc(rule.esc)}</b></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn g" onclick="EME._take(${id})">确认接单</button>`);
  },
  _take(id){ const it=this.list.find(x=>x.id===id); if(!it) return;
    const o=$('emOwner'), a=$('emAct');
    it.owner = o?o.value.split(' · ')[0]:it.owner; it.status='处置中'; it.result=(a?a.value:'').slice(0,60);
    Modal.close(); toast(`已接单：${it.kind} → ${it.owner} 处置中`,'ok'); logAct('紧急监管 · 接单处置', it.kind+' / '+it.obj, '高');
    this.syncScene(); this.renderFeed(); this.renderKpi(); persist();
  },
  close2(id){ const it=this.list.find(x=>x.id===id); if(!it) return;
    it.status='已闭环'; it.esc=false; it.result = it.result||'现场处置完毕，已回访长者与家属';
    toast('已闭环归档，同步至设备告警日志','ok'); logAct('紧急监管 · 闭环', it.kind+' / '+it.obj, '中');
    const a=MODULES.devalarm.rows.find(r=>r.obj===it.obj&&r.kind===it.kind); if(a){ a.status='已闭环'; a.owner=it.owner; a.result=it.result; }
    this.syncScene(); this.renderFeed(); this.renderKpi(); this.renderScenes(); persist();
  },
  falsify(id){ const it=this.list.find(x=>x.id===id); if(!it) return;
    it.status='误报'; it.esc=false; it.result='经核实为误报，已回写规则库抑制同类误报';
    toast('已标记误报，规则库同步优化','warn'); logAct('紧急监管 · 标记误报', it.kind+' / '+it.obj, '低');
    this.syncScene(); this.renderFeed(); this.renderKpi(); persist();
  },
  callOut(id){ const it=this.list.find(x=>x.id===id); if(!it) return;
    const u = it.lvl===1?EM_STANDBY[0]:EM_DUTY[1];
    emCall(u.name, u.role+'（'+it.kind+' 处置）', u.phone);
  },
  scene(i){
    const s = typeof i==='number'?EM_SCENES[i]:EM_SCENES.find(x=>x.k===i)||EM_SCENES[0];
    const rows = this.list.filter(x=>x.scene===s.k);
    Modal.open(`${s.ico} ${esc(s.name)} · 记录信息（${rows.length} 条）`,
      `<div class="tbwrap"><table class="tb"><thead><tr><th>时间</th><th>位置 / 对象</th><th>采集数值</th><th>状态</th><th>处置人</th></tr></thead><tbody>`+
      (rows.length?rows.map(r=>`<tr><td data-k="时间" class="mono">${esc(r.time)}</td><td data-k="位置 / 对象">${esc(r.obj)}</td><td data-k="采集数值">${esc(r.val)}</td><td data-k="状态"><span class="tag ${r.status==='已闭环'?'green':r.status==='误报'?'ink':r.status==='处置中'?'warn':'red'}">${esc(r.status)}</span></td><td data-k="处置人">${esc(r.owner)}</td></tr>`).join('')
        : `<tr><td colspan="5" class="tiny">该场景当前无告警记录，状态安全</td></tr>`)+`</tbody></table></div>
      <div class="tiny" style="margin-top:8px">监测点位：${s.place.map(p=>esc(p)).join(' / ')}　·　响应级别：${s.lvl===1?'一级（紧急）':s.lvl===2?'二级（警告）':'三级（提示）'}</div>`,
      `<button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="Modal.close();S.flt.iot={};App.go('admin','iot')">查看设备告警日志 →</button>`, false, 'em-foot');
  },
  /* ---------- 雷达扫描 ---------- */
  radar(){
    const cv=$('emRadar'); if(!cv) return;
    const ctx=cv.getContext('2d'), W=cv.width, H=cv.height, cx=W/2, cy=H/2, R0=W/2-16;
    if(!this.fly.length){
      const ang=[18,58,96,138,176,214,252,288,322,352];
      this.fly = EM_SCENES.map((s,i)=>({ x:cx+Math.cos(ang[i]*Math.PI/180)*R0*(0.34+(i%4)*0.18), y:cy+Math.sin(ang[i]*Math.PI/180)*R0*(0.34+(i%4)*0.18), s:s }));
    }
    const loop=()=>{
      if(!$('emRadar')){ this.raf=null; return; }
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#081a2e'; ctx.beginPath(); ctx.arc(cx,cy,R0+10,0,7); ctx.fill();
      ctx.strokeStyle='rgba(74,168,255,.28)'; ctx.lineWidth=1;
      [0.28,0.52,0.76,1].forEach(f=>{ ctx.beginPath(); ctx.arc(cx,cy,R0*f,0,7); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(cx-R0,cy); ctx.lineTo(cx+R0,cy); ctx.moveTo(cx,cy-R0); ctx.lineTo(cx,cy+R0); ctx.stroke();
      this.angle=(this.angle+0.022)%(Math.PI*2);
      const g=ctx.createConicGradient?ctx.createConicGradient(this.angle,cx,cy):null;
      if(g){ g.addColorStop(0,'rgba(92,224,176,.34)'); g.addColorStop(0.12,'rgba(92,224,176,0)'); g.addColorStop(1,'rgba(92,224,176,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,R0,0,7); ctx.fill(); }
      ctx.strokeStyle='rgba(92,224,176,.85)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(this.angle)*R0, cy+Math.sin(this.angle)*R0); ctx.stroke();
      const alarm = this.openCnt()>0 && this.list.some(x=>x.lvl===1 && !['已闭环','误报'].includes(x.status));
      for (let i = 0; i < this.fly.length; i++) {
        const f = this.fly[i];
        const st = this.scenes[f.s.k] || { open:0 };
        const open = st.open > 0;
        ctx.beginPath();
        ctx.arc(f.x, f.y, open ? 4.4 : 3, 0, 7);
        ctx.fillStyle = open ? '#ff5b5b' : (f.s.lvl === 3 ? '#4aa8ff' : '#5ce0b0');
        ctx.fill();
        if (open) {
          const ph = (Date.now() % 1400) / 1400;
          ctx.beginPath();
          ctx.arc(f.x, f.y, 4.4 + ph * 13, 0, 7);
          ctx.strokeStyle = 'rgba(255,91,91,' + (0.6 * (1 - ph)) + ')';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }
      if(alarm){ const ph=(Date.now()%1600)/1600; ctx.beginPath(); ctx.arc(cx,cy,R0*(0.25+ph*0.75),0,7);
        ctx.strokeStyle='rgba(255,70,70,'+(0.5*(1-ph))+')'; ctx.lineWidth=3; ctx.stroke(); }
      ctx.font='10px system-ui'; ctx.textAlign='center'; ctx.fillStyle='#8fb6d9';
      ctx.fillText('N', cx, cy-R0-1); ctx.fillText('S', cx, cy+R0+9); ctx.textAlign='left';
      ctx.fillText('康养区', cx-R0*0.62, cy-R0*0.5); ctx.fillText('文化区', cx+R0*0.28, cy+R0*0.42); ctx.fillText('旅游区', cx-R0*0.3, cy+R0*0.66);
      const tip=$('emRadarTip'); if(tip){ tip.textContent = alarm?'⚠ 检测到紧急事件':(this.openCnt()?'监测中 · 二级/三级告警':'正常巡逻'); tip.style.color = alarm?'#e5484d':''; }
      const card=cv.closest('.card'); if(card) card.classList.toggle('em-radar-alarm', alarm);
      this.raf=requestAnimationFrame(loop);
    };
    if(this.raf) cancelAnimationFrame(this.raf);
    this.raf=requestAnimationFrame(loop);
  }
};
/* 三个 3D 全屏入口（驾驶舱 twin/3D 导航视图、3D 监控菜单、小康助手共用，保证完全同步） */
const D3_VIEWS = [
  { ico:'🌐', t:'全局查看 · 园区三维孪生', url:'assets/3d/campus-twin.html', title:'智慧康养园区 · 全局三维孪生', cls:'p' },
  { ico:'🛋', t:'室内 3D · 客厅样板间', url:'assets/3d/living-room-3d.html', title:'康养居室 · 室内精装 3D 样板间', cls:'' },
  { ico:'🧭', t:'打开 3D 室内导航实景', url:'assets/3d/indoor-navigation.html', title:'园区室内导航 · 1F-3F 实景路线指引', cls:'' }
];
function d3Btns(){
  return `<div style="display:flex;gap:10px;flex-wrap:wrap">`+D3_VIEWS.map(v=>
    `<button class="btn ${v.cls}" onclick="open3D('${v.url}','${v.title}')">${v.ico} ${v.t}</button>`).join('')+`</div>`;
}
function dashView(v){
  const host = $('dashBody'); if(!host) return;
  if(v==='biz'){
    host.innerHTML = `<div class="bar2">
      <div class="card"><div class="card-h"><h3>经营服务看板 · 近 12 个月</h3><span class="tiny">收入 / 入住率 / 活动</span></div><div class="card-b"><div id="d1" class="chart lg"></div></div></div>
      <div class="card"><div class="card-h"><h3>告警中心</h3><span class="tiny">分级 · 处理 · 转派</span></div><div class="card-b"><ul class="lst" id="dAl"></ul>
      <button class="btn blk" style="margin-top:10px" onclick="S.tab.iot='devalarm';App.go('admin','iot')">进入告警处置 →</button></div></div></div>
      <div class="twin" style="margin-top:16px">
      <div class="card"><div class="card-h"><h3>健康风险与体征异常</h3></div><div class="card-b"><div id="d2" class="chart"></div></div></div>
      <div class="card"><div class="card-h"><h3>今日待办</h3><span class="tiny">按角色聚合</span></div><div class="card-b"><ul class="lst" id="dTodo"></ul></div></div></div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>消费与会员运营看板</h3><span class="tiny">套餐 / 储值 / 代付 / 转化</span></div><div class="card-b"><div id="d3" class="chart"></div></div></div>`;
    drawDashBiz();
  } else if(v==='twin'){
    host.innerHTML = `<div class="bar2"><div class="card"><div class="card-h"><h3>数字孪生视图 · 园区三维模型</h3><span class="tiny">实时映射设备与告警</span></div>
      <div class="card-b"><div class="park" id="dPark" style="height:400px"></div></div></div>
      <div class="card"><div class="card-h"><h3>孪生图层与设备状态</h3></div><div class="card-b">
      <div class="sw-box">${[['建筑','12 栋 · 3 分区'],['设备',MODULES.device.rows.length+' 台 · 在线 '+MODULES.device.rows.filter(d=>d.online==='在线').length],['人员','在住 118 · 员工 42'],['告警',MODULES.devalarm.rows.filter(a=>a.status!=='已闭环').length+' 条未闭环'],['能耗','今日 '+ (1240+Math.floor(Math.random()*200))+' kWh']].map(x=>`<div class="ck"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>
      <div style="height:14px"></div><div id="d4" class="chart sm"></div></div></div></div>
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>三维入口</h3><span class="tiny">与「数字孪生 / 3D 监控」菜单完全一致 · 全屏查看</span></div>
      <div class="card-b">${d3Btns()}</div></div>`;
    parkHTML('dPark');
    ec('d4', { tooltip:{trigger:'item'}, legend:{bottom:0,itemWidth:9,itemHeight:9,textStyle:{fontSize:11}}, series:[{type:'pie',radius:['40%','66%'],center:['50%','44%'],avoidLabelOverlap:true,itemStyle:{borderRadius:6,borderColor:'#fff',borderWidth:2},label:{show:false},data:[
      {name:'智能手环',value:MODULES.device.rows.filter(d=>d.cate.includes('手环')).length},{name:'环控设备',value:MODULES.device.rows.filter(d=>['温湿度传感器','照明','加湿器','空调/新风'].includes(d.cate)).length},
      {name:'门禁/摄像',value:MODULES.device.rows.filter(d=>['门禁','摄像头','人脸识别终端'].includes(d.cate)).length},{name:'智能管理',value:MODULES.device.rows.filter(d=>['床垫监测','紧急呼叫按钮','烟感报警','智能插座'].includes(d.cate)).length},
      {name:'运动健身',value:MODULES.device.rows.filter(d=>['智能体测设备'].includes(d.cate)).length}],color:PALETTE}]});
  } else {
    host.innerHTML = `<div class="bar2"><div class="card"><div class="card-h"><h3>3D 空间漫游与监控联动</h3><span class="tiny">点选设备 → 视频 → 告警定位</span></div>
      <div class="card-b"><div class="park" id="dPark2" style="height:420px"></div></div></div>
      <div class="card"><div class="card-h"><h3>告警定位与处置</h3></div><div class="card-b"><ul class="lst" id="dAl2"></ul><div style="height:12px"></div><div id="d5" class="chart sm"></div></div></div></div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>3D 实景入口</h3><span class="tiny">与「数字孪生 / 3D 监控」菜单完全一致 · 全屏查看</span></div>
      <div class="card-b">${d3Btns()}</div></div>`;
    parkHTML('dPark2');
    const al = MODULES.devalarm.rows.slice(0,6);
    $('dAl2').innerHTML = al.map(a=>`<li><span class="ic ${a.level.includes('I')?'r':a.level.includes('II')?'w':'g'}">🚨</span><div><b>${esc(a.kind)} · ${esc(a.level)}</b><p>${esc(a.obj)} · ${esc(a.value)}</p></div><span class="tm">${esc(a.status)}</span></li>`).join('');
    ec('d5',{tooltip:{},grid:{left:8,right:16,top:16,bottom:22,containLabel:true},xAxis:Object.assign({type:'category',data:['响应','到场','处置','闭环']},axisBase()),yAxis:Object.assign({type:'value'},axisBase()),series:[{type:'bar',barWidth:16,itemStyle:{borderRadius:6,color:{type:'linear',x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:'#1668dc'},{offset:1,color:'#00b578'}]}},data:[2.1,3.4,8.6,26]}]});
  }
}
function drawDashBiz(){
  const mo=['11月','12月','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月'];
  ec('d1',{tooltip:{trigger:'axis'},legend:{data:['营业收入(万)','入住率(%)','活动场次'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},
    grid:{left:10,right:16,top:26,bottom:44,containLabel:true},xAxis:Object.assign({type:'category',data:mo},axisBase()),
    yAxis:[Object.assign({type:'value'},axisBase()),Object.assign({type:'value',max:100,splitLine:{show:false}},axisBase())],
    series:[{name:'营业收入(万)',type:'bar',barWidth:12,itemStyle:{borderRadius:[5,5,0,0],color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'#4aa8ff'},{offset:1,color:'#1668dc'}]}},data:[168,182,175,158,196,212,224,236,248,256,262,268]},
      {name:'入住率(%)',type:'line',yAxisIndex:1,smooth:true,symbolSize:6,lineStyle:{width:3,color:'#00b578'},itemStyle:{color:'#00b578'},areaStyle:{opacity:.08,color:'#00b578'},data:[62,64,66,65,68,70,71,72,73,74,75,76]},
      {name:'活动场次',type:'line',smooth:true,symbolSize:5,lineStyle:{width:2,type:'dashed',color:'#f5a623'},itemStyle:{color:'#f5a623'},data:[18,20,16,14,22,26,28,30,32,28,34,36]}]});
  const al = MODULES.devalarm.rows.slice(0,6);
  const lst = (id, arr) => { const n=$(id); if(n) n.innerHTML = arr.map(a=>`<li><span class="ic ${a.level.includes('I')?'r':a.level.includes('II')?'w':'g'}">🚨</span><div><b>${esc(a.kind)} · ${esc(a.level)}</b><p>${esc(a.obj)} · ${esc(a.value)}</p></div><span class="tm">${esc(a.time.slice(5))}</span></li>`).join(''); };
  lst('dAl', al); const a2=$('dAl2'); if(a2) a2.innerHTML=$('dAl').innerHTML;
  ec('d2',{tooltip:{trigger:'item'},legend:{bottom:0,itemWidth:9,itemHeight:9,textStyle:{fontSize:11}},series:[{type:'pie',roseType:'radius',radius:['32%','68%'],center:['50%','44%'],itemStyle:{borderRadius:5,borderColor:'#fff',borderWidth:2},label:{fontSize:11},data:[
    {name:'低风险',value:MODULES.health.rows.filter(h=>h.risk==='低').length},{name:'中风险',value:MODULES.health.rows.filter(h=>h.risk==='中').length},{name:'高风险',value:MODULES.health.rows.filter(h=>h.risk==='高').length},
    {name:'心理中重度',value:MODULES.psych.rows.filter(p=>['中度','重度'].includes(p.risk)).length},{name:'防诈关注',value:MODULES.fraud.rows.filter(f=>f.result==='关注中').length}],color:['#00b578','#f5a623','#e5484d','#7c5cff','#1668dc']}]});
  const todo=[];
  MODULES.leave.rows.filter(r=>r.status==='待审批').forEach(r=>todo.push(['📝',`待审批：${r.name} ${r.type}`,r.start,'w']));
  MODULES.complaint.rows.filter(r=>['待受理','已升级督办'].includes(r.status)).forEach(r=>todo.push(['⚠️',`${r.status}：${r.title}`,r.date,'r']));
  MODULES.booking.rows.filter(r=>r.status==='待确认').forEach(r=>todo.push(['📅',`预约待确认：${r.item}`,r.date,'g']));
  MODULES.device.rows.filter(d=>['离线','故障'].includes(d.online)).forEach(d=>todo.push(['🔌',`设备异常：${d.name}`,d.last,'r']));
  MODULES.plan.rows.filter(p=>p.status==='待审批').forEach(p=>todo.push(['🗂',`计划待审批：${p.title}`,p.end,'g']));
  const tn=$('dTodo'); if(tn) tn.innerHTML = todo.slice(0,7).map(t=>`<li><span class="ic ${t[3]}">${t[0]}</span><div><b>${esc(t[1])}</b><p>${esc(t[2])}</p></div><span class="tm">待处理</span></li>`).join('');
  ec('d3',{tooltip:{trigger:'axis'},legend:{data:['储值充值','套餐消费','子女代付','积分抵扣(百)'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},grid:{left:10,right:16,top:26,bottom:44,containLabel:true},
    xAxis:Object.assign({type:'category',data:['第1周','第2周','第3周','第4周','第5周','本周']},axisBase()),yAxis:Object.assign({type:'value'},axisBase()),
    series:[{name:'储值充值',type:'bar',stack:'a',barWidth:22,itemStyle:{color:'#1668dc'},data:[42,56,48,66,58,72]},
      {name:'套餐消费',type:'bar',stack:'a',itemStyle:{color:'#00b578'},data:[88,96,102,110,118,126]},
      {name:'子女代付',type:'bar',stack:'a',itemStyle:{color:'#22d3c5'},data:[34,42,48,52,60,68]},
      {name:'积分抵扣(百)',type:'line',smooth:true,itemStyle:{color:'#f5a623'},lineStyle:{width:2.5},data:[6,8,7,10,12,14]}]});
}
function drawReports(dim){
  const rows = MODULES.archive.rows;
  const grp = {}; rows.forEach(r=>{ const k=r[dim]||'—'; grp[k]=grp[k]||{n:0,age:0}; grp[k].n++; grp[k].age+=+r.age||0; });
  const keys = Object.keys(grp);
  $('rtable').innerHTML = `<div class="tbwrap"><table class="tb"><thead><tr><th>${dim==='zone'?'区域':dim==='pkg'?'康养套餐':'健康等级'}</th><th>长者人数</th><th>平均年龄</th><th>本月服务次数</th><th>本月消费(元)</th><th>满意度</th><th>占比</th></tr></thead><tbody>`+
    keys.map(k=>{ const n=grp[k].n, pct=Math.round(n/rows.length*100); const amt=n*(3200+Math.floor(Math.random()*2600));
      return `<tr><td><b>${esc(k)}</b></td><td>${n}</td><td>${(grp[k].age/n).toFixed(1)}</td><td>${n*18+Math.floor(Math.random()*40)}</td><td>${amt.toLocaleString()}</td><td>${(4.4+Math.random()*.6).toFixed(2)}</td>
      <td><div class="prog" style="width:110px"><i style="width:${pct}%"></i></div><span class="tiny">${pct}%</span></td></tr>`}).join('')+`</tbody></table></div>`;
  const mo=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  ec('r1',{tooltip:{trigger:'axis'},legend:{data:['收入(万)','成本(万)','入住率(%)','体验转化率(%)'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},grid:{left:10,right:16,top:24,bottom:44,containLabel:true},
    xAxis:Object.assign({type:'category',data:mo},axisBase()),yAxis:[Object.assign({type:'value'},axisBase()),Object.assign({type:'value',max:100,splitLine:{show:false}},axisBase())],
    series:[{name:'收入(万)',type:'line',areaStyle:{opacity:.15},smooth:true,itemStyle:{color:'#1668dc'},lineStyle:{width:3},data:[158,142,176,186,198,206,218,228,240,252,262,268]},
      {name:'成本(万)',type:'line',areaStyle:{opacity:.1},smooth:true,itemStyle:{color:'#98a8bd'},lineStyle:{width:2,type:'dashed'},data:[112,108,118,124,128,132,138,142,148,152,158,162]},
      {name:'入住率(%)',type:'line',yAxisIndex:1,smooth:true,itemStyle:{color:'#00b578'},lineStyle:{width:2.5},data:[62,63,65,66,68,69,70,72,73,74,75,76]},
      {name:'体验转化率(%)',type:'line',yAxisIndex:1,smooth:true,itemStyle:{color:'#f5a623'},lineStyle:{width:2},data:[22,24,25,26,27,28,29,30,31,31,32,32]}]});
  ec('r2',{tooltip:{trigger:'item'},series:[{type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},itemStyle:{borderRadius:5,gapWidth:2},levels:[{upperLabel:{show:false},itemStyle:{borderWidth:0, gapWidth:2}}],
    label:{fontSize:11},data:[{name:'健康管理',value:326,itemStyle:{color:'#1668dc'}},{name:'生活照护',value:288,itemStyle:{color:'#0d4bb3'}},{name:'活动课堂',value:214,itemStyle:{color:'#00b578'}},{name:'膳食营养',value:196,itemStyle:{color:'#22d3c5'}},{name:'心理关怀',value:128,itemStyle:{color:'#7c5cff'}},{name:'消费核销',value:172,itemStyle:{color:'#f5a623'}},{name:'设备运维',value:96,itemStyle:{color:'#4aa8ff'}},{name:'投诉处理',value:64,itemStyle:{color:'#e5484d'}}]}]});
  ec('r3',{tooltip:{trigger:'axis'},legend:{data:['男','女'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},grid:{left:10,right:16,top:20,bottom:40,containLabel:true},
    xAxis:Object.assign({type:'value'},axisBase()),yAxis:Object.assign({type:'category',data:['60-69','70-79','80-89','90+']},axisBase()),
    series:[{name:'男',type:'bar',stack:'g',barWidth:16,itemStyle:{color:'#1668dc',borderRadius:[0,0,0,0]},data:[8,16,11,3]},{name:'女',type:'bar',stack:'g',itemStyle:{color:'#00b578'},data:[6,19,14,2]}]});
  ec('r4',{tooltip:{},radar:{indicator:[{name:'设备在线',max:100},{name:'告警闭环',max:100},{name:'响应时效',max:100},{name:'数据完整',max:100},{name:'能耗优化',max:100},{name:'巡检完成',max:100}],radius:'62%',splitLine:{lineStyle:{color:'#e3e9f2'}},axisName:{fontSize:11,color:'#6b7c93'}},
    series:[{type:'radar',data:[{value:[94,88,92,96,78,85],name:'本月',areaStyle:{color:'rgba(22,104,220,.18)'},lineStyle:{color:'#1668dc'},itemStyle:{color:'#1668dc'}},{value:[89,80,84,92,70,78],name:'上月',areaStyle:{color:'rgba(0,181,120,.14)'},lineStyle:{color:'#00b578'},itemStyle:{color:'#00b578'}}]}]});
}
function drawMonitor(){
  const hrs=Array.from({length:12},(_,i)=>`${(21-(11-i)+24)%24}:00`);
  const gen=(b,v)=>hrs.map(()=>Math.round(b+Math.random()*v));
  ec('mo1',{tooltip:{trigger:'axis'},legend:{data:['心率 bpm','血氧 %','（右轴）血氧'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},grid:{left:10,right:16,top:24,bottom:40,containLabel:true},
    xAxis:Object.assign({type:'category',data:hrs},axisBase()),yAxis:[Object.assign({type:'value',name:'心率',min:50,max:130},axisBase()),Object.assign({type:'value',name:'血氧%',min:88,max:100,splitLine:{show:false}},axisBase())],
    series:[{name:'心率 bpm',type:'line',smooth:true,areaStyle:{opacity:.12},itemStyle:{color:'#1668dc'},lineStyle:{width:2.5},data:gen(66,26)},
      {name:'血氧 %',type:'line',yAxisIndex:1,smooth:true,itemStyle:{color:'#00b578'},lineStyle:{width:2.5},data:hrs.map(()=>94+Math.floor(Math.random()*5))}]});
  ec('mo2',{tooltip:{trigger:'axis'},legend:{data:['温度 ℃','湿度 %RH','湿度下限'],bottom:0,itemWidth:10,itemHeight:8,textStyle:{fontSize:11}},grid:{left:10,right:16,top:24,bottom:40,containLabel:true},
    xAxis:Object.assign({type:'category',data:hrs},axisBase()),yAxis:Object.assign({type:'value'},axisBase()),
    series:[{name:'温度 ℃',type:'bar',barWidth:10,itemStyle:{color:'#4aa8ff',borderRadius:[4,4,0,0]},data:gen(19,7)},
      {name:'湿度 %RH',type:'line',smooth:true,itemStyle:{color:'#00b578'},lineStyle:{width:2.5},data:gen(34,24)},
      {name:'湿度下限',type:'line',symbol:'none',lineStyle:{width:1.5,type:'dashed',color:'#e5484d'},data:hrs.map(()=>35)}]});
}

/* ---------- 大数据屏 ---------- */
let scTimer=null, scTimer2=null;
function initScreen(){
  $('scDate').textContent = new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const devs = MODULES.device.rows, on=devs.filter(d=>d.online==='在线').length;
  const openAl = () => MODULES.devalarm.rows.filter(a=>a.status==='待处置'||a.status==='处置中');
  const kpi = [['在住长者','118 人'],['床位入住率','75.6%'],['设备在线',on+'/'+devs.length],['今日告警',openAl().length+' 条'],['今日消费','¥ '+(MODULES.order.rows.reduce((s,r)=>s+(+r.amount||0),0)*3.6).toFixed(0)],
    ['今日活动',MODULES.activity.rows.filter(a=>a.status!=='已结束').length+' 场'],['待办审批',MODULES.leave.rows.filter(l=>l.status==='待审批').length+' 项'],['AI 陪伴会话','268 次'],['防诈拦截',MODULES.fraud.rows.filter(f=>['成功拦截','未遂'].includes(f.result)).length+' 起'],['满意度','4.72']];
  $('scKpi').innerHTML = kpi.map(k=>`<div><b>${esc(k[1])}</b><i>${esc(k[0])}</i></div>`).join('');
  parkHTML('scPark');
  renderScreenAlerts();
  $('scRank').innerHTML = MODULES.activity.rows.slice(0,6).map((a,i)=>`<li><span class="n">${i+1}</span><span class="b">${esc(a.title)}</span><em>${a.signed}人</em></li>`).join('');
  $('scTk').textContent = `今日 09:30 重阳节文艺汇演彩排（礼堂）　·　　10:00 认知功能筛查（健康中心，已通知 3 位家属）　·　　A-308 湿度低于 35%RH 已自动开启加湿器　·　　书画室空调通讯故障，工单 WO20261026001 待派单　·　　防诈提醒：近期高发「AI 换脸语音」诈骗，请勿轻信转账要求　·　　本月旅居线路新增「千岛湖 5 日康养团」，报名开放中`;
  drawScreenCharts();
  clearInterval(scTimer); clearInterval(scTimer2);
  scTimer = setInterval(()=>{ if(S.view!=='screen'){ clearInterval(scTimer); clearInterval(scTimer2); return; } drawScreenCharts(true); }, 5000);
  scTimer2 = setInterval(()=>{ if(S.view!=='screen') return; if(Math.random()>.55) randomAlert(); }, 9000);
}
function renderScreenAlerts(){
  const al = MODULES.devalarm.rows.slice(0,9);
  $('scAlCnt').textContent = al.filter(a=>a.status!=='已闭环'&&a.status!=='误报').length+' 条待处理';
  $('scAl').innerHTML = al.map(a=>{ const cls = a.level.includes('I')?'':a.level.includes('II')?'w':'g';
    return `<li class="${cls}"><div><b>${esc(a.kind)}</b><p>${esc(a.obj)} · ${esc(a.value)}</p></div><span class="tm">${esc(a.time.slice(11))}</span></li>`}).join('');
}
function randomAlert(){
  const kinds=[['体征异常','I 级（紧急）','心率/血氧偏离阈值'],['温湿度超标','III 级（提示）','湿度低于 35%RH'],['设备离线','II 级（重要）','心跳超时'],['夜间离床','II 级（重要）','离床超过 15 分钟'],['跌倒','I 级（紧急）','加速度特征匹配'],['门禁异常','II 级（重要）','非授权时段开启']];
  const k = kinds[Math.floor(Math.random()*kinds.length)];
  const d = MODULES.device.rows[Math.floor(Math.random()*MODULES.device.rows.length)];
  MODULES.devalarm.rows.unshift({_id:++UID, no:'AL'+String(Date.now()).slice(-10), time:now(), kind:k[0], level:k[1], obj:(d.bind&&d.bind!=='—'?d.bind:d.zone+' '+d.pos), dev:d.no, value:k[2], rule:'摄像头抓拍 → 推送值班与子女 → 联动环控', owner:'—', status:'待处置', result:''});
  if(MODULES.devalarm.rows.length>26) MODULES.devalarm.rows.length=26;
  renderScreenAlerts();
}
function drawScreenCharts(soft){
  const dark = true;
  ec('c1',{tooltip:{trigger:'item'},legend:{bottom:0,itemWidth:8,itemHeight:8,textStyle:{fontSize:10,color:'#9fd4ff'}},
    series:[{type:'pie',radius:['46%','70%'],center:['50%','42%'],avoidLabelOverlap:true,itemStyle:{borderColor:'transparent',borderWidth:2},label:{show:true,color:'#bfe0ff',fontSize:10,formatter:'{b}\n{d}%'},labelLine:{length:6,length2:6},
    data:[{name:'康养区',value:86,itemStyle:{color:'#4aa8ff'}},{name:'文化区',value:18,itemStyle:{color:'#5ce0b0'}},{name:'旅游区',value:14,itemStyle:{color:'#22d3c5'}}]}]},true);
  ec('c2',{tooltip:{},grid:{left:6,right:14,top:18,bottom:20,containLabel:true},
    xAxis:Object.assign({type:'category',data:['低危','中危','高危','心理','防诈'],axisLabel:{color:'#9fd4ff',fontSize:10}},axisBase(dark)),
    yAxis:Object.assign({type:'value',axisLabel:{color:'#9fd4ff',fontSize:10}},axisBase(dark)),
    series:[{type:'bar',barWidth:'46%',data:[{value:62,itemStyle:{color:'#00b578'}},{value:24,itemStyle:{color:'#f5a623'}},{value:8,itemStyle:{color:'#e5484d'}},{value:11,itemStyle:{color:'#7c5cff'}},{value:5,itemStyle:{color:'#4aa8ff'}}],itemStyle:{borderRadius:[5,5,0,0]},label:{show:true,position:'top',color:'#bfe0ff',fontSize:10}}]},true);
  ec('c3',{tooltip:{trigger:'axis'},grid:{left:6,right:20,top:10,bottom:18,containLabel:true},
    xAxis:Object.assign({type:'value',axisLabel:{color:'#9fd4ff',fontSize:10}},axisBase(dark)),
    yAxis:Object.assign({type:'category',data:['房间清洁','助浴协助','理疗预约','送餐上门','设备报修'],axisLabel:{color:'#bfe0ff',fontSize:10.5}},axisBase(dark)),
    series:[{type:'bar',barWidth:9,itemStyle:{borderRadius:5,color:{type:'linear',x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:'#1668dc'},{offset:1,color:'#5ce0b0'}]}},data:[86,64,52,128,18]}]},true);
  const cats=['手环','环控','门禁','摄像','床垫','体测'];
  const rate = cats.map(c=>{ const g=MODULES.device.rows.filter(d=>c==='手环'?/手环/.test(d.cate):c==='环控'?['温湿度传感器','照明','加湿器','空调/新风'].includes(d.cate):c==='门禁'?['门禁','人脸识别终端'].includes(d.cate):c==='摄像'?d.cate==='摄像头':c==='床垫'?['床垫监测','紧急呼叫按钮','烟感报警','智能插座'].includes(d.cate):true); const on=g.filter(d=>d.online==='在线').length; return g.length?Math.round(on/g.length*100):100; });
  ec('c4',{tooltip:{},radar:{indicator:cats.map(c=>({name:c,max:100})),radius:'62%',center:['50%','52%'],axisName:{color:'#9fd4ff',fontSize:10},splitLine:{lineStyle:{color:'rgba(74,168,255,.18)'}},splitArea:{areaStyle:{color:['rgba(22,104,220,.05)','rgba(22,104,220,.1)']}},axisLine:{lineStyle:{color:'rgba(74,168,255,.25)'}}},
    series:[{type:'radar',data:[{value:rate,name:'在线率%',areaStyle:{color:'rgba(92,224,176,.25)'},lineStyle:{color:'#5ce0b0',width:2},itemStyle:{color:'#5ce0b0'}}]}]},true);
  const days=Array.from({length:30},(_,i)=>{const d=new Date(2026,9,26-29+i);return (d.getMonth()+1)+'/'+d.getDate()});
  const base=[168,172,180,176,188,196,190,204,212,208,220,226,218,232,240,236,248,252,244,256,262,258,268,272,264,276,282,278,288,296];
  ec('c5',{tooltip:{trigger:'axis',axisPointer:{type:'cross'}},legend:{data:['消费金额(百元)','服务人次','预约量'],bottom:0,itemWidth:8,itemHeight:8,textStyle:{fontSize:10,color:'#9fd4ff'}},grid:{left:6,right:14,top:22,bottom:34,containLabel:true},
    xAxis:Object.assign({type:'category',boundaryGap:false,data:days,axisLabel:{color:'#9fd4ff',fontSize:9,interval:4}},axisBase(dark)),
    yAxis:[Object.assign({type:'value',axisLabel:{color:'#9fd4ff',fontSize:9}},axisBase(dark)),Object.assign({type:'value',show:false},axisBase(dark))],
    series:[{name:'消费金额(百元)',type:'line',smooth:true,symbol:'none',lineStyle:{width:2.5,color:'#5ce0b0'},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(92,224,176,.45)'},{offset:1,color:'rgba(92,224,176,0)'}]}},data:base},
      {name:'服务人次',type:'line',yAxisIndex:1,smooth:true,symbol:'none',lineStyle:{width:2,color:'#4aa8ff'},data:base.map(v=>Math.round(v*1.6+Math.random()*40))},
      {name:'预约量',type:'bar',yAxisIndex:1,barWidth:'38%',itemStyle:{color:'rgba(124,92,255,.5)',borderRadius:[3,3,0,0]},data:base.map(v=>Math.round(v*0.28+Math.random()*10))}]},true);
  ec('c6',{tooltip:{trigger:'item'},legend:{type:'scroll',bottom:0,itemWidth:8,itemHeight:8,textStyle:{fontSize:10,color:'#9fd4ff'}},
    series:[{type:'sunburst',radius:['22%','88%'],center:['50%','46%'],label:{fontSize:9,color:'#dff0ff'},itemStyle:{borderWidth:1,borderColor:'rgba(4,16,31,.8)'},
    data:[{name:'健康',value:34,children:[{name:'体征异常',value:18},{name:'跌倒',value:9},{name:'离床',value:7}]},
      {name:'安全',value:26,children:[{name:'门禁异常',value:11},{name:'入侵',value:6},{name:'烟感',value:9}]},
      {name:'环控',value:22,children:[{name:'温湿度',value:14},{name:'照明',value:4},{name:'空调',value:4}]},
      {name:'设备',value:18,children:[{name:'离线',value:11},{name:'低电量',value:7}]}]}]},true);
}

/* ============================================================
 *  空间资产 · 分区→楼栋→房间→IoT 设备四级联动视图
 * ============================================================ */
function roomDevicesOf(code){
  const c = String(code||'').trim().toUpperCase(), raw = c.replace(/-/g,'');
  return (MODULES.device.rows||[]).filter(d=>{
    const txt = (String(d.no||'')+String(d.name||'')+String(d.pos||'')).toUpperCase();
    return (raw && txt.includes(raw)) || (c && txt.includes(c));
  });
}
function roomStayOf(code){ const c=String(code||'').trim().toUpperCase(); return (MODULES.stay.rows||[]).filter(s=>String(s.room).trim().toUpperCase()===c); }
const Sp = {
  st(){ if(!S.sp) S.sp = {}; const b = MODULES.building.rows; if(!S.sp.bld) S.sp.bld = (b[0]&&b[0].name)||''; if(!S.sp.room){ const r = S.sp.bld ? Sp.rooms(S.sp.bld)[0] : null; S.sp.room = r?r.code:''; } return S.sp; },
  rooms(bld){ const n = bld||this.st().bld; return (MODULES.room.rows||[]).filter(r=>r.bld===n); },
  floors(bld){ const rs=this.rooms(bld); const map={}; rs.forEach(r=>{ (map[r.floor]=map[r.floor]||[]).push(r); }); return Object.keys(map).sort((a,b)=>a-b).map(f=>({floor:f, list:map[f]})); },
  pickArea(a){ this.st(); S.sp.area=a; const first=MODULES.building.rows.find(b=>b.area===a); S.sp.bld = first?first.name:''; S.sp.room = (Sp.rooms()[0]||{}).code||''; renderPage(); },
  pickBld(n){ this.st(); S.sp.bld=n; S.sp.room=(Sp.rooms()[0]||{}).code||''; renderPage(); },
  pickRoom(c){ this.st(); S.sp.room=c; renderPage(); }
};

/* ---------- 手写板（画画记录，Web 与移动端共用） ---------- */
const Pad = {
  cur:null,
  mount(id){ const c=$(id); if(!c||c.__pad) return; c.__pad=1;
    const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.lineCap='round'; ctx.lineJoin='round';
    const P = { ctx, drawing:false, color:'#1b2b3d', size:4 };
    const pos = e => { const r=c.getBoundingClientRect(); const px=(e.touches?e.touches[0].clientX:e.clientX)-r.left, py=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
      return [px*(c.width/r.width), py*(c.height/r.height)]; };
    const down = e => { const p=pos(e); P.drawing=true; ctx.beginPath(); ctx.moveTo(p[0],p[1]); e.preventDefault(); };
    const move = e => { if(!P.drawing) return; const p=pos(e); ctx.strokeStyle=P.color; ctx.lineWidth=P.size; ctx.lineTo(p[0],p[1]); ctx.stroke(); e.preventDefault(); };
    const up = () => { P.drawing=false; };
    c.addEventListener('mousedown',down); c.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    c.addEventListener('touchstart',down,{passive:false}); c.addEventListener('touchmove',move,{passive:false}); c.addEventListener('touchend',up);
    Pad.cur = P; },
  color(v){ if(Pad.cur) Pad.cur.color=v; },
  size(v){ if(Pad.cur) Pad.cur.size=+v; },
  clear(id){ const c=$(id); if(!c) return; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); },
  dataURL(id){ const c=$(id); return c? c.toDataURL('image/jpeg',0.62) : ''; }
};

/* ---------- 录音计时（模拟，Web 与移动端共用） ---------- */
const Rec = {
  tm:null, sec:0, label:null, endCb:null,
  fmt(s){ const p=n=>String(n).padStart(2,'0'); return Math.floor(s/60)+'\u0027'+p(s%60)+'\u0022'; },
  start(label,endCb){ this.stop(); this.sec=0; this.label=label; this.endCb=endCb; const el=$(label);
    this.tm=setInterval(()=>{ this.sec++; const t=$(this.label); if(t) t.textContent=this.fmt(this.sec); else this.stop(); },1000); },
  stop(){ if(this.tm){ clearInterval(this.tm); this.tm=null; } }
};

/* ---------- 打印层：先给纸质版式预览，再交给浏览器打印 ---------- */
function printHostClose(){ const h=$('printHost'); if(h) h.classList.remove('on'); }
function printSheets(html){
  let h = $('printHost');
  if(!h){ h=document.createElement('div'); h.id='printHost';
    h.innerHTML = '<div class="ph-bar"><b>🖨 纸质版式预览</b><span class="tiny">按纸张尺寸分页排版 · 点「打印」后可选另存为 PDF</span>'
      + '<div><button class="btn sm" onclick="printHostClose()">✕ 关闭</button> <button class="btn sm p" onclick="try{window.print()}catch(e){toast(\'当前环境不支持直接打印，已保留版式预览\',\'warn\')}">🖨 打印 / 另存 PDF</button></div></div><div class="ph-body" id="phBody"></div>';
    document.body.appendChild(h); }
  $('phBody').innerHTML = html; h.classList.add('on');
  setTimeout(()=>{ try{ window.print(); }catch(e){ toast('当前环境不支持直接打印，已生成纸质版式预览','warn'); } }, 260);
}

/* ---------- 房间设备接入（按房型给出标准配置并写入设备台账） ---------- */
const ROOM_DEV_PLAN = {
  '护理间':['床垫监测','紧急呼叫按钮','温湿度传感器','加湿器'],
  '单人间':['紧急呼叫按钮','温湿度传感器','照明'],
  '双人间':['紧急呼叫按钮','温湿度传感器','照明','智能插座'],
  '套间':['温湿度传感器','紧急呼叫按钮','空调/新风','智能插座'],
  '旅居客房':['运动手环','智能插座','温湿度传感器'],
  '公共空间':['照明','烟感报警','摄像头']
};
const DEV_PREFIX = { '床垫监测':'MAT','紧急呼叫按钮':'SOS','温湿度传感器':'TH','加湿器':'HU','照明':'LT','空调/新风':'AC','智能插座':'SOCK','智能手环':'BW','运动手环':'SPORT','烟感报警':'SMOKE','摄像头':'CAM' };
function addRoomDevices(code){
  const r = roomOf(code); if(!r){ toast('未找到该房间','err'); return; }
  const plan = ROOM_DEV_PLAN[r.type] || ['温湿度传感器','紧急呼叫按钮'];
  const raw = String(code).replace(/-/g,''); let n=0;
  plan.forEach(cate=>{
    const no = (DEV_PREFIX[cate]||'DEV')+'-'+raw+'-01';
    if((MODULES.device.rows||[]).some(d=>String(d.no).toUpperCase()===no)) return;
    MODULES.device.rows.unshift({ _id:++UID, no, name:code+' '+cate, cate, zone:r.zone||bldZone(r.bld)||r.area, pos:code+' 卧室', model:'MQTT-3.1.1', fw:'v1.0.0',
      online:'在线', batt:100, last:now(), bind:(r.guest&&r.status==='已入住')?r.guest:'—', install:today() }); n++;
  });
  persist(); renderPage();
  if(n) { toast(`已为 ${code}（${r.type}）接入 ${n} 台标准设备，可在设备台账查看`,'ok'); logAct('房间设备接入', code+' × '+n, '中'); }
  else toast('该房间标准配置已全部接入','warn');
}

/* ---------- 自定义页：空间资产总览 ---------- */
Object.assign(CUSTOM, {
  space(key){
    const m = MODULES[key]; const st = Sp.st();
    $('crumb').innerHTML = `首页 / 空间资产 / <b>${esc(m.title)}</b>`;
    const devs = MODULES.device.rows||[], rooms = MODULES.room.rows||[], blds = MODULES.building.rows||[];
    const areas = Array.from(new Set(blds.map(b=>b.area)));
    const on = devs.filter(d=>d.online==='在线').length;
    const live = rooms.filter(r=>r.status==='已入住').length, free = rooms.filter(r=>r.status==='空置').length;
    const kpi = [['🗺','分区', areas.length+' 个', '康养 / 文化 / 旅游 / 生活配套', ''],
      ['🏢','楼栋', blds.length+' 栋', '在用 '+blds.filter(b=>b.status==='在用').length+' · 维护 '+blds.filter(b=>b.status!=='在用').length, ''],
      ['🚪','房间总数', rooms.length+' 间', '床位 '+rooms.reduce((s,r)=>s+(+r.beds||0),0)+' 张', ''],
      ['🛏','已入住', live+' 间', '空置 '+free+' 间', '入住率 '+Math.round(live/rooms.length*100)+'%'],
      ['🔧','维修/清洁', rooms.filter(r=>['维修中','清洁中'].includes(r.status)).length+' 间', '预留 '+rooms.filter(r=>r.status==='预留').length+' 间', ''],
      ['📡','IoT 设备', devs.length+' 台', '在线 '+on+' 台', '在线率 '+Math.round(on/devs.length*100)+'%']];
    const curBld = blds.find(b=>b.name===st.bld) || blds[0] || {};
    const rs = Sp.rooms(curBld.name);
    const cur = rs.find(r=>r.code===st.room) || rs[0] || null;
    $('page').innerHTML = `<div class="page-h"><div><h2>🏗 空间资产总览</h2><p>${esc(m.desc)}　·　当前：${esc(st.area||curBld.area||'全部分区')} / ${esc(curBld.name||'—')}　·　房间与设备实时联动</p></div>
      <div class="acts"><button class="btn" onclick="App.go('admin','building')">🏢 楼栋台账</button><button class="btn" onclick="App.go('admin','room')">🚪 房间台账</button>
      <button class="btn" onclick="Crud.open('room')">＋ 新增房间</button><button class="btn p" onclick="App.go('admin','stay')">🔑 入住与退租办理</button></div></div>
    <div class="kpis" style="grid-template-columns:repeat(6,1fr)">${kpi.map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]}${k[4]?' · '+k[4]:''}</span></div>`).join('')}</div>
    <div class="sp-wrap">
      <div class="card"><div class="card-h"><h3>分区与楼栋</h3><span class="tiny">点击下钻</span></div><div class="card-b" style="padding:10px 12px">
        ${areas.map(a=>{ const bs=blds.filter(b=>b.area===a); return `<div class="sp-are${st.area===a?' on':''}" onclick="Sp.pickArea('${a}')">${a}<span>${bs.length} 栋 / ${(rooms.filter(r=>r.area===a).length)}</span></div>`
          + (st.area===a? bs.map(b=>{ const n=rooms.filter(r=>r.bld===b.name).length; return `<div class="sp-bld${b.name===st.bld?' on':''}" onclick="Sp.pickBld('${esc(b.name)}')"><i class="st ${b.status==='在用'?'g':b.status==='维护中'?'w':'r'}"></i>${esc(b.name)}<span>${n} 间</span></div>`; }).join(''):''); }).join('')}
        <div class="tiny" style="margin-top:10px">楼栋状态：${blds.filter(b=>b.status!=='在用').map(b=>esc(b.name)+'（'+esc(b.status)+'）').join('、')||'全部在用'}</div></div></div>
      <div class="card"><div class="card-h"><h3>${esc(curBld.name||'房间列表')} · 按楼层</h3><span class="tiny">${rs.length} 间 · 管家 ${esc(curBld.steward||'—')} · ${esc(curBld.elev||'')}</span></div>
      <div class="card-b">
        <div class="sp-lg"><span><i class="v"></i>空置</span><span><i class="o"></i>已入住</span><span><i class="m"></i>维修中</span><span><i class="r"></i>预留</span><span><i class="c"></i>清洁中</span></div>
        ${Sp.floors(curBld.name).map(f=>`<div class="sp-fl"><div class="sp-fl-t">${f.floor}F<span class="tiny">　${f.list.length} 间 · 在住 ${f.list.filter(r=>r.status==='已入住').length}</span></div>
          <div class="sp-tiles">${f.list.map(r=>{ const dcount=roomDevicesOf(r.code).length; return `<div class="sp-rm ${r.status}" onclick="Sp.pickRoom('${r.code}')"><b>${esc(r.code)}</b><span>${esc(r.type)}${r.guest?' · '+esc(r.guest):''}</span><i class="dv${dcount?' h':''}">${dcount?'📡 '+dcount:'📡 0'}</i></div>`; }).join('')}</div></div>`).join('')
          || '<div class="empty"><div class="e">🚪</div>该楼栋暂无房间记录，可点击「＋ 新增房间」录入</div>'}
      </div></div>
      <div class="card"><div class="card-h"><h3>房间详情</h3><span class="tiny">${cur?esc(cur.code):'未选择'}</span></div><div class="card-b" id="spDetail">${cur?spRoomHTML(cur):'<div class="tiny">请先在中间选择房间</div>'}</div></div>
    </div>`;
    if(!st.area && curBld.area) st.area = curBld.area;
    if(!st.room && cur) st.room = cur.code;
  }
});
function spRoomHTML(r){
  const devs = roomDevicesOf(r.code), stays = roomStayOf(r.code);
  const env = devs.filter(d=>['温湿度传感器','加湿器','空调/新风'].includes(d.cate));
  const ar = archiveOf(r.guest);
  return `<div class="dinfo" style="grid-template-columns:1fr 1fr">${[['code','房号'],['type','房型'],['beds','床位'],['size','面积(㎡)'],['orient','朝向'],['adapt','适老化'],['price','月租(元)'],['status','使用状态']].map(p=>`<div><label>${p[1]}</label>${esc(r[p[0]]===''||r[p[0]]==null?'—':r[p[0]])}</div>`).join('')}</div>
    <div class="card-h" style="padding:14px 0 8px"><h3>📡 IoT 设备（${devs.length}）</h3><span class="tiny">实时读数</span></div>
    ${devs.length? `<div class="sp-dvs">${devs.map(d=>`<div class="sp-dv"><b><span class="dot ${d.online==='在线'?'on':'al'}"></span>${esc(d.name)}</b><p>${liveReadings(d).map(x=>esc(x[0]+' '+x[1])).join('　')||esc(d.online)}</p><span class="mono">${esc(d.no)}</span></div>`).join('')}</div>`
      : '<div class="tiny">该房间尚未接入设备，可一键按房型标准配置接入。</div>'}
    <div class="mbtns" style="margin:10px 0 4px;flex-wrap:wrap"><button class="btn sm p" onclick="addRoomDevices('${r.code}')">＋ 接入标准设备</button>
      <button class="btn sm" onclick="Crud.open('device')">＋ 手动新增设备</button>
      <button class="btn sm" onclick="App.go('admin','iot')">📡 设备台账</button></div>
    <div class="card-h" style="padding:14px 0 8px"><h3>🔑 入住与合同（${stays.length}）</h3></div>
    ${stays.length? stays.map(s=>`<div class="sp-stay"><b>${esc(s.name)} · ${esc(s.pkg)}</b><p>合同 ${esc(s.no)} · ${esc(s.start)} → ${esc(s.end)} · 月费 ${Number(s.rent||0).toLocaleString()} 元</p>
      <p>状态：${tagHTML({tag:{'待签约':'blue','已绑定':'green','换房中':'warn','退租申请':'warn','已退租':'ink'}},s.status)}　绑定：${esc(s.band||'—')}</p></div>`).join('')
      : `<div class="tiny">${r.status==='空置'?'当前空置，可直接发起入住绑定。':'暂无有效合同记录。'}</div>`}
    <div class="mbtns" style="margin-top:10px;flex-wrap:wrap">
      ${r.status==='空置'?`<button class="btn sm g" onclick="S.kw.stay='';App.go('admin','stay');toast('请在入住绑定与退租中新增合同并绑定 ${r.code}','ok')">🔑 去办理入住绑定</button>`:''}
      ${r.status==='已入住'&&ar?`<button class="btn sm" onclick="Modal.close();detailArchive(MODULES.archive.rows.find(x=>x.name==='${esc(r.guest)}'))">📇 住客档案</button>`:''}
      ${r.status==='空置'?`<button class="btn sm" onclick="Crud.flow('room',${r._id},0)">🔧 安排维修</button>`:''}
      ${r.status==='维修中'?`<button class="btn sm g" onclick="Crud.flow('room',${r._id},1)">✅ 维修完成</button>`:''}
      <button class="btn sm" onclick="Crud.open('room',${r._id})">✏️ 编辑房间</button></div>
    <div class="tiny" style="margin-top:10px">${env.length?'环控摘要：'+env.map(d=>liveReadings(d)[0][0]+' '+liveReadings(d)[0][1]).join(' · '):'无环控设备'}${r.note?'<br>备注：'+esc(r.note):''}</div>`;
}

/* ============================================================
 *  温暖与传承 · 能力层（相册 / 日记 / AI 传记）
 *  Web 自定义页与 APP / 小程序端共用同一套数据与操作
 * ============================================================ */
const Warm = {
  album(id){ return (MODULES.album.rows||[]).find(r=>r._id===+id) || null; },
  diary(id){ return (MODULES.diary.rows||[]).find(r=>r._id===+id) || null; },
  bio(id){ return (MODULES.legacy.rows||[]).find(r=>r._id===+id) || null; },
  albums(owner, cate, all){ return (MODULES.album.rows||[]).filter(a=>(all||a.status!=='已销毁') && (!owner||a.owner===owner) && (!cate||cate==='全部'||a.cate===cate)); },
  diaries(owner, kind){ return (MODULES.diary.rows||[]).filter(d=>(!owner||d.name===owner) && (!kind||kind==='全部'||d.kind===kind)); },
  bios(owner){ return (MODULES.legacy.rows||[]).filter(b=>!owner||b.name===owner); },
  photos(a){ return (a && a.photos) || []; },
  sync(a){ a.cnt = Warm.photos(a).length; },
  save(){ persist(); Warm.refresh(); },
  who(){ const d = S.mobileRole && S.view!=='admin' ? S.mobileRole[S.view] : null;
    return (S.user && S.user.roleKey==='elder') ? S.user.name : (d==='elder'&&S.user?S.user.name:''); },
  /* Web 后台用共享弹层；APP / 小程序端一律用手机屏内弹层（MB.sheet） */
  isWeb(){ return !(S.view==='app' || S.view==='mp'); },
  dismiss(){ Modal.close(); if(typeof MB!=='undefined' && MB.close) MB.close(); },
  viewAlbum(id){ if(Warm.isWeb()) Warm.openAlbum(id); else Mob.wAlbum(id); },
  viewDiary(id){ if(Warm.isWeb()) Warm.openDiary(id); else Mob.wDiary(id); },
  viewBio(id){ if(Warm.isWeb()) Warm.openBio(id); else Mob.wBio(id); },

  /* ---------- 相册：新建 ---------- */
  newAlbum(owner){
    if(!Warm.isWeb()) return Mob.wNewAlbum(owner);
    const def = owner || Warm.who() || ELDER_NAMES[0];
    Modal.open('📸 新建相册（归属长者拥有完全的增删与销毁权）', `<div class="mform">
      <div class="field"><label>相册名称 *</label><input class="inp" id="wName" placeholder="如：1970s 厂门口的那些年"></div>
      <div class="field"><label>归属长者</label><select class="sel" id="wOwner">${ELDER_NAMES.map(n=>`<option${n===def?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
      <div class="field"><label>相册分类</label><select class="sel" id="wCate">${ALBUM_CATES.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>可见范围</label><div class="seg" id="wPriv">${['私密','家人可见','园区公开'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>拍摄地 / 来源</label><input class="inp" id="wPlace" placeholder="家里翻拍 / 园区实拍 / 老照片扫描"></div>
      <div class="field"><label>相册简介</label><textarea class="inp" id="wNote" rows="2" placeholder="这本相册想留给谁、想说些什么"></textarea></div>
      <div class="tiny">创建后即可添加照片；支持拍照上传、老照片扫描翻拍、手迹作品拍摄，以及引用园区活动集体相册。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.createAlbum()">创建并添加第一张</button>`);
    Warm.seg('wPriv');
  },
  seg(id){ const b=$(id); if(!b) return; b.onclick = e=>{ const x=e.target.closest('button'); if(!x) return; [...b.children].forEach(n=>n.classList.remove('on')); x.classList.add('on'); }; },
  segVal(id, dft){ const b=$(id); if(!b) return dft; const x=b.querySelector('button.on'); return x?x.dataset.v:dft; },
  createAlbum(){
    const name = ($('wName').value||'').trim();
    if(!name){ toast('请填写相册名称','err'); return; }
    const a = { _id:++UID, name, owner:$('wOwner').value, cate:$('wCate').value, cover:'📷', cnt:0, date:today(),
      priv:Warm.segVal('wPriv','家人可见'), share:'未分享', shareExp:'', printCnt:0, place:($('wPlace').value||'').trim(),
      status:'正常', photos:[], note:($('wNote').value||'').trim() };
    MODULES.album.rows.unshift(a); persist(); logAct('新建相册', name+'（'+a.owner+'）','低'); toast('相册「'+name+'」已创建','ok');
    Warm.addPhoto(a._id);
  },

  /* ---------- 相册：添加 / 删除照片 ---------- */
  addPhoto(id){
    const a = Warm.album(id); if(!a) return;
    if(!Warm.isWeb()) return Mob.wAddPhoto(id);
    Modal.open('🖼 向「'+esc(a.name)+'」添加照片（现有 '+Warm.photos(a).length+' 张）', `<div class="seg" id="pSrc">${['拍照上传','扫描翻拍','手迹作品','园区活动'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div>
      <div class="mform" style="margin-top:12px">
        <div class="field"><label>照片标题 *</label><input class="inp" id="pTitle" placeholder="如：1985 年 · 技术能手奖状"></div>
        <div class="field"><label>拍摄 / 年份日期</label><input class="inp" id="pDate" value="${today()}"></div>
        <div class="field"><label>画面内容（原型用图标代图）</label><div class="seg" id="pIco">${['📷','🏭','🌳','💑','🖊','🎤','🧣','🥟','🌅','🖼','🏆','👵'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div>
          <div class="tiny">接入相机后此处为真实缩略图，可选 <b>AI 清晰修复</b>、<b>黑白上色</b>、<b>OCR 认字</b>（演示按钮在照片详情内）。</div></div>
        <div class="field"><label>想说的话（图注，会成为传记素材）</label><textarea class="inp" id="pCap" rows="2" placeholder="这张照片背后的故事"></textarea></div>
        <div class="field"><label>语音配图（可选）</label><div class="rec-row"><button class="btn sm" onclick="Warm.recPhoto(this)">● 按住说话</button><span class="mono" id="pRecT">00'00\u0022</span><span class="tiny" id="pRecS">未录制</span></div></div>
      </div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn" onclick="Warm.openAlbum(${a._id})">返回相册</button><button class="btn p" onclick="Warm.savePhoto(${a._id})">保存这张照片</button>`);
    Warm.seg('pSrc'); Warm.seg('pIco');
  },
  recPhoto(btn){
    if(Rec.tm){ Rec.stop(); btn.textContent='● 按住说话'; $('pRecS').textContent='已录制 '+Rec.fmt(Rec.sec); $('pRecS').className='tag green'; return; }
    btn.textContent='■ 停止'; $('pRecS').textContent='录制中…'; $('pRecS').className='tag red'; Rec.start('pRecT');
  },
  savePhoto(id){
    const a = Warm.album(id); if(!a) return;
    const t = ($('pTitle').value||'').trim();
    if(!t){ toast('请填写照片标题','err'); return; }
    const recOn = !!Rec.tm; Rec.stop();
    a.photos = a.photos || [];
    a.photos.push({ t, ico:Warm.segVal('pIco','📷'), date:($('pDate').value||today()).trim(),
      cap:($('pCap').value||'').trim(), src:Warm.segVal('pSrc','拍照上传'),
      voice: recOn? Rec.fmt(Rec.sec) : '' });
    Warm.sync(a); a.status='正常'; persist(); logAct('相册添加照片', a.name+' → '+t, '低');
    toast('已添加《'+t+'》，相册共 '+a.cnt+' 张','ok');
    Warm.viewAlbum(a._id);
  },
  delPhoto(id, i){
    const a = Warm.album(id); if(!a) return; const p = a.photos[i]; if(!p) return;
    if(!confirm('确认删除照片《'+p.t+'》？删除后不可恢复（可从回收站找回 7 天）。')) return;
    a.photos.splice(i,1); Warm.sync(a); persist(); logAct('删除照片', a.name+' / '+p.t, '中'); Warm.refresh(); Warm.viewAlbum(a._id);
  },
  fixPhoto(id, i){ const a=Warm.album(id); const p=a&&a.photos[i]; if(!p) return;
    if(p.fixed){ toast('该照片已完成 AI 修复','warn'); return; }
    p.fixed=1; persist(); logAct('AI 照片修复', a.name+' / '+p.t, '低'); Warm.viewAlbum(a._id); toast('AI 已去除划痕并提升清晰度（演示）','ok'); },

  /* ---------- 相册：详情弹层 ---------- */
  openAlbum(id){
    const a = Warm.album(id); if(!a) return;
    if(!Warm.isWeb()) return Mob.wAlbum(id);
    const ps = Warm.photos(a);
    const body = `<div class="ab-h"><div class="ab-cover">${esc(a.cover||'📷')}</div>
      <div><h3>${esc(a.name)}</h3><p>${esc(a.owner)} · ${esc(a.cate)} · ${esc(a.place||'—')} · 创建 ${esc(a.date)}</p>
      <div class="ab-tags">${tagHTML({tag:{'私密':'ink','家人可见':'blue','园区公开':'green'}}, a.priv)}${tagHTML({tag:{'未分享':'ink','已生成链接':'green','已撤销':'warn'}}, a.share)}${tagHTML({tag:{'正常':'green','已销毁':'red'}}, a.status)}
        <span class="tag purple">${ps.length} 张</span><span class="tag">已打印 ${a.printCnt||0} 次</span></div></div></div>
      ${a.note?`<div class="ab-note">${esc(a.note)}</div>`:''}
      <div class="ab-grid">${ps.length? ps.map((p,i)=>`<div class="ab-ph"><div class="im">${p.img?`<img src="${p.img}">`:esc(p.ico||'📷')}${p.fixed?'<i class="fx">AI 修复</i>':''}</div>
        <b>${esc(p.t)}</b><p>${esc(p.cap||'（未填写图注）')}</p><span>${esc(p.date||'')}${p.src?' · '+esc(p.src):''}${p.voice?' · 🎙 '+esc(p.voice):''}</span>
        <div class="ab-ops"><button class="btn sm" onclick="Warm.fixPhoto(${a._id},${i})">✨ AI 修复</button><button class="btn sm" onclick="Warm.photoNote(${a._id},${i})">💬 补充</button><button class="btn sm d" onclick="Warm.delPhoto(${a._id},${i})">🗑 删除</button></div></div>`).join('')
        : '<div class="empty"><div class="e">🖼</div>还没有照片，点击下方「添加照片」</div>'}</div>`;
    Modal.open('📸 相册详情 · '+esc(a.name), body,
      `<button class="btn" onclick="Modal.close()">关闭</button>
       <button class="btn p" onclick="Warm.addPhoto(${a._id})">＋ 添加照片</button>
       <button class="btn g" onclick="Warm.share(${a._id})">🔗 分享</button>
       <button class="btn" onclick="Warm.printSheet(${a._id})">🖨 打印成纸质相册</button>
       <button class="btn d" onclick="Warm.destroy(${a._id})">🗑 销毁相册</button>`, true);
  },
  photoNote(id, i){
    const a = Warm.album(id); const p = a && a.photos[i]; if(!p) return;
    if(!Warm.isWeb()) return Mob.wPhotoNote(id, i);
    Modal.open('💬 补充图注 · '+esc(p.t), `<div class="mform"><div class="field"><label>这张照片的故事</label>
      <textarea class="inp" id="pnCap" rows="4">${esc(p.cap||'')}</textarea></div>
      <div class="field"><label>画面内容</label><div class="seg" id="pnIco">${['📷','🏭','🌳','💑','🖊','🎤','🧣','🥟','🌅','🖼','🏆','👵'].map(x=>`<button class="${x===(p.ico||'📷')?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="tiny">图注会以「第一人称」进入 AI 传记草稿，写得越具体，传记越像本人。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.saveNote(${a._id},${i})">保存</button>`);
    Warm.seg('pnIco');
  },
  saveNote(id, i){ const a=Warm.album(id), p=a&&a.photos[i]; if(!p) return; p.cap=($('pnCap').value||'').trim(); p.ico=Warm.segVal('pnIco',p.ico); persist(); Warm.refresh(); toast('图注已更新','ok'); Warm.viewAlbum(a._id); },

  /* ---------- 相册：分享 / 撤销 ---------- */
  share(id){
    const a = Warm.album(id); if(!a) return;
    if(!Warm.isWeb()) return Mob.wShare(id);
    const code = 'ALB'+String(a._id).padStart(4,'0')+String(Date.now()).slice(-4);
    const link = 'https://ky-park.cn/a/'+code;
    Modal.open('🔗 分享相册 · '+esc(a.name), `<div class="mform">
      <div class="field"><label>分享范围</label><div class="seg" id="shScope">${['仅家人','园区公开','凭链接任何人'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>有效期</label><div class="seg" id="shExp">${['7 天','30 天','长期有效'].map((x,i)=>`<button class="${i===1?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>接收对象</label><input class="inp" id="shTo" placeholder="如：徐乐（女儿）/ 家庭群"></div>
      <div class="field"><label>分享链接</label><div class="share-box"><span class="mono" id="shLink">${link}</span><button class="btn sm" onclick="navigator.clipboard&&navigator.clipboard.writeText('${link}');toast('链接已复制，长者端可一键转发','ok')">复制</button></div>
        <div class="tiny">分享码：<b class="mono">${code}</b>　·　长者可在相册页随时「撤销分享」，撤销后链接立即失效；打印与浏览行为会回写到运营日志。</div></div>
      </div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.doShare(${a._id})">生成分享</button>`);
    Warm.seg('shScope'); Warm.seg('shExp');
  },
  doShare(id){
    const a = Warm.album(id); if(!a) return;
    a.share='已生成链接'; a.shareTo=($('shTo').value||'').trim()||'家人';
    a.shareScope=Warm.segVal('shScope','仅家人');
    const exp=Warm.segVal('shExp','30 天');
    const d=new Date(); if(exp==='7 天') d.setDate(d.getDate()+7); else if(exp==='30 天') d.setDate(d.getDate()+30);
    a.shareExp = exp==='长期有效'? '长期有效' : d.toISOString().slice(0,10);
    if(a.priv==='私密') a.priv='家人可见';
    persist(); logAct('分享相册', a.name+' → '+a.shareScope+'（'+a.shareExp+'）','中'); Warm.refresh();
    toast('分享已生成：'+a.shareScope+' · 有效期至 '+a.shareExp,'ok'); Warm.viewAlbum(a._id);
  },

  /* ---------- 相册：打印成纸质 ---------- */
  printSheet(id){
    const a = Warm.album(id); if(!a) return;
    if(!Warm.isWeb()) return Mob.wPrint(id);
    Modal.open('🖨 打印成纸质相册 · '+esc(a.name), `<div class="mform">
      <div class="field"><label>纸张规格</label><div class="seg" id="prPaper">${['A4 哑光','12 寸相簿','拍立得 3寸'].map((x,i)=>`<button class="${i===1?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>装订方式</label><div class="seg" id="prBind">${['精装硬壳','蝴蝶对裱','环装可拆'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>打印份数</label><input class="inp" id="prCopies" type="number" min="1" max="9" value="1"></div>
      <div class="field"><label>随册附印</label><div class="ck-row">${['图注全文','长者可手写页','AI 传记摘录','二维码回到电子相册'].map((x,i)=>`<label class="ck2"><input type="checkbox" ${i<2?'checked':''}> ${x}</label>`).join('')}</div></div>
      <div class="tiny">原型会真实调用浏览器打印：可选择的「另存为 PDF」即得到排版好的纸质版式；园区打印室接单后 1 个工作日送出。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.doPrint(${a._id})">生成版式并打印</button>`);
    Warm.seg('prPaper'); Warm.seg('prBind');
  },
  doPrint(id){
    const a = Warm.album(id); if(!a) return;
    const web = Warm.isWeb();
    const paper=Warm.segVal('prPaper','12 寸相簿'), bind=Warm.segVal('prBind','精装硬壳'), copies=Math.max(1, +($('prCopies').value||1));
    const ps=Warm.photos(a);
    const sheets = `<div class="pt-cover"><h1>${esc(a.name)}</h1><p>${esc(a.owner)} · ${esc(a.cate)}</p><div class="big">${esc(a.cover||'📷')}</div>
      ${a.note?`<p class="note">${esc(a.note)}</p>`:''}<p class="meta">${paper} · ${bind} · 共 ${Math.max(1,ps.length)} 页 · ${copies} 册 · 打印时间 ${now()}</p></div>`
      + (ps.length? ps.map((p,i)=>`<div class="pt-page"><div class="pt-im">${p.img?`<img src="${p.img}">`:esc(p.ico||'📷')}</div>
        <h2>${i+1}. ${esc(p.t)}</h2><p class="cap">${esc(p.cap||'')}</p><p class="dt">${esc(p.date||'')}${p.src?' · 来源：'+esc(p.src):''}</p></div>`).join('')
        : `<div class="pt-page"><div class="pt-im">🖼</div><h2>第 1 页 · 等待放入照片</h2><p class="cap">这本相册还是空的，可以先打印封面，再逐步补充。</p></div>`);
    printSheets(sheets);
    a.printCnt = (a.printCnt||0) + copies;
    persist(); logAct('打印纸质相册', a.name+' × '+copies+' 册（'+paper+'/'+bind+'）','低'); Warm.refresh();
    if(!web){ toast('《'+a.name+'》已按 '+paper+'/'+bind+' × '+copies+' 册下单，累计打印 '+a.printCnt+' 次','ok'); return; }
    Modal.open('🖨 已生成纸质版式', `<div class="ok-box"><div class="e">🖨</div><b>《${esc(a.name)}》打印任务已生成</b>
      <p>规格：${paper} · ${bind} · ${copies} 册 · 共 ${Math.max(1,ps.length)} 页<br>累计打印 ${a.printCnt} 次　·　打印室接单后 1 个工作日送出，可由家属到园区服务台领取。</p>
      <div class="mbtns"><button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="Warm.printSheet(${a._id})">重新打印</button><button class="btn g" onclick="Warm.openAlbum(${a._id})">返回相册</button></div></div>`);
  },

  /* ---------- 相册：销毁 ---------- */
  destroy(id){
    const a = Warm.album(id); if(!a) return;
    if(!confirm('确认销毁相册《'+a.name+'》？\n销毁后：照片不再展示、分享链接立即失效、AI 传记中引用将标记为「素材已撤销」。\n（数据保留在回收站 30 天，可由超级管理员恢复）')) return;
    a.status='已销毁'; a.share = a.share==='已生成链接' ? '已撤销' : a.share; a.destroyAt=now();
    Warm.dismiss(); persist(); logAct('销毁相册', a.name+'（'+a.owner+'）','高'); Warm.refresh();
    toast('相册已销毁，分享链接同时失效（回收站保留 30 天）','warn');
  },
  restore(id){ const a=Warm.album(id); if(!a) return; a.status='正常'; delete a.destroyAt; Warm.dismiss(); persist(); logAct('恢复相册', a.name,'中'); Warm.refresh(); toast('相册已恢复','ok'); },

  /* ---------- 日记：四类记录（笔记 / 录音 / 画画 / 拍照） ---------- */
  diaryPanel(kind, owner, inSheet){
    const who = owner || Warm.who() || ELDER_NAMES[0];
    const k = kind || '笔记';
    const head = `<div class="seg dy-seg" id="dyKind">${DIARY_KINDS.map(x=>`<button class="${x===k?'on':''}" data-v="${x}" onclick="Warm.setKind('${x}')">${({'笔记':'🖊 写笔记','录音':'🎙 说录音','画画':'🎨 画两笔','拍照':'📷 拍张照'})[x]}</button>`).join('')}</div>`;
    let body = '';
    if(k==='笔记') body = `<div class="field"><label>标题</label><input class="inp" id="dTitle" placeholder="今天想记下什么"></div>
      <div class="field"><label>正文（支持手写识别文字直接粘进来）</label><textarea class="inp" id="dText" rows="${inSheet?4:5}" placeholder="今天做了什么事、想对谁说什么"></textarea></div>`;
    else if(k==='录音') body = `<div class="field"><label>标题</label><input class="inp" id="dTitle" placeholder="这段录音叫什么"></div>
      <div class="rec-row"><button class="btn p" id="dRecBtn" onclick="Warm.recDiary(this)">● 开始说话</button><span class="mono" id="dRecT">00'00\u0022</span><span class="tiny" id="dRecS">未录制</span></div>
      <div class="field" style="margin-top:10px"><label>自动转写文字（可手工修正）</label><textarea class="inp" id="dText" rows="3" placeholder="录音结束后自动生成转写初稿，可自行修正"></textarea></div>`;
    else if(k==='画画') body = `<div class="field"><label>作品名称</label><input class="inp" id="dTitle" placeholder="这幅画叫什么"></div>
      <div class="pad-tools"><div class="seg" id="padColor">${['#1b2b3d','#e5484d','#1668dc','#00b578','#f5a623','#7c5cff'].map((c,i)=>`<button class="${i?'':'on'}" data-v="${c}" style="background:${c};color:#fff" onclick="Pad.color('${c}')">●</button>`).join('')}</div>
        <div class="seg" id="padSize">${[['细','2'],['中','4'],['粗','8']].map((x,i)=>`<button class="${i===1?'on':''}" data-v="${x[1]}" onclick="Pad.size(${x[1]})">${x[0]}</button>`).join('')}</div>
        <button class="btn sm" onclick="Pad.clear('dPad')">🧽 擦干净</button></div>
      <canvas id="dPad" class="pad" width="640" height="300"></canvas>
      <div class="field" style="margin-top:8px"><label>配一句话（会写进传记）</label><input class="inp" id="dText" placeholder="如：凭记忆画了小时候的老屋和井台"></div>`;
    else body = `<div class="field"><label>照片标题</label><input class="inp" id="dTitle" placeholder="如：银杏叶夹在书里了"></div>
      <div class="field"><label>拍摄场景</label><div class="seg" id="dScene">${['园区实景','家人合影','手迹作品','旅居途中','活动瞬间'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="shot" onclick="toast('原型以占位图代表相机预览；接入后可真实拍照','warn')"><div><div class="cam">📷</div><span>点击模拟拍照（支持 OCR 认字与自动增强）</span></div></div>
      <input type="hidden" id="dIcoShot" value="📷">
      <div class="field" style="margin-top:10px"><label>这张照片说明</label><textarea class="inp" id="dText" rows="3"></textarea></div>`;
    return `<div class="dy-panel">${head}
      <div class="dy-form">
        <div class="field"><label>记录人</label><select class="sel" id="dName">${ELDER_NAMES.map(n=>`<option${n===who?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
        ${body}
        <div class="two"><div class="field"><label>心情</label><div class="seg" id="dMood">${['平静','开心','感恩','想家','有点累'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>可见范围</label><div class="seg" id="dAuth">${['家人可见','私密','园区公开'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div></div>
      <div class="mbtns"><button class="btn" onclick="Warm.resetDiary()">清空</button><button class="btn p blk" onclick="Warm.saveDiary()">💾 保存这条日记</button></div>
      <div class="tiny">保存后可在下方列表回看；日记与相册图注都能作为 <b>AI 传记素材</b>，长者随时可取消引用。</div></div></div>`;
  },
  afterDiary(){ ['dMood','dAuth','dScene'].forEach(id=>Warm.seg(id)); const k=S.dyKind||'笔记';
    if(k==='画画') Pad.mount('dPad'); if(k==='拍照'){ const s=$('dScene'); if(s) s.onclick = e=>{ const b=e.target.closest('button'); if(!b) return; [...s.children].forEach(x=>x.classList.remove('on')); b.classList.add('on'); const map={'园区实景':'🌳','家人合影':'💑','手迹作品':'🖊','旅居途中':'🌅','活动瞬间':'🎤'}; const h=$('dIcoShot'); if(h) h.value=map[b.dataset.v]||'📷'; }; } },
  setKind(k){ S.dyKind = k; if(S.view==='admin') Warm.refresh(); else renderMobile(S.view); },
  resetDiary(){ S.dyKind='笔记'; Warm.setKind('笔记'); },
  recDiary(btn){
    if(Rec.tm){ const sec=Rec.sec; Rec.stop(); btn.textContent='● 开始说话'; const s=$('dRecS'); if(s){ s.textContent='已录制 '+Rec.fmt(sec); s.className='tag green'; }
      const t=$('dText'); if(t && !t.value.trim()) t.value='【转写】'+ (sec<15? '今天声音有点哑，说的不多，就是想录下这个声音。' : '刚那会儿精神好，我把以前的事说了一段，请帮我看看转得对不对。');
      return; }
    btn.textContent='■ 停止'; const s=$('dRecS'); if(s){ s.textContent='录制中…'; s.className='tag red'; } Rec.start('dRecT');
  },
  saveDiary(){
    const k = S.dyKind || '笔记';
    const title = ($('dTitle').value||'').trim();
    if(!title){ toast('请填写标题','err'); return; }
    let content = ($('dText').value||'').trim(), img='', dur='';
    if(k==='录音'){ const sec=Rec.sec; Rec.stop(); dur=sec? Rec.fmt(sec):'0\u002715"'; content = content.startsWith('【转写】')? content : (content? '【转写】'+content : '【转写】（本次未补充转写文字）'); }
    else if(k==='画画'){ img = Pad.dataURL('dPad')? '🎨' : '🎨'; content = content || '自己在画板上涂了一幅。'; }
    else if(k==='拍照'){ img = ($('dIcoShot')&&$('dIcoShot').value)||'📷'; content = content || '拍了这张，当时想说点什么。'; }
    const d=new Date(); const p=n=>String(n).padStart(2,'0');
    const row = { _id:++UID, name:$('dName').value, title, kind:k, date:today(), time:p(d.getHours())+':'+p(d.getMinutes()),
      content, img, dur, mood:Warm.segVal('dMood','平静'), auth:Warm.segVal('dAuth','家人可见'),
      from: S.view==='admin'?'Web 后台':(S.view==='mp'?'小程序端':'APP 端'), bio:'未引用' };
    if(k==='画画' && $('dPad')) row.sketch = Pad.dataURL('dPad');
    MODULES.diary.rows.unshift(row); persist(); logAct('写时光日记', row.name+'《'+title+'》（'+k+'）','低');
    S.diarySel = S.diarySel||{}; S.diarySel[row._id]=true;
    toast('已保存：'+k+'《'+title+'》','ok');
    if(S.view==='admin'){ Warm.refresh(); } else { renderMobile(S.view); }
  },
  openDiary(id){
    const d = Warm.diary(id); if(!d) return;
    if(!Warm.isWeb()) return Mob.wDiary(id);
    Modal.open('📔 '+esc(d.title), `<div class="dy-view">
      <div class="dy-meta">${esc(d.name)} · ${esc(d.kind)} · ${esc(d.date)} ${esc(d.time||'')} · ${esc(d.from||'')} ${d.dur?'· 时长 '+esc(d.dur):''}</div>
      <div class="dy-tags">${tagHTML({tag:{'笔记':'blue','录音':'purple','画画':'green','拍照':'warn'}}, d.kind)}${tagHTML({tag:{'家人可见':'green','私密':'ink','园区公开':'blue'}}, d.auth)}${tagHTML({tag:{'已引用':'green','未引用':'ink'}}, d.bio)}<span class="tag purple">心情 ${esc(d.mood)}</span></div>
      ${d.kind==='录音'? `<div class="play"><button class="btn sm p" onclick="Warm.play(this)">▶ 播放</button><div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="mono">${esc(d.dur||'')}</span></div>`:''}
      ${d.sketch? `<div class="dy-img"><img src="${d.sketch}"></div>` : (d.img? `<div class="dy-img big">${esc(d.img)}</div>`:'')}
      <div class="dy-text">${esc(d.content||'（未填写内容）')}</div></div>`,
      `<button class="btn" onclick="Modal.close()">关闭</button>
       <button class="btn ${d.bio==='已引用'?'':'g'}" onclick="Warm.toggleBio(${d._id})">${d.bio==='已引用'?'➖ 取消传记引用':'＋ 用作传记素材'}</button>
       <button class="btn" onclick="Warm.toAlbum(${d._id})">📸 归入相册</button>
       <button class="btn d" onclick="Warm.delDiary(${d._id})">🗑 删除</button>`);
  },
  play(btn){ if(btn.dataset.on){ btn.dataset.on=''; btn.textContent='▶ 播放'; const w0=btn.parentNode.querySelector('.wave'); if(w0) w0.classList.remove('run'); return; }
    btn.dataset.on='1'; btn.textContent='⏸ 播放中'; const w=btn.parentNode.querySelector('.wave'); if(w) w.classList.add('run');
    setTimeout(()=>{ if(btn.isConnected){ btn.dataset.on=''; btn.textContent='▶ 播放'; if(w) w.classList.remove('run'); toast('录音播放完毕（原型为模拟）','ok'); } }, 1600); },
  toggleBio(id){ const d=Warm.diary(id); if(!d) return;
    const keep = ($('mask') && $('mask').classList.contains('on')) || !!$('mbSheet');
    d.bio = d.bio==='已引用'?'未引用':'已引用'; persist(); logAct('日记传记引用', d.name+'《'+d.title+'》→ '+d.bio,'低'); Warm.refresh();
    if(keep) Warm.viewDiary(id);
    toast(d.bio==='已引用'?'已加入 AI 传记素材':'已从传记素材中移出','ok'); },
  toAlbum(id){ const d=Warm.diary(id); if(!d) return;
    if(!Warm.isWeb()) return Mob.wToAlbum(id);
    const list = Warm.albums(d.name,'',false);
    Modal.open('📸 将日记归入相册 · '+esc(d.title), `<div class="mform"><div class="field"><label>选择相册（归属：${esc(d.name)}）</label>
      <select class="sel" id="taAlb">${list.length? list.map(a=>`<option value="${a._id}">${esc(a.name)}（${Warm.photos(a).length} 张）</option>`).join('') : '<option value="">暂无相册，将新建一本「日记手记」</option>'}</select></div>
      <div class="tiny">笔记与录音将生成一张带正文摘录的卡片图；画画与拍照则直接使用原图。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.doToAlbum(${d._id})">确定归入</button>`); },
  doToAlbum(id){ const d=Warm.diary(id); if(!d) return; let a=Warm.album(($('taAlb')&&$('taAlb').value)||0);
    if(!a){ a={ _id:++UID, name:d.name+'的日记手记', owner:d.name, cate:'手迹作品', cover:'📔', cnt:0, date:today(), priv:d.auth==='私密'?'私密':'家人可见',
      share:'未分享', shareExp:'', printCnt:0, place:'时光日记', status:'正常', photos:[], note:'由日记内容归集而成' }; MODULES.album.rows.unshift(a); }
    a.photos = a.photos||[];
    a.photos.push({ t:d.title, ico: d.sketch?'🎨':(d.img||({'笔记':'🖊','录音':'🎙','画画':'🎨','拍照':'📷'})[d.kind]), date:d.date, cap:(d.content||'').replace('【转写】',''), src:'来自时光日记', sketch:d.sketch||'' });
    Warm.sync(a); d.bio='已引用'; persist(); Warm.dismiss(); logAct('日记归入相册', d.title+' → '+a.name,'低'); Warm.refresh(); toast('已归入相册《'+a.name+'》','ok'); Warm.viewAlbum(a._id); },
  delDiary(id){ const d=Warm.diary(id); if(!d) return; if(!confirm('确认删除日记《'+d.title+'》？')) return;
    MODULES.diary.rows = MODULES.diary.rows.filter(x=>x._id!==+id); persist(); Warm.dismiss(); logAct('删除日记', d.name+' / '+d.title,'中'); Warm.refresh(); toast('已删除','warn'); },
  diaryChips(owner){ const ds=Warm.diaries(owner,''); return ds.length? ds.map(d=>`<span class="tag ${d.kind==='录音'?'purple':d.kind==='画画'?'green':d.kind==='拍照'?'warn':'blue'}">${esc(d.kind)} ${esc(d.title)}</span>`).join(' ') : '<span class="tiny">暂无日记</span>'; },

  /* ---------- 传承 · AI 传记 ---------- */
  refresh(){ if(S.view==='admin') renderPage(); else if(S.view==='app'||S.view==='mp') renderMobile(S.view); },
  chaptersOf(name, style, aIds, dIds, fam){
    const CN=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    const albs = aIds.map(i=>Warm.album(i)).filter(Boolean);
    const dis  = dIds.map(i=>Warm.diary(i)).filter(Boolean);
    const phN  = albs.reduce((s,a)=>s+Warm.photos(a).length, 0);
    const tone = style==='家书体'? '亲爱的家人：' : style==='口述实录'? '（以下为本人原话，只作了顺句处理）' : '';
    const out = [];
    out.push({ t:'序 · 这本册子是怎么来的', c: tone+'这些内容来自我在园区留下的 '+dis.length+' 篇日记与 '+albs.length+' 本相册（共 '+phN+' 张照片）。文字是系统从我自己写的、自己说的话里拼起来的，后来我又自己改过。' });
    albs.forEach((a,i)=>{
      const ps = Warm.photos(a);
      const lines = ps.length? ps.map(p=>{
        const y = p.date && /^\d{4}/.test(p.date)? p.date.slice(0,4)+' 年 ' : '';
        return (style==='编年史'? y+'：' : y? y+'，' : '')+p.t+'——'+(p.cap||'这张照片我记不太清细节了，只记得当时很高兴。');
      }).join('；')+'。' : '这本相册里的照片还没补充图注，先从封面开始吧。';
      out.push({ t:'第'+CN[i]+'章 · '+a.name, c:(a.cate==='人生历程'?'回头一看，那些年真的过得飞快。':a.cate==='旅居风景'?'在园区住久了，四季都是景。':a.cate==='手迹作品'?'字写得不好，但是我自己写的。':'')+(tone||'')+lines+'（素材来自相册《'+a.name+'》，'+ps.length+' 张，'+a.date+' 建立。）' });
    });
    const wr = dis.filter(d=>d.kind!=='录音'), vc = dis.filter(d=>d.kind==='录音');
    if(wr.length) out.push({ t:'日常 · 我写下来的日子', c: wr.map(d=>d.date+'　'+d.title+'：'+String(d.content||'').replace('【转写】','')).join('\n') });
    if(vc.length) out.push({ t:'声音 · 我录下来的话', c: vc.map(d=>d.date+'　'+d.title+'：'+String(d.content||'').replace('【转写】','')).join('\n') });
    out.push({ t:'后记 · 想留给谁', c:'这本册子想交给'+(fam||'家人')+'。字是我自己的字，事情是我自己的事情。要是哪天我不在了，翻开它就像我还在说话。' });
    return out;
  },
  genForm(owner){
    if(!Warm.isWeb()) return Mob.wGen(owner);
    const who = owner || Warm.who() || ELDER_NAMES[0];
    const albs = Warm.albums(who,'',false), dis = Warm.diaries(who,'');
    const ar = archiveOf(who);
    const fam = ar && ar.family ? String(ar.family).split(/[、,，]/)[0] : '';
    if(!albs.length && !dis.length){ toast(who+' 还没有相册或日记，请先创建温暖素材','warn'); return; }
    Modal.open('🕯 联动日记与相册 · 辅生成 AI 个人传记', `<div class="lgc-wiz">
      <div class="two"><div class="field"><label>传主</label><select class="sel" id="gName" onchange="Warm.genRefresh()">${ELDER_NAMES.map(n=>`<option${n===who?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label>传记名</label><input class="inp" id="gTitle" value=""></div></div>
      <div class="field"><label>体裁</label><div class="seg" id="gStyle">${BIO_STYLES.map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div>
        <div class="tiny">温情回忆录：第一人称回忆；家书体：写给家人的口吻；编年史：按年份记事；口述实录：保留原话。</div></div>
      <div class="field"><label>交付对象</label><input class="inp" id="gFam" value="${esc(fam||'子女')}"></div>
      <div id="gMats"><div class="tiny">正在加载素材…</div></div>
      <div class="lgc-tip">⚠ AI 只负责把长者的文字与照片串成草稿，<b>全部内容由长者与家属自由改写</b>；定稿前不对外展示，也不会自动推送。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.startGen()">🤖 生成传记草稿</button>`, true);
    Warm.seg('gStyle'); $('gTitle').value = who+'的人生小记'; Warm.genRefresh();
  },
  genRefresh(){
    const who = $('gName').value; $('gTitle').value = who+'的人生小记';
    const albs = Warm.albums(who,'',false), dis = Warm.diaries(who,'');
    const box = $('gMats'); if(!box) return;
    box.innerHTML = `<div class="lgc-mat"><h4>📸 相册素材（${albs.length}）</h4><div class="lgc-cks">${albs.length? albs.map(a=>`<label class="ck3"><input type="checkbox" value="${a._id}" data-t="a" ${Warm.photos(a).length?'checked':''}> <b>${esc(a.name)}</b><span>${Warm.photos(a).length} 张 · ${esc(a.cate)}</span></label>`).join('') : '<span class="tiny">该长者暂无相册</span>'}</div></div>
      <div class="lgc-mat"><h4>📔 日记素材（${dis.length}）</h4><div class="lgc-cks">${dis.length? dis.map(d=>`<label class="ck3"><input type="checkbox" value="${d._id}" data-t="d" ${d.bio==='已引用'?'checked':''}> <b>${esc(d.title)}</b><span>${esc(d.kind)} · ${esc(d.date)}</span></label>`).join('') : '<span class="tiny">该长者暂无日记</span>'}</div></div>`;
  },
  startGen(){
    const name=$('gName').value, style=Warm.segVal('gStyle','温情回忆录'), title=($('gTitle').value||'').trim()||name+'的人生小记';
    const fam=($('gFam').value||'').trim()||'家人';
    const cks = [...document.querySelectorAll('#gMats input[type=checkbox]')].filter(c=>c.checked);
    const aIds = cks.filter(c=>c.dataset.t==='a').map(c=>+c.value), dIds = cks.filter(c=>c.dataset.t==='d').map(c=>+c.value);
    if(!aIds.length && !dIds.length){ toast('至少勾选一本相册或一篇日记作为素材','err'); return; }
    const chs = Warm.chaptersOf(name, style, aIds, dIds, fam);
    const phN = aIds.reduce((s,i)=>{ const a=Warm.album(i); return s+(a?Warm.photos(a).length:0); },0);
    const b = { _id:++UID, name, title, style, vol:'第'+(Warm.bios(name).length+1)+'卷', srcDiary:dIds.length, srcPhoto:phN,
      chapters:[], progress:0, status:'生成中', by:(S.user&&S.user.name)||'系统', time:now(), family:fam, printCnt:0,
      matAlbums:aIds, matDiary:dIds, note:'AI 初稿：基于 '+dIds.length+' 篇日记与 '+aIds.length+' 本相册生成，待长者在自由编写后定稿。' };
    MODULES.legacy.rows.unshift(b);
    dIds.forEach(i=>{ const d=Warm.diary(i); if(d) d.bio='已引用'; });
    aIds.forEach(i=>{ const a=Warm.album(i); if(a){ a.bioRef=b.title; } });
    persist(); Warm.dismiss(); Warm.refresh(); logAct('AI 生成传记', name+'《'+title+'》','中');
    Warm.animate(b._id, chs);
  },
  animate(id, chs){
    let i=0;
    const tm = setInterval(()=>{
      const b = Warm.bio(id); if(!b || b.status!=='生成中'){ clearInterval(tm); return; }
      i++; b.chapters = chs.slice(0,i); b.progress = Math.round(i/chs.length*95); b.time=now();
      persist(); Warm.refresh();
      if(i>=chs.length){ clearInterval(tm); b.progress=100; b.status='草稿'; persist(); Warm.refresh();
        logAct('传记草稿完成', b.name+'《'+b.title+'》'+chs.length+' 章','中');
        toast('AI 草稿已生成 '+chs.length+' 章，可自由改写','ok'); Warm.viewBio(b._id); }
    }, 520);
  },
  openBio(id){
    const b = Warm.bio(id); if(!b) return;
    if(!Warm.isWeb()) return Mob.wBio(id);
    const chs = b.chapters||[];
    const body = `<div class="lgc-h"><div class="lgc-vol">${esc(b.style)}</div>
      <div><h3>${esc(b.title)}</h3><p>传主 ${esc(b.name)} · ${esc(b.vol||'')} · 整理人 ${esc(b.by||'—')} · 更新 ${esc(b.time||'')}</p>
        <div class="ab-tags">${tagHTML({tag:{'草稿':'ink','生成中':'blue','已成稿':'green','已交付':'purple'}}, b.status)}<span class="tag blue">${chs.length} 章</span>
        <span class="tag">素材：日记 ${b.srcDiary||0} 篇 · 照片 ${b.srcPhoto||0} 张</span><span class="tag purple">完成度 ${b.progress||0}%</span></div></div></div>
      <div class="prog"><i style="width:${b.progress||0}%"></i></div><div class="tiny" style="margin:6px 0 12px">${b.status==='生成中'?'AI 正在逐章生成，完成后将自动进入可编辑状态':'草稿已完成，逐章点「保存」写入'}</div>
      ${chs.length? chs.map((c,i)=>`<div class="lgc-ch"><div class="lgc-ch-h"><b>${esc(c.t)}</b><span class="tiny">${(c.c||'').length} 字 · ${c.edited?'已由本人改写':'AI 初稿'}</span></div>
        <textarea class="inp" id="ch${i}" rows="${Math.min(6,Math.max(2,Math.ceil((String(c.c||'').length+14)/28)))}">${esc(c.c||'')}</textarea>
        <div class="lgc-ch-ops"><button class="btn sm" onclick="Warm.saveOne(${b._id},${i})">💾 保存本章</button>
          <button class="btn sm" onclick="Warm.polish(${b._id},${i})">🤖 换个说法</button>
          <button class="btn sm" onclick="Warm.fromMate(${b._id},${i})">📔 引用原文</button>
          <button class="btn sm d" onclick="Warm.delChapter(${b._id},${i})">🗑 删章</button></div></div>`).join('')
        : '<div class="empty"><div class="e">🕯</div>草稿生成中…</div>'}
      ${b.note?`<div class="field" style="margin-top:12px"><label>后记 / 备注</label><textarea class="inp" id="lgNote" rows="2">${esc(b.note)}</textarea></div>`:''}`;
    Modal.open('🕯 自由编写传记 · '+esc(b.title), body,
      b.status==='生成中'? `<button class="btn" onclick="Modal.close()">后台生成，先关闭</button>`
      : `<button class="btn" onclick="Modal.close()">关闭</button>
         <button class="btn" onclick="Warm.saveChapters(${b._id})">💾 全部保存</button>
         <button class="btn" onclick="Warm.addChapter(${b._id})">＋ 加一章</button>
         <button class="btn g" onclick="Warm.finalize(${b._id})">✅ 定稿</button>
         <button class="btn" onclick="Warm.printBio(${b._id})">🖨 打印成书</button>
         <button class="btn p" onclick="Warm.deliver(${b._id})">📮 交付子女</button>`, true);
  },
  saveOne(id, i){ const b=Warm.bio(id); const t=$('ch'+i); if(!b||!t||!b.chapters[i]) return;
    b.chapters[i].c=t.value.trim(); b.chapters[i].edited=1; b.time=now(); persist(); logAct('改写传记章节', b.name+'《'+b.title+'》'+b.chapters[i].t,'低'); toast('本章已保存','ok'); },
  saveChapters(id){ const b=Warm.bio(id); if(!b) return;
    b.chapters.forEach((c,i)=>{ const t=$('ch'+i); if(t){ c.c=t.value.trim(); c.edited=1; } });
    const n=$('lgNote'); if(n) b.note=n.value.trim();
    b.time=now(); persist(); logAct('保存传记全文', b.name+'《'+b.title+'》','低'); Warm.refresh(); toast('传记已保存（'+b.chapters.length+' 章）','ok'); Warm.viewBio(b._id); },
  polish(id, i){ const b=Warm.bio(id); const t=$('ch'+i); if(!b||!t) return;
    const v=t.value.trim(); if(!v){ toast('本章还没有内容','warn'); return; }
    t.value = v.replace(/。/g,'。 ').replace(/^（以下为本人原话，只作了顺句处理）/, b.style==='家书体'?'亲爱的家人，':'') + (b.style==='编年史'?'\n（编年体提示：该段可按年份拆分到上一年与下一年。）':'');
    toast('已重新组织语句，可继续手动修改','ok'); },
  fromMate(id, i){ const b=Warm.bio(id); const t=$('ch'+i); if(!b||!t) return;
    const ds = Warm.diaries(b.name,'').slice(0,4).map(d=>'· '+d.date+' '+d.title+'：'+String(d.content||'').slice(0,40)).join('\n');
    t.value = (t.value?t.value+'\n':'')+'【可粘贴的原文素材】\n'+ds; toast('已插入原文素材，自行挑选','ok'); },
  addChapter(id){ const b=Warm.bio(id); if(!b) return; b.chapters=b.chapters||[]; b.chapters.push({t:'第'+(b.chapters.length+1)+'章 · （自己写的一章）', c:'这里写自己想说的话。', edited:1});
    persist(); Warm.refresh(); Warm.viewBio(b._id); toast('已新增一章','ok'); },
  delChapter(id, i){ const b=Warm.bio(id); if(!b||!b.chapters[i]) return; if(!confirm('确认删除《'+b.chapters[i].t+'》？')) return;
    b.chapters.splice(i,1); b.progress=Math.min(100, Math.round(b.chapters.length*12)); persist(); Warm.refresh(); Warm.viewBio(b._id); },
  finalize(id){ const b=Warm.bio(id); if(!b) return;
    if(!b.chapters.length){ toast('草稿还是空的，不能定稿','err'); return; }
    if(!confirm('定稿后传记将锁定为「已成稿」，长者仍可随时解锁修改。确认定稿？')) return;
    b.status='已成稿'; b.progress=100; b.time=now(); Warm.dismiss(); persist(); Warm.refresh();
    logAct('传记定稿', b.name+'《'+b.title+'》','中'); toast('已定稿：《'+b.title+'》','ok'); Warm.viewBio(b._id); },
  deliver(id){ const b=Warm.bio(id); if(!b) return;
    if(!Warm.isWeb()) return Mob.wDeliver(id);
    Modal.open('📮 交付子女 / 家人', `<div class="mform">
      <div class="field"><label>交付对象</label><input class="inp" id="dlTo" value="${esc(b.family||'')}"></div>
      <div class="field"><label>送达方式</label><div class="seg" id="dlWay">${['APP 推送','短信链接','纸质快递','园区服务台领取'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="field"><label>附一句话</label><textarea class="inp" id="dlMsg" rows="2" placeholder="想对家人说的话"></textarea></div>
      <div class="tiny">交付后长者端与子女端会同步出现《${b.title}》，仅授权家属可见；可随时撤销。</div></div>`,
      `<button class="btn" onclick="Modal.close()">取消</button><button class="btn p" onclick="Warm.doDeliver(${b._id})">确认交付</button>`);
    Warm.seg('dlWay');
  },
  doDeliver(id){ const b=Warm.bio(id); if(!b) return;
    b.status='已交付'; b.family=($('dlTo').value||'').trim()||b.family||'家人'; b.deliverWay=Warm.segVal('dlWay','APP 推送');
    b.deliverMsg=($('dlMsg').value||'').trim(); b.deliverTime=now(); b.time=now();
    Warm.dismiss(); persist(); Warm.refresh(); logAct('传记交付家属', b.name+'《'+b.title+'》→ '+b.family+'（'+b.deliverWay+'）','中');
    toast('已交付：'+b.family+' 可在子女端「传承」中看到','ok'); Warm.viewBio(b._id); },
  bioSheets(b){ const chs=b.chapters||[];
    return `<div class="pt-cover bio"><h1>${esc(b.title)}</h1><p>${esc(b.name)} · ${esc(b.style)} · ${esc(b.vol||'')}</p>
      <div class="big">🕯</div><p class="note">${esc(b.note||'')}</p>
      <p class="meta">共 ${chs.length} 章 · 素材：日记 ${b.srcDiary||0} 篇 / 照片 ${b.srcPhoto||0} 张 · 打印时间 ${now()}</p></div>`
      + chs.map((c,i)=>`<div class="pt-chap"><h2>${esc(c.t)}</h2><p>${esc(c.c||'')}</p><span>${esc(b.name)} · ${esc(b.title)}</span></div>`).join(''); },
  printBio(id){ const b = Warm.bio(id); if(!b) return;
    const chs=b.chapters||[];
    printSheets(Warm.bioSheets(b));
    b.printCnt=(b.printCnt||0)+1; persist(); Warm.refresh(); logAct('打印传记成书', b.name+'《'+b.title+'》','低');
    if(!Warm.isWeb()){ toast('已生成书本版式，累计打印 '+b.printCnt+' 次','ok'); return; }
    Modal.open('🖨 传记已排好书本版式', `<div class="ok-box"><div class="e">📖</div><b>《${esc(b.title)}》打印任务已生成</b>
      <p>共 ${chs.length} 章 · 累计打印 ${b.printCnt} 次<br>可选「精装锁线」或「骑马钉」；园区打印室 1 个工作日送出。</p>
      <div class="mbtns"><button class="btn" onclick="Modal.close()">关闭</button><button class="btn p" onclick="Warm.openBio(${b._id})">返回编辑</button></div></div>`);
  },
  delBio(id){ const b=Warm.bio(id); if(!b) return; if(!confirm('确认删除传记《'+b.title+'》？（已交付的需家属确认后撤回）')) return;
    MODULES.legacy.rows = MODULES.legacy.rows.filter(x=>x._id!==+id); persist(); Warm.dismiss(); Warm.refresh(); logAct('删除传记', b.name+' / '+b.title,'高'); toast('传记已删除','warn'); }
};

/* ---------- 自定义页：温暖相册 ---------- */
Object.assign(CUSTOM, {
  album(key){
    const m = MODULES[key]; const st = S.ab = S.ab || {};
    st.owner = st.owner || (Warm.who() || '全部'); st.cate = st.cate || '全部';
    const all = MODULES.album.rows||[];
    const live = all.filter(a=>a.status!=='已销毁');
    const gone = all.filter(a=>a.status==='已销毁');
    const phTotal = live.reduce((s,a)=>s+Warm.photos(a).length,0);
    const list = Warm.albums(st.owner==='全部'?'':st.owner, st.cate);
    const kpi = [['📸','我的相册', live.length+' 本','共 '+ALBUM_CATES.length+' 个分类',''],
      ['🖼','照片总量', phTotal+' 张','含手写扫描与老照片翻拍',''],
      ['🔗','已分享', live.filter(a=>a.share==='已生成链接').length+' 本','可随时撤销链接',''],
      ['🖨','纸质打印', live.reduce((s,a)=>s+(+a.printCnt||0),0)+' 次','已下单至园区打印室',''],
      ['🔒','私密保护', live.filter(a=>a.priv==='私密').length+' 本','仅本人可见',''],
      ['🗑','已销毁', gone.length+' 本','回收站保留 30 天','']];
    $('crumb').innerHTML = `首页 / 温暖传承 / <b>${esc(m.title)}</b>`;
    $('page').innerHTML = `<div class="page-h"><div><h2>📸 温暖相册</h2><p>${esc(m.desc)}　·　当前：${esc(st.owner)} / ${esc(st.cate)}</p></div>
      <div class="acts"><select class="sel" style="width:130px" onchange="S.ab.owner=this.value;renderPage()">
        <option${st.owner==='全部'?' selected':''}>全部</option>${ELDER_NAMES.map(n=>`<option${n===st.owner?' selected':''}>${esc(n)}</option>`).join('')}</select>
        <input class="inp" style="width:160px" placeholder="搜相册名 / 照片图注" value="${esc(st.kw||'')}" oninput="S.ab.kw=this.value;renderPage()">
        <button class="btn p" onclick="Warm.newAlbum('${esc(st.owner==='全部'?'':st.owner)}')">＋ 新建相册</button></div></div>
    <div class="kpis" style="grid-template-columns:repeat(6,1fr)">${kpi.map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]}${k[4]?' · '+k[4]:''}</span></div>`).join('')}</div>
    <div class="mchips" style="margin-top:16px">${['全部'].concat(ALBUM_CATES).map(c=>`<button class="${c===st.cate?'on':''}" onclick="S.ab.cate='${c}';renderPage()">${c} · ${live.filter(a=>a.cate===c).length}</button>`).join('')}</div>
    ${list.length? `<div class="ab-cards">${list.map(a=>{ const ps=Warm.photos(a); const kw=(st.kw||'').trim();
        const hit = !kw || a.name.includes(kw) || (a.note||'').includes(kw) || ps.some(p=>(p.t+p.cap||'').includes(kw));
        if(!hit) return ''; return `<div class="ab-card" onclick="Warm.openAlbum(${a._id})">
          <div class="ab-im">${esc(a.cover||'📷')}<i>${ps.length} 张</i></div>
          <b>${esc(a.name)}</b><p>${esc(a.owner)} · ${esc(a.cate)}</p>
          <div class="ab-row">${tagHTML({tag:{'私密':'ink','家人可见':'blue','园区公开':'green'}}, a.priv)}${tagHTML({tag:{'未分享':'ink','已生成链接':'green','已撤销':'warn'}}, a.share)}${a.printCnt?'<span class="tag purple">已打印 '+a.printCnt+'</span>':''}</div>
          <div class="ab-strip">${ps.slice(0,5).map(p=>`<span>${esc(p.ico||'📷')}</span>`).join('')}${ps.length>5?`<i class="more">+${ps.length-5}</i>`:''}</div>
          <p class="tiny">${esc((a.note||'').slice(0,26)||'暂无简介')}</p></div>`; }).join('')}</div>` : '<div class="empty"><div class="e">📷</div>当前筛选条件下还没有相册，点右上角「＋ 新建相册」开始创建</div>'}
    ${gone.length? `<div class="card" style="margin-top:16px"><div class="card-h"><h3>🗑 已销毁的相册（回收站）</h3><span class="tiny">保留 30 天，超级管理员可恢复</span></div>
      <div class="card-b"><ul class="lst">${gone.map(a=>`<li><span class="ic r">🗑</span><div><b>${esc(a.name)}</b><p>${esc(a.owner)} · ${esc(a.cate)} · 销毁于 ${esc(a.destroyAt||'—')}</p></div>
        <span class="tm"><span class="tag red">${Warm.photos(a).length} 张已隐藏</span> <button class="btn sm" onclick="Warm.restore(${a._id})">♻️ 恢复</button></span></li>`).join('')}</ul></div></div>`:''}
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>📚 分类与能力说明</h3><span class="tiny">创建 / 添加 / 销毁 / 分享 / 打印</span></div>
      <div class="card-b"><div class="sw-box">${ALBUM_CATES.map(c=>{ const n=live.filter(a=>a.cate===c).length; const p=live.filter(a=>a.cate===c).reduce((s,a)=>s+Warm.photos(a).length,0);
          return `<div class="ck"><b>${c}</b><p>${n} 本相册 · ${p} 张照片</p></div>`; }).join('')}</div>
        <div class="tiny" style="margin-top:10px">纸质输出：支持 A4 / 12 寸相簿 / 拍立得，可选精装硬壳、蝴蝶对裱、环装可拆，并随册附印图注与手写页；分享：生成带有效期的链接与分享码，随时可撤销。</div></div></div>`;
  },

  /* ---------- 自定义页：时光日记 ---------- */
  diary(key){
    const m = MODULES[key]; const st = S.dy = S.dy || {};
    st.owner = st.owner || (Warm.who() || '全部'); st.kind = st.kind || '全部'; S.dyKind = S.dyKind || '笔记';
    const all = MODULES.diary.rows||[];
    const mine = Warm.diaries(st.owner==='全部'?'':st.owner, st.kind==='全部'?'':st.kind);
    const cnt = k => all.filter(d=>d.kind===k && (st.owner==='全部'||d.name===st.owner)).length;
    const kpi = [['📔','记录总数', all.length+' 条','笔记 / 录音 / 画画 / 拍照',''],
      ['🖊','笔记', cnt('笔记')+' 条','含手写识别转入',''],
      ['🎙','录音', cnt('录音')+' 条','自动转写文字',''],
      ['🎨','画画', cnt('画画')+' 条','画板作品已存档',''],
      ['📷','拍照', cnt('拍照')+' 条','支持 OCR 认字',''],
      ['🕯','已入传记', all.filter(d=>d.bio==='已引用').length+' 条','可随时取消引用','']];
    $('crumb').innerHTML = `首页 / 温暖传承 / <b>${esc(m.title)}</b>`;
    $('page').innerHTML = `<div class="page-h"><div><h2>📔 时光日记</h2><p>${esc(m.desc)}　·　当前：${esc(st.owner)} / ${esc(st.kind)}</p></div>
      <div class="acts"><select class="sel" style="width:130px" onchange="S.dy.owner=this.value;renderPage()">
        <option${st.owner==='全部'?' selected':''}>全部</option>${ELDER_NAMES.map(n=>`<option${n===st.owner?' selected':''}>${esc(n)}</option>`).join('')}</select>
        <button class="btn" onclick="Warm.genForm('${esc(st.owner==='全部'?'':st.owner)}')">🤖 用素材生成传记</button>
        <button class="btn p" onclick="S.dyKind='笔记';renderPage()">＋ 写一条</button></div></div>
    <div class="kpis" style="grid-template-columns:repeat(6,1fr)">${kpi.map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]}${k[4]?' · '+k[4]:''}</span></div>`).join('')}</div>
    <div class="bar2"><div class="card"><div class="card-h"><h3>✍️ 创作面板</h3><span class="tiny">四种方式都能记录</span></div>
      <div class="card-b">${Warm.diaryPanel(S.dyKind)}</div></div>
      <div class="card"><div class="card-h"><h3>🗂 我的日记本（${mine.length}）</h3>
        <div class="seg" id="dyFilt">${['全部'].concat(DIARY_KINDS).map(x=>`<button class="${x===st.kind?'on':''}" onclick="S.dy.kind='${x}';renderPage()">${x}</button>`).join('')}</div></div>
        <div class="card-b"><ul class="lst dy-lst" style="max-height:560px">${mine.length? mine.map(d=>`<li onclick="Warm.openDiary(${d._id})" style="cursor:pointer">
          <span class="ic ${d.kind==='录音'?'':d.kind==='画画'?'g':d.kind==='拍照'?'w':''}">${d.kind==='录音'?'🎙':d.kind==='画画'?'🎨':d.kind==='拍照'?'📷':'🖊'}</span>
          <div><b>${esc(d.title)}</b><p>${esc(d.date)} ${esc(d.time||'')} · ${esc(d.name)} · ${esc(d.from||'')}${d.dur?' · '+esc(d.dur):''}</p>
            <span class="tiny">${esc(String(d.content||'').slice(0,42))||'（无正文）'}</span></div>
          <span class="tm">${tagHTML({tag:{'笔记':'blue','录音':'purple','画画':'green','拍照':'warn'}}, d.kind)}${tagHTML({tag:{'已引用':'green','未引用':'ink'}}, d.bio)}</span></li>`).join('')
          : '<div class="empty"><div class="e">📔</div>还没有记录，在左边选一种方式写下第一笔</div>'}</ul></div></div></div>`;
    Warm.afterDiary();
  },

  /* ---------- 自定义页：传承 · AI 传记 ---------- */
  legacy(key){
    const m = MODULES[key]; const st = S.lg = S.lg || {};
    st.owner = st.owner || (Warm.who() || '全部');
    const bios = Warm.bios(st.owner==='全部'?'':st.owner);
    const all = MODULES.legacy.rows||[];
    const phAll = Warm.albums('', '').reduce((s,a)=>s+Warm.photos(a).length,0);
    const kpi = [['🕯','传记总数', all.length+' 部','已覆盖 '+new Set(all.map(b=>b.name)).size+' 位长者',''],
      ['📝','草稿', all.filter(b=>['草稿','生成中'].includes(b.status)).length+' 部','可自由改写',''],
      ['✅','已成稿', all.filter(b=>b.status==='已成稿').length+' 部','已锁定待交付',''],
      ['📮','已交付', all.filter(b=>b.status==='已交付').length+' 部','子女端已同步',''],
      ['🖨','打印成书', all.reduce((s,b)=>s+(+b.printCnt||0),0)+' 册','含精装与纪念册',''],
      ['🧾','素材池', MODULES.diary.rows.length+' 篇 / '+phAll+' 张','相册与日记联动','']];
    $('crumb').innerHTML = `首页 / 温暖传承 / <b>${esc(m.title)}</b>`;
    $('page').innerHTML = `<div class="page-h"><div><h2>🕯 传承 · AI 个人传记</h2><p>${esc(m.desc)}　·　当前：${esc(st.owner)}</p></div>
      <div class="acts"><select class="sel" style="width:130px" onchange="S.lg.owner=this.value;renderPage()">
        <option${st.owner==='全部'?' selected':''}>全部</option>${ELDER_NAMES.map(n=>`<option${n===st.owner?' selected':''}>${esc(n)}</option>`).join('')}</select>
        <button class="btn" onclick="App.go('admin','diary')">📔 时光日记</button>
        <button class="btn p" onclick="Warm.genForm('${esc(st.owner==='全部'?'':st.owner)}')">🤖 联动素材生成传记</button></div></div>
    <div class="kpis" style="grid-template-columns:repeat(6,1fr)">${kpi.map(k=>`<div class="kpi"><i><span class="e">${k[0]}</span>${k[1]}</i><b>${k[2]}</b><span>${k[3]}${k[4]?' · '+k[4]:''}</span></div>`).join('')}</div>
    ${bios.length? `<div class="lgc-cards">${bios.map(b=>{ const chs=b.chapters||[]; return `<div class="lgc-card">
      <div class="lgc-top"><div class="lgc-vol2">${esc(b.style)}</div>
        <div><b>${esc(b.title)}</b><p>${esc(b.name)} · ${esc(b.vol||'')} · 整理人 ${esc(b.by||'—')} · ${esc(b.time||'')}</p></div>
        <div class="lgc-st">${tagHTML({tag:{'草稿':'ink','生成中':'blue','已成稿':'green','已交付':'purple'}}, b.status)}</div></div>
      <div class="prog"><i style="width:${b.progress||0}%"></i></div><div class="tiny" style="margin-bottom:8px">完成度 ${b.progress||0}% · ${chs.length} 章</div>
      <div class="lgc-chs">${chs.length? chs.slice(0,3).map(c=>`<span class="tag">${esc(c.t)}</span>`).join('')+(chs.length>3?`<span class="tiny"> 等 ${chs.length} 章</span>`:'') : '<span class="tiny">草稿生成中…</span>'}</div>
      <div class="lgc-sum">${chs[0]? esc(String(chs[0].c||'').slice(0,70))+'…':'<span class="tiny">暂无摘要</span>'}</div>
      <div class="mbtns"><button class="btn sm p" onclick="Warm.openBio(${b._id})">✍️ 自由编写</button>
        <button class="btn sm" onclick="Warm.printBio(${b._id})">🖨 打印成书</button>
        ${b.status==='草稿'?`<button class="btn sm g" onclick="Warm.finalize(${b._id})">✅ 定稿</button>`:''}
        ${b.status==='已成稿'?`<button class="btn sm g" onclick="Warm.deliver(${b._id})">📮 交付子女</button>`:''}
        ${b.status==='已交付'?`<button class="btn sm" onclick="Warm.deliver(${b._id})">🔁 重新交付</button>`:''}
        <button class="btn sm d" onclick="Warm.delBio(${b._id})">🗑</button></div></div>`; }).join('')}</div>`
      : '<div class="empty"><div class="e">🕯</div>还没有传记，点右上角「联动素材生成传记」</div>'}
    <div class="card" style="margin-top:16px"><div class="card-h"><h3>🧩 谁已经有素材可以写成传记</h3><span class="tiny">素材越厚，传记越像本人</span></div>
      <div class="card-b"><ul class="lst" style="max-height:420px">${ELDER_NAMES.map(n=>{ const ds=Warm.diaries(n,''), ab=Warm.albums(n,''), ph=ab.reduce((s,a)=>s+Warm.photos(a).length,0), bs=Warm.bios(n);
        if(!ds.length && !ab.length) return ''; return `<li><span class="ic">${esc((ab[0]&&ab[0].cover)||'📔')}</span><div><b>${esc(n)}</b><p>日记 ${ds.length} 篇 · 相册 ${ab.length} 本 / ${ph} 张 · 传记 ${bs.length} 部${bs.length?'（'+bs.map(x=>x.status).join('、')+'）':''}</p></div>
          <span class="tm"><span class="tiny">${ab.slice(0,4).map(a=>esc(a.cover||'📷')).join(' ')}</span> <button class="btn sm p" onclick="Warm.genForm('${n}')">🤖 生成草稿</button></span></li>`; }).join('')}</ul>
        <div class="tiny" style="margin-top:10px">生成流程：选择素材 → AI 按体裁串成逐章草稿 → 长者与家属自由改写 → 定稿 → 打印成书 / 交付子女。全程不锁定、不代笔下发，定稿前不对外展示。</div></div></div>`;
  }
});
