
/* ============================================================
 *  Layer 5 : APP 端 / 小程序端 高保真原型（可交互，与后台共享同一份数据）
 * ============================================================ */
const MB_TABS = {
  app: {
    elder: [['🏠','首页','home'],['❤️','健康','health'],['🆘','SOS','sos'],['🌈','康养圈','circle'],['📖','温暖','warm'],['👤','我的','mine']],
    child: [['🏠','首页','home'],['💚','亲情','family'],['📅','预约','book'],['💳','消费','pay'],['🕯','传承','legacy'],['👤','我的','mine']],
    special: [['⌚','手环','band'],['📍','打卡','checkin'],['🆘','SOS','sos'],['🔊','播报','broadcast'],['👤','我的','mine']],
    guard: [['🛰','监管','home'],['🚨','告警','alert'],['🛡','备勤','standby'],['👤','我的','mine']]
  },
  mp: {
    elder: [['🏠','首页','home'],['🛎️','服务','svc'],['🌈','康养圈','circle'],['📖','温暖','warm'],['👤','我的','mine']],
    child: [['🏠','首页','home'],['💚','照护','family'],['💳','代付','pay'],['🕯','传承','legacy'],['👤','我的','mine']],
    special: [['⌚','手环','band'],['📍','打卡','checkin'],['🆘','SOS','sos'],['🔊','播报','broadcast'],['👤','我的','mine']],
    guard: [['🛰','监管','home'],['🚨','告警','alert'],['🛡','备勤','standby'],['👤','我的','mine']]
  }
};

const MB = {
  elder:'徐世昌', child:'徐乐', special:'蒋明远', cart:[], chat:[], aiLog:null, postIdx:0,
  A(){ const r = MODULES.archive.rows.find(a=>a.name===MB.elder);
       return r || { name:MB.elder, room:'A-305', zone:'康养区 A 栋', level:'半自理', pkg:'健康管理套餐', guardian:'徐乐' }; },
  SA(){ const r = MODULES.archive.rows.find(a=>a.name===MB.special);
       return r || { name:MB.special, room:'A-105', zone:'康养区 A 栋', level:'半自理', pkg:'生活照护套餐', guardian:'蒋涛', gphone:'135****1180', age:80 }; },
  wx(){ const h=new Date().getHours(); const t=[['🌙','晴','18℃','夜间偏凉，注意保暖'],['🌅','多云','22℃','空气良好，适合晨间活动'],['☀️','晴','26℃','光照充足，记得多喝水'],['🌆','晴转多云','23℃','体感舒适，适宜散步']]; const i=h<6?0:h<11?1:h<18?2:3; return {ico:t[i][0],text:t[i][1],temp:t[i][2],tip:t[i][3]}; },
  BH(){ const rs = MODULES.health.rows.filter(h=>h.name===MB.special); return rs[0] || { hr:74, spo2:98, bp:'126/80', sleep:6.8, step:3200, date:today(), bat:'86%', tip:'该喝温水了' }; },
  BLOCS(){ return [
    {id:1,ico:'🍚',name:'康养餐厅',time:'11:30 午餐',act:'低盐营养餐供应',hint:'到餐厅自动确认今日订餐'},
    {id:2,ico:'💆',name:'康复理疗室',time:'14:00 理疗',act:'中医理疗体验',hint:'到达自动开始理疗签到'},
    {id:3,ico:'🎪',name:'文化活动室',time:'15:30 活动',act:'合唱团社区联排',hint:'到达自动签到并计入活动'},
    {id:4,ico:'🌳',name:'银杏大道',time:'16:30 散步',act:'健走打卡',hint:'GPS 围栏自动计步打卡'},
    {id:5,ico:'🏥',name:'医务室',time:'按需',act:'体征测量',hint:'到达自动上传手环体征'}
  ]; },
  MEM(){ const r = MODULES.member.rows.find(m=>m.name===MB.elder);
       return r || { lv:'金卡会员', balance:3680, point:1240, spend:42800, no:'HY20250312001', status:'正常' }; },
  H(){ const rs = MODULES.health.rows.filter(h=>h.name===MB.elder); return rs[0] || { hr:78, spo2:97, bp:'136/84', sleep:7.2, step:4210, risk:'低', date:today(), doctor:'陈叙白' }; },
  HIST(){ const rs = MODULES.health.rows.filter(h=>h.name===MB.elder); return rs.length?rs:[MB.H()]; },
  ACTS(){ const r = MODULES.activity.rows.filter(a=>a.status==='报名中'||a.status==='进行中'); return r.length?r:MODULES.activity.rows.slice(0,3); },
  POSTS(){ const r = MODULES.circle.rows.filter(c=>c.status==='已发布'); return r.length?r:MODULES.circle.rows.slice(0,3); },
  REM(){ const r = MODULES.remind.rows.filter(x=>/徐世昌|全员|全部|康养/.test(x.target||'')); return (r.length?r:MODULES.remind.rows).slice(0,4); },
  ORDERS(){ return MODULES.order.rows.filter(o=>o.name===MB.elder||o.status==='待支付').slice(0,6); },
  BOOKS(){ return MODULES.booking.rows.filter(b=>/子女代约|APP|小程序/.test((b.kind||'')+(b.from||''))||b.name===MB.elder||b.name===MB.child).slice(0,6); },
  ALARM(){ return MODULES.devalarm.rows.filter(a=>a.obj===MB.elder||a.status==='待处置').slice(0,4); },

  /* ---------- 骨架 ---------- */
  status(){ const d=new Date(), p=n=>String(n).padStart(2,'0');
    return `<div class="st"><span>${p(d.getHours())}:${p(d.getMinutes())}</span><span class="rt">🔔 5G ▮▮▮ 86%</span></div>`; },
  wxbar(role){ return `<div class="wxbar"><div class="t">‹ 康养服务${role==='child'?'（子女版）':''}</div><div class="caps"><span>⋯</span><span style="border-left:1px solid #e4e9f0;height:16px"></span><span>◉</span></div></div>`; },
  head(kind, role){
    if(role==='guard'){ const g = typeof EME!=='undefined'?(EME.seed(), EME.openCnt()):0; return `<div class="app-hd"><div class="row"><div style="flex:1"><h3>🚨 紧急监管端 · 安保中控室</h3><div class="sm">实时接收全园区预警报警 · 待处理 ${g} 条</div></div><div class="av">🛡</div></div></div>`; }
    if(role==='special'){ const sa=MB.SA(); return `<div class="app-hd"><div class="row"><div style="flex:1"><h3>${esc(sa.name)} · 智能手环</h3><div class="sm">大字 · 语音 · 到站自动打卡 · 一键呼救</div></div><div class="av">⌚</div></div></div>`; }
    const a = MB.A();
    if(role==='child') return `<div class="app-hd"><div class="row"><div style="flex:1"><h3>${MB.greet()}，${esc(S.user?S.user.name:MB.child)}</h3><div class="sm">${kind==='mp'?'小程序 · 微信授权已绑定':'APP · 已绑定长者 '+a.name} · 关注 ${a.name}（${a.room}）</div></div><div class="av">👪</div></div></div>`;
    return `<div class="app-hd"><div class="row"><div style="flex:1"><h3>${MB.greet()}，${esc(a.name)}</h3><div class="sm">${esc(a.zone)} · ${esc(a.room)} · ${esc(a.level)} · ${esc(a.pkg||'健康管理套餐')}</div></div><div class="av">🧓</div></div></div>`;
  },
  greet(){ const h=new Date().getHours(); return h<6?'夜深了':h<11?'早上好':h<14?'中午好':h<18?'下午好':'晚上好'; },
  tabb(kind, role, tabs, idx){
    return `<div class="tabb">`+tabs.map((t,i)=> t[2]==='sos'
      ? `<button class="sos" onclick="Mob.sos()"><span class="e">🆘</span>SOS</button>`
      : t[2]==='broadcast'
      ? `<button onclick="Mob.broadcast()"><span class="e">${t[0]}</span>${t[1]}</button>`
      : `<button class="${i===idx?'on':''}" onclick="Mob.go('${kind}',${i})"><span class="e">${t[0]}</span>${t[1]}</button>`).join('')+`</div>`;
  },
  sheet(html, style){ MB.close(); const host = $(S.view==='mp'?'mpScr':'appScr'); if(!host) return;
    const d=document.createElement('div'); d.className='sheet'; d.id='mbSheet'; d.setAttribute('style',style||''); d.innerHTML=html;
    d.addEventListener('click',e=>e.stopPropagation()); host.appendChild(d); },
  close(){ const s=$('mbSheet'); if(s) s.remove(); },

  /* ---------- 渲染入口 ---------- */
  render(kind){
    const host = $(kind==='app'?'appScr':'mpScr'); if(!host) return;
    const role = S.mobileRole[kind] || 'elder';
    const tabs = MB_TABS[kind][role];
    let idx = S[kind+'Tab']||0; if(idx>=tabs.length) idx=0;
    const key = (tabs[idx][2]==='sos'||tabs[idx][2]==='broadcast') ? 'home' : tabs[idx][2];
    host.innerHTML = (kind==='app'?MB.status():MB.wxbar(role)) + MB.head(kind,role)
      + `<div class="app-body">${MB.screen(kind,role,key)}</div>` + MB.tabb(kind,role,tabs,idx);
    const seg = $(kind+'Role');
    if(seg){ [...seg.children].forEach(b=>b.classList.toggle('on', b.dataset.r===role));
      seg.onclick = e => { const b=e.target.closest('button'); if(!b) return; Mob.role(kind, b.dataset.r); }; }
    MB.after(key);
  },
  after(key){
    if(key==='warm'){ if(typeof Warm!=='undefined') Warm.afterDiary(); return; }
    if(key!=='health') return;
    const hs = MB.HIST().slice(0,7).reverse();
    ec('mHr', { grid:{left:6,right:6,top:18,bottom:20,containLabel:true},
      tooltip:{trigger:'axis'}, legend:{data:['心率','血氧'],top:0,itemWidth:9,itemHeight:9,textStyle:{fontSize:10}},
      xAxis:Object.assign({type:'category',data:hs.map(h=>String(h.date).slice(5)),axisLabel:{fontSize:9}},axisBase(false)),
      yAxis:Object.assign({type:'value',min:50,max:110,axisLabel:{fontSize:9}},axisBase(false)),
      series:[{name:'心率',type:'line',smooth:true,data:hs.map(h=>+h.hr||78),lineStyle:{width:2.4,color:'#1668dc'},itemStyle:{color:'#1668dc'},areaStyle:{color:'rgba(22,104,220,.12)'}},
        {name:'血氧',type:'line',smooth:true,data:hs.map(h=>+h.spo2||96),lineStyle:{width:2,color:'#00b578'},itemStyle:{color:'#00b578'}}] });
  },

  /* ---------- 屏幕 ---------- */
  screen(kind, role, key){
    if(role==='guard') return ({ home:MB.gHome, alert:MB.gAlert, standby:MB.gStandby, mine:MB.gMine })[key](kind);
    if(role==='special') return ({ home:MB.sBand, band:MB.sBand, checkin:MB.sCheckin, mine:MB.sMine })[key](kind);
    if(role==='child') return ({ home:MB.cHome, family:MB.cFamily, book:MB.cBook, pay:MB.cPay, legacy:MB.cLegacy, mine:MB.cMine })[key](kind);
    return ({ home:MB.eHome, health:MB.eHealth, circle:MB.eCircle, svc:MB.eSvc, warm:MB.eWarm, mine:MB.eMine })[key](kind);
  },

  /* ===== 长者端 ===== */
  eHome(kind){
    const a=MB.A(), h=MB.H(), m=MB.MEM();
    const rem = MB.REM().map(r=>`<li><div class="ic ${r.level==='紧急'?'r':'g'}">${r.kind==='用药'?'💊':r.kind==='复诊'?'🩺':r.kind==='活动'?'🎪':'⏰'}</div>
      <div class="tx"><b>${esc(r.title)}</b><p>${esc(r.content||r.time)} · ${esc(r.target)}</p></div>
      <div class="rt"><span class="link" onclick="Mob.remind(${r._id})">打卡</span></div></li>`).join('');
    const acts = MB.ACTS().slice(0,3).map(x=>`<li><div class="ic">${x.kind==='节日庆典'?'🎉':x.kind==='出游旅居'?'🚌':'🎓'}</div>
      <div class="tx"><b>${esc(x.title)}</b><p>${esc(x.date)} · ${esc(x.place)} · 剩 ${Math.max(0,(+x.quota||0)-(+x.signed||0))} 名</p></div>
      <div class="rt"><button class="btn sm p" onclick="Mob.signup(${x._id})">报名</button></div></li>`).join('');
    const g = [['🎪','活动报名','Mob.actList()'],['🍚','今日订餐','Mob.meal()'],
      ['🤖','AI 陪伴','Mob.aiOpen()'],['📅','理疗预约','Mob.bookSheet()'],['📝','外出请假','Mob.leaveSheet()'],
      ['🚻','服务报修','Mob.repair()'],['🏃','运动打卡','Mob.sport()'],['🆘','一键呼救','Mob.sos()']];
    return `<div class="mhero"><b>${esc(m.lv)} · 会员卡号 ${esc(m.no||'—')}</b><p>储值余额 ¥${(+m.balance||0).toLocaleString()} · 可用积分 ${esc(m.point||0)} · 本月消费 ${esc(m.spend||0)} 元</p>
      <div class="row"><div>今日步数<b>${esc(h.step||0)}</b></div><div>睡眠时长<b>${esc(h.sleep||0)}h</b></div><div>风险等级<b>${esc(h.risk||'低')}</b></div></div></div>
      <div class="hcards"><div class="hc1"><label>心率</label><b>${esc(h.hr)}<i style="font-size:11px"> bpm</i></b><i>${esc(h.date||today())} 手环同步</i></div>
      <div class="hc2"><label>血压</label><b style="font-size:17px">${esc(h.bp)}</b><i>目标 &lt; 140/90</i></div>
      <div class="hc3"><label>血氧</label><b>${esc(h.spo2)}<i style="font-size:11px"> %</i></b><i>夜间最低 94%</i></div></div>
      <div style="height:12px"></div>
      <div class="mc"><div class="mc-h"><b>快捷服务</b><span>适老化大字 · 语音可用</span></div>
        <div class="mgrid">${g.map((x,i)=>`<div class="${i===2?'on':''}" onclick="${x[2]}"><div class="e">${x[0]}</div>${x[1]}</div>`).join('')}</div></div>
      <div class="mc"><div class="mc-h"><b>今日提醒</b><span>${MB.REM().length} 条 · 已同步房间大屏</span></div><ul class="mlist">${rem}</ul></div>
      <div class="mc"><div class="mc-h"><b>可报名活动</b><span class="link" onclick="Mob.actList()">全部 ›</span></div><ul class="mlist">${acts}</ul></div>
      <div class="mcard2"><b>📹 亲情视频 · 女儿 徐乐</b><p>今日 19:00 已预约 8 分钟视频通话，可在房间大屏接听</p>
        <div style="margin-top:9px"><button class="btn sm" onclick="toast('已在房间大屏发起视频（演示）','ok')">立即回拨</button>
        <button class="btn sm" style="margin-left:8px" onclick="Mob.comment()">留言</button></div></div>`;
  },
  eHealth(){
    const hs = MB.HIST().map(r=>`<li><div class="ic ${r.risk==='高'?'r':r.risk==='中'?'w':'g'}">${r.type==='护理记录'?'🧑‍⚕️':r.type==='体检摘要'?'📋':r.type==='理疗记录'?'💆':'⌚'}</div>
      <div class="tx"><b>${esc(r.type)} · ${esc(r.date)}</b><p>${esc(r.note||'')}</p></div><div class="rt">${esc(r.risk)}险<br>${esc(r.doctor||'—')}</div></li>`).join('');
    const sp = (MODULES.sport.rows.filter(s=>s.name===MB.elder)[0])||{plan:'快走 30 分钟',dur:32,step:4210,kcal:186,status:'已达标'};
    return `<div class="mc"><div class="mc-h"><b>近 7 日体征趋势</b><span>数据来自智能手环</span></div><div id="mHr" style="height:150px"></div></div>
      <div class="mc"><div class="mc-h"><b>健康档案摘要</b><span>责任医护 ${esc(MB.H().doctor||'陈叙白')}</span></div>
        <div class="mgrid" style="grid-template-columns:repeat(3,1fr)">${[['🩸','血压','136/84'],['🧪','血糖','5.8'],['❤️','心率','78'],['🫁','血氧','97%'],['💤','睡眠','7.2h'],['🏃','步数','4210']].map(x=>`<div><div class="e">${x[0]}</div>${x[1]}<b style="display:block;font-size:12px;color:var(--txt)">${x[2]}</b></div>`).join('')}</div>
        <p class="tiny" style="margin-top:8px">既往史：高血压 2 级（药物控制）、骨质疏松；过敏史：青霉素。饮食建议低盐 ≤ 5g/日。</p></div>
      <div class="mc"><div class="mc-h"><b>今日运动处方</b><span>${esc(sp.status)}</span></div>
        <ul class="mlist"><li><div class="ic g">🏃</div><div class="tx"><b>${esc(sp.plan)}</b><p>${esc(sp.dur)} 分钟 · ${esc(sp.step)} 步 · ${esc(sp.kcal)} kcal · 平均心率 ${esc(sp.hr||96)}</p></div>
        <div class="rt"><button class="btn sm g" onclick="Mob.sport()">打卡</button></div></li></ul></div>
      <div class="mc"><div class="mc-h"><b>体征与护理记录</b><span>${MB.HIST().length} 条</span></div><ul class="mlist">${hs}</ul></div>
      <div class="mc"><div class="mc-h"><b>在线问诊</b><span>视频 · 语音 · 文字</span></div>
        <div class="mbtns"><button class="btn p" onclick="toast('已呼叫责任医护，预计 1 分钟接入','ok')">📞 呼叫医护</button>
        <button class="btn" onclick="Mob.aiOpen()">🤖 AI 健康助手</button></div></div>`;
  },
  eSvc(){
    const lunch = MODULES.menu.rows.filter(m=>m.meal==='午餐'&&m.status==='供应中').slice(0,5);
    const dishes = lunch.map(d=>`<li><div class="ic">🍲</div><div class="tx"><b>${esc(d.dish)}</b><p>${esc(d.kcal)} kcal · ${esc(d.tag)} · ¥${esc(d.price)}</p></div>
      <div class="rt"><button class="btn sm p" onclick="Mob.mealAdd('${esc(d.dish)}',${+d.price||0})">＋ 加购</button></div></li>`).join('');
    const g=[['🍚','在线订餐',"Mob.meal()"],['📅','理疗预约','Mob.bookSheet()'],['🧹','保洁报修','Mob.repair()'],['📝','外出请假','Mob.leaveSheet()'],
      ['🎪','活动报名','Mob.actList()'],['🤖','AI 陪伴','Mob.aiOpen()'],['🚑','陪同就医','Mob.repair()'],['👨‍👩‍👧','亲属留言','Mob.comment()']];
    return `<div class="mhero"><b>今日 10-27 午餐订餐</b><p>营养科已按您的低盐方案筛选，加入购物车后由厨房配餐并送餐到房。</p>
      <div class="row"><div>购物车<b id="cartN">${MB.cart.length} 件</b></div><div>合计<b id="cartA">¥${MB.cart.reduce((s,c)=>s+c.p,0)}</b></div><div>余额<b>¥${(+MB.MEM().balance||0).toLocaleString()}</b></div></div></div>
      <div class="mc"><div class="mc-h"><b>高频服务</b><span>小程序宫格</span></div>
        <div class="mgrid">${g.map(x=>`<div onclick="${x[2]}"><div class="e">${x[0]}</div>${x[1]}</div>`).join('')}</div></div>
      <div class="mc"><div class="mc-h"><b>午餐菜单（低盐适配）</b><span class="link" onclick="Mob.mealSubmit()">提交订单 ›</span></div><ul class="mlist">${dishes}</ul>
        <div class="mbtns" style="margin-top:10px"><button class="btn g" onclick="Mob.mealSubmit()">🛒 提交订餐（${MB.cart.length}）</button>
        <button class="btn" onclick="MB.cart=[];renderMobile('mp');toast('购物车已清空')">清空</button></div></div>
      <div class="mc"><div class="mc-h"><b>扫码 / 人脸核销</b><span>活动与餐厅通用</span></div>
        <div class="mbtns"><button class="btn p" onclick="Mob.scan()">📷 扫一扫签到</button><button class="btn" onclick="Mob.scan()">🙂 刷脸核销</button></div></div>
      <div class="mc"><div class="mc-h"><b>我的预约与工单</b><span>${MB.BOOKS().length} 条</span></div>
        <ul class="mlist">${MB.BOOKS().map(b=>`<li><div class="ic ${b.status==='待确认'?'w':'g'}">📅</div><div class="tx"><b>${esc(b.item)}</b><p>${esc(b.date)} · ${esc(b.place)} · ${esc(b.staff)}</p></div><div class="rt">${tagHTML({tag:MODULES.booking.cols.find(c=>c.k==='status').tag},b.status)}</div></li>`).join('')}</ul></div>`;
  },
  eCircle(){
    const chips = ['全部','康养圈动态','在院时光','活动预告','子女留言'];
    S.circKw = S.circKw || '全部';
    let list = MB.POSTS(); if(S.circKw!=='全部') list = list.filter(c=>c.kind===S.circKw);
    if(!list.length) list = MB.POSTS();
    const feeds = list.slice(0,7).map(c=>`<div class="feed"><div class="u"><div class="av">${esc(c.author[0])}</div><div><b>${esc(c.author)}</b><small>${esc(c.kind)} · ${esc(c.date)}</small></div>
      <span class="tag ${c.share==='已同步'?'green':'ink'}" style="margin-left:auto">${esc(c.share)}</span></div>
      <p>${esc(c.text)}</p>${c.imgs?`<div class="imgs">${String(c.imgs).slice(0,3).split('').map(x=>`<i>${x}</i>`).join('')}</div>`:''}
      <div class="acts"><span onclick="Mob.like(${c._id})">👍 ${c.likes||0}</span><span onclick="Mob.comment(${c._id})">💬 ${c.cmts||0}</span><span onclick="toast('已转给家人（演示）','ok')">↗ 分享给子女</span></div></div>`).join('');
    return `<div class="mchips">${chips.map(c=>`<button class="${S.circKw===c?'on':''}" onclick="S.circKw='${c}';renderMobile('${S.view}')">${c}</button>`).join('')}</div>
      <div class="mc" style="display:flex;align-items:center;gap:10px"><div class="ic" style="width:34px;height:34px;border-radius:10px;background:var(--blue-l);display:flex;align-items:center;justify-content:center">✍️</div>
      <div style="flex:1;color:var(--sub-l);font-size:13px">分享今天的康养生活…</div><button class="btn sm p" onclick="Mob.post()">发布</button></div>${feeds}`;
  },
  eMine(){
    const a=MB.A(), m=MB.MEM(), f=MODULES.family.rows.find(x=>x.ename===MB.elder)||{cname:'徐乐',rel:'女儿',auth:'健康+位置+消费',notice:'告警+请假+消费+关怀'};
    return `<div class="mc" style="display:flex;align-items:center;gap:12px"><div class="av" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--green));color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px">${esc(a.name[0])}</div>
      <div style="flex:1"><b style="font-size:16px">${esc(a.name)}</b><div class="tiny">${esc(a.zone)} ${esc(a.room)} · ${esc(a.age||78)} 岁 · ${esc(a.level)}</div></div><span class="tag green">${esc(a.status||'在院')}</span></div>
      <div class="mc"><div class="mc-h"><b>我的会员卡</b><span>${esc(m.lv)}</span></div>
        <div class="hcards" style="grid-template-columns:repeat(3,1fr)"><div class="hc1"><label>储值</label><b style="font-size:16px">¥${(+m.balance||0).toLocaleString()}</b><i>可子女代付</i></div>
        <div class="hc2"><label>积分</label><b style="font-size:16px">${esc(m.point)}</b><i>可抵扣</i></div><div class="hc3"><label>成长值</label><b style="font-size:16px">${esc(m.grow||8600)}</b><i>距钻石 1400</i></div></div></div>
      <div class="mc"><div class="mc-h"><b>我的家人</b><span class="link" onclick="toast('可在「子女服务管理」审核授权','ok')">授权管理 ›</span></div>
        <ul class="mlist"><li><div class="ic g">👧</div><div class="tx"><b>${esc(f.cname)} · ${esc(f.rel)}</b><p>授权范围：${esc(f.auth)} · 通知：${esc(f.notice)}</p></div><div class="rt"><span class="tag green">已绑定</span></div></li></ul></div>
      <div class="mc"><div class="mc-h"><b>适老化设置</b><span>大字体已开启</span></div>
        <ul class="mlist">${[['超大字体 / 高对比','on'],['语音播报与语音唤醒','on'],['手环跌倒自动呼救','on'],['离开围栏自动通知家人','on'],['房间大屏夜间护眼模式','on']].map(x=>`<li><div class="ic">⚙️</div><div class="tx"><b>${x[0]}</b><p>点击可切换，设置即时生效</p></div><div class="rt"><button class="btn sm ${x[1]==='on'?'g':''}" onclick="this.className='btn sm '+(this.classList.contains('g')?'':'g');toast('设置已更新（演示）','ok')">${x[1]==='on'?'已开启':'未开启'}</button></div></li>`).join('')}</ul></div>
      <div class="mbtns"><button class="btn" onclick="App.go('home')">← 返回门户</button><button class="btn dg" onclick="App.logout()">退出登录</button></div>`;
  },

  /* ===== 子女端 ===== */
  cHome(kind){
    const a=MB.A(), h=MB.H(), al=MB.ALARM();
    const pend = MODULES.leave.rows.filter(l=>l.name===MB.elder&&['待审批','外出中','逾期'].includes(l.status));
    const g=[['📅','探望预约','Mob.bookSheet()'],['💰','代付充值','Mob.topay()'],['🎥','查看录像','Mob.video()'],['💬','给爸留言','Mob.comment()'],
      ['📋','健康报告','toast("已生成 10 月健康报告（PDF，演示）","ok")'],['🚑','陪同就医','Mob.repair()'],['🍱','远程订餐','Mob.meal()'],['🆘','紧急联系','Mob.sosCall()']];
    return `<div class="mhero"><b>${esc(a.name)} · ${esc(a.room)}  今日状态良好</b><p>心率 ${esc(h.hr)} bpm · 血压 ${esc(h.bp)} · 血氧 ${esc(h.spo2)}% · 步数 ${esc(h.step)}　|　风险等级 ${esc(h.risk)}</p>
      <div class="row"><div>在院天数<b>238</b></div><div>本月活动<b>14 场</b></div><div>满意度<b>4.8</b></div></div></div>
      <div class="mc"><div class="mc-h"><b>实时动态与提醒</b><span>${al.length+pend.length} 条</span></div>
        <ul class="mlist">${pend.map(l=>`<li><div class="ic w">📝</div><div class="tx"><b>请假${esc(l.status)} · ${esc(l.type)}</b><p>${esc(l.start)} → ${esc(l.end)} · ${esc(l.dest)}</p></div><div class="rt"><span class="link" onclick="Mob.approve(${l._id})">${l.status==='待审批'?'催审批':'跟踪'}</span></div></li>`).join('')}
        ${al.map(x=>`<li><div class="ic r">🚨</div><div class="tx"><b>${esc(x.kind)} · ${esc(x.level)}</b><p>${esc(x.value)} · ${esc(x.time)}</p></div><div class="rt">${esc(x.status)}</div></li>`).join('')}
        ${MODULES.remind.rows.filter(r=>r.target&&/徐世昌|全员/.test(r.target)).slice(0,2).map(r=>`<li><div class="ic g">⏰</div><div class="tx"><b>${esc(r.title)}</b><p>${esc(r.time)} · ${esc(r.kind)}</p></div><div class="rt"><span class="link" onclick="toast('已确认回执','ok')">确认</span></div></li>`).join('')}</ul></div>
      <div class="mc"><div class="mc-h"><b>常用操作</b><span>授权范围内可查</span></div>
        <div class="mgrid">${g.map(x=>`<div onclick="${x[2]}"><div class="e">${x[0]}</div>${x[1]}</div>`).join('')}</div></div>
      <div class="mc"><div class="mc-h"><b>今日康养圈</b><span class="link" onclick="Mob.go('${kind}',1)">更多 ›</span></div>
        ${MB.POSTS().slice(0,2).map(c=>`<div class="feed"><div class="u"><div class="av">${esc(c.author[0])}</div><div><b>${esc(c.author)}</b><small>${esc(c.date)}</small></div></div><p>${esc(c.text)}</p>
        <div class="acts"><span onclick="Mob.like(${c._id})">👍 ${c.likes||0}</span><span onclick="Mob.comment(${c._id})">💬 留言</span></div></div>`).join('')}</div>`;
  },
  cFamily(){
    const hs = MB.HIST().slice(0,4).map(r=>`<li><div class="ic ${r.risk==='高'?'r':'g'}">🩺</div><div class="tx"><b>${esc(r.type)} · ${esc(r.date)}</b><p>${esc(r.note||'')}</p></div><div class="rt">${esc(r.hr)}/${esc(r.spo2)}<br>${esc(r.risk)}险</div></li>`).join('');
    const ai = MODULES.ai.rows.slice(0,2).map(x=>`<li><div class="ic">🤖</div><div class="tx"><b>${esc(x.name)} · ${esc(x.mood)}</b><p>${esc(x.snippet)}</p></div><div class="rt">${esc(x.topic)}</div></li>`).join('');
    return `<div class="mcard2"><b>数据授权</b><p>父亲已授权「健康 + 位置 + 消费」。所有查看行为均记录在后台操作日志，可随时收回授权。</p>
      <div style="margin-top:9px"><button class="btn sm" onclick="toast('授权范围已提交变更申请，待管理员审核','ok')">申请变更授权</button></div></div>
      <div class="mc"><div class="mc-h"><b>体征记录（近 4 次）</b><span>同步自手环与护理记录</span></div><ul class="mlist">${hs}</ul></div>
      <div class="mc"><div class="mc-h"><b>AI 陪伴会话摘要</b><span>情绪识别与关怀</span></div><ul class="mlist">${ai}</ul></div>
      <div class="mc"><div class="mc-h"><b>给 ${esc(MB.elder)} 留言</b><span>将推送到房间大屏与手环</span></div>
        <div class="field"><textarea class="txta" id="cMsg" rows="3" placeholder="爸，注意保暖，周末我带孙女来看您" style="height:70px;padding:8px 12px"></textarea></div>
        <button class="btn p blk" onclick="Mob.comment()">发送留言</button></div>
      <div class="mc"><div class="mc-h"><b>园区录像（授权）</b><span>需审批后查看</span></div>
        <div class="mbtns"><button class="btn" onclick="Mob.video()">🎥 申请查看公共区域录像</button></div></div>`;
  },
  cBook(){
    return `<div class="mc"><div class="mc-h"><b>发起探望 / 代预约</b><span>提交后进入后台「预约体验管理」</span></div>
      <div class="mform"><div class="field"><label><i>*</i>项目</label><select class="sel" id="bkItem"><option>探望陪伴（含园区导览）</option><option>中医理疗体验</option><option>康复理疗评估</option><option>营养膳食体验</option><option>认知功能筛查</option></select></div>
      <div class="field"><label><i>*</i>时间</label><input class="inp" id="bkDate" type="datetime-local" value="2026-10-31T14:00"></div>
      <div class="field"><label>陪同人 / 备注</label><input class="inp" id="bkNote" value="携 6 岁孙女，需儿童餐与无障碍通道"></div>
      <button class="btn g blk" onclick="Mob.bookSubmit()">提交预约</button></div></div>
      <div class="mc"><div class="mc-h"><b>我的预约记录</b><span>${MB.BOOKS().length} 条</span></div>
        <ul class="mlist">${MB.BOOKS().map(b=>`<li><div class="ic ${b.status==='已完成'?'g':'w'}">📅</div><div class="tx"><b>${esc(b.item)} · ${esc(b.name)}</b><p>${esc(b.date)} · ${esc(b.place)} · ${esc(b.staff||'待分配')}</p></div>
        <div class="rt">${tagHTML({tag:MODULES.booking.cols.find(c=>c.k==='status').tag},b.status)}${b.status==='待确认'?'<div class="tiny">可取消</div>':''}</div></li>`).join('')}</ul></div>
      <div class="mc"><div class="mc-h"><b>请假 / 外出代申请</b><span>需运营审批</span></div>
        <div class="mbtns"><button class="btn p" onclick="Mob.leaveSheet()">为父亲提交外出申请</button></div></div>`;
  },
  cPay(){
    const m = MB.MEM(); const pend = MODULES.order.rows.filter(o=>o.status==='待支付').slice(0,4);
    return `<div class="mhero"><b>父亲会员卡 · ${esc(m.lv)}</b><p>储值余额 ¥${(+m.balance||0).toLocaleString()} · 积分 ${esc(m.point)} · 代付额度 ¥20,000/月（已用 ¥4,120）</p>
      <div class="row"><div>本月代付<b>¥3,280</b></div><div>累计消费<b>¥${(+m.spend||0).toLocaleString()}</b></div><div>订阅<b>健康管理套餐</b></div></div></div>
      <div class="mc"><div class="mc-h"><b>待支付订单</b><span>${pend.length} 笔 · 可代付</span></div>
        ${pend.length?`<ul class="mlist">${pend.map(o=>`<li><div class="ic w">💳</div><div class="tx"><b>${esc(o.goods)}</b><p>${esc(o.no)} · ${esc(o.date)} · ${esc(o.name)}</p></div>
        <div class="rt"><b>¥${esc(o.amount)}</b><div class="link" onclick="Mob.pay(${o._id})">代付</div></div></li>`).join('')}</ul>`:'<div class="tiny">暂无待支付订单</div>'}</div>
      <div class="mc"><div class="mc-h"><b>储值充值</b><span>即时到账 · 开具电子发票</span></div>
        <div class="mgrid" style="grid-template-columns:repeat(4,1fr)">${[500,1000,2000,5000].map(v=>`<div onclick="Mob.topay(${v})"><div class="e">¥${v}</div>充值</div>`).join('')}</div></div>
      <div class="mc"><div class="mc-h"><b>消费明细</b><span>共 ${MODULES.order.rows.length} 笔</span></div>
        <ul class="mlist">${MODULES.order.rows.slice(0,5).map(o=>`<li><div class="ic">🧾</div><div class="tx"><b>${esc(o.goods)}</b><p>${esc(o.date)} · ${esc(o.pay)} · ${esc(o.payer||o.name)}</p></div><div class="rt">¥${esc(o.amount)}<br><span class="tag ${o.status==='已核销'?'green':o.status==='待支付'?'warn':'ink'}">${esc(o.status)}</span></div></li>`).join('')}</ul></div>`;
  },
  cMine(){
    const f = MODULES.family.rows.find(x=>x.cname===MB.child)||{cname:MB.child,ename:MB.elder,rel:'女儿',auth:'健康+位置+消费',pay:'已授权',quota:20000,notice:'告警+请假+消费+关怀',status:'已绑定'};
    return `<div class="mc" style="display:flex;align-items:center;gap:12px"><div class="av" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--green),var(--blue));color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px">👧</div>
      <div style="flex:1"><b style="font-size:16px">${esc(S.user?S.user.name:f.cname)}</b><div class="tiny">${esc(f.rel)} · 绑定长者 ${esc(f.ename)} · ${esc(f.status)}</div></div><span class="tag blue">子女端</span></div>
      <div class="mc"><div class="mc-h"><b>授权与代付</b><span>可在后台「子女服务管理」复核</span></div>
        <ul class="mlist"><li><div class="ic g">🔓</div><div class="tx"><b>数据授权范围</b><p>${esc(f.auth)}</p></div><div class="rt">已生效</div></li>
        <li><div class="ic">💳</div><div class="tx"><b>代付权限 / 额度</b><p>${esc(f.pay)} · ¥${esc(f.quota)}/月</p></div><div class="rt">可用</div></li>
        <li><div class="ic w">🔔</div><div class="tx"><b>通知偏好</b><p>${esc(f.notice)}</p></div><div class="rt"><span class="link" onclick="toast('通知偏好已保存','ok')">修改</span></div></li></ul></div>
      <div class="mc"><div class="mc-h"><b>家庭成员协作</b><span>3 位亲属</span></div>
        <ul class="mlist">${MODULES.family.rows.slice(0,3).map(x=>`<li><div class="ic">${x.status==='已绑定'?'👪':'⏳'}</div><div class="tx"><b>${esc(x.cname)} · ${esc(x.rel)}</b><p>${esc(x.ename)} · ${esc(x.auth)} · 最近探望 ${esc(x.visit)}</p></div><div class="rt"><span class="tag ${x.status==='已绑定'?'green':'warn'}">${esc(x.status)}</span></div></li>`).join('')}</ul></div>
      <div class="mbtns"><button class="btn" onclick="App.go('home')">← 返回门户</button><button class="btn dg" onclick="App.logout()">退出登录</button></div>`;
  },

  /* ===== 长者端 · 温暖与传承（相册 / 日记 / 传记） ===== */
  eWarm(kind){
    const who = MB.elder;
    const albs = Warm.albums(who,'',false), dis = Warm.diaries(who,''), bios = Warm.bios(who);
    const phN = albs.reduce((s,a)=>s+Warm.photos(a).length,0);
    const done = bios.filter(b=>b.status==='已成稿'||b.status==='已交付').length;
    const acts = [['📔','新建相册',"Warm.newAlbum('"+who+"')"],['🖊','写篇日记',"Mob.wKind('笔记')"],['🎙','说段录音',"Mob.wKind('录音')"],['🎨','画两笔',"Mob.wKind('画画')"],
      ['📷','拍张照',"Mob.wKind('拍照')"],['🖨','打印相册','Mob.wPrintList()'],['🤖','生成传记',"Warm.genForm('"+who+"')"],['🗑','回收站','Mob.wTrash()']];
    const albHTML = albs.length? `<div class="wb-grid">${albs.map(a=>`<div class="wb-al" onclick="Mob.wAlbum(${a._id})">
        <div class="im">${esc(a.cover||'📷')}<i>${Warm.photos(a).length} 张</i></div><b>${esc(a.name)}</b>
        <p>${esc(a.cate)} · ${esc(a.priv)}${a.share==='已生成链接'?' · 🔗 已分享':''}${a.printCnt?' · 🖨 '+a.printCnt:''}</p></div>`).join('')}</div>`
      : '<div class="tiny" style="padding:6px 0">还没有相册，点上方「新建相册」开始留存第一批老照片。</div>';
    const disHTML = dis.length? `<ul class="mlist">${dis.slice(0,8).map(d=>`<li onclick="Mob.wDiary(${d._id})"><div class="ic ${d.kind==='录音'?'':d.kind==='画画'?'g':d.kind==='拍照'?'w':''}">${({'笔记':'🖊','录音':'🎙','画画':'🎨','拍照':'📷'})[d.kind]||'📔'}</div>
        <div class="tx"><b>${esc(d.title)}</b><p>${esc(d.date)} ${esc(d.time||'')} · ${esc(d.mood||'平静')} · ${esc(d.auth||'家人可见')}</p></div>
        <div class="rt">${d.bio==='已引用'?'<span class="tag green">素材</span>':'<span class="tag ink">未引用</span>'}</div></li>`).join('')}</ul>`
      : '<div class="tiny" style="padding:6px 0">还没有日记，用下面的笔记 / 录音 / 画画 / 拍照记下今天。</div>';
    const bioHTML = bios.length? bios.map(b=>`<div class="wb-bio"><b>${esc(b.title)}</b>
        <div class="ab-tags">${tagHTML({tag:{'草稿':'ink','生成中':'blue','已成稿':'green','已交付':'purple'}}, b.status)}<span class="tag blue">${(b.chapters||[]).length} 章</span><span class="tag purple">${esc(b.style)}</span></div>
        <div class="prog"><i style="width:${b.progress||0}%"></i></div>
        <p>${esc((b.chapters&&b.chapters[1]&&b.chapters[1].c||b.note||'').slice(0,52))}…</p>
        <div class="mbtns" style="margin-top:8px"><button class="btn sm p" onclick="Mob.wBio(${b._id})">✍️ 自由编写</button>
          <button class="btn sm" onclick="Warm.printBio(${b._id})">🖨 打印成书</button>
          ${b.status!=='生成中'?`<button class="btn sm g" onclick="Warm.deliver(${b._id})">📮 交付</button>`:''}</div></div>`).join('')
      : '<div class="tiny" style="padding:6px 0">积累相册与日记后，可让 AI 辅助串一本属于自己的传记，全部内容由本人自由改写。</div>';
    return `<div class="wb-hero"><b>📖 温暖与传承</b><p>把照片、声音、字迹都留下来 —— 这些也会成为 AI 传记的素材，随时可以取消引用。</p>
        <div class="row"><div><b>${albs.length}</b><span>本相册</span></div><div><b>${phN}</b><span>张照片</span></div><div><b>${dis.length}</b><span>篇日记</span></div><div><b>${done}</b><span>部成稿</span></div></div></div>
      <div class="wb-acts">${acts.map(x=>`<div onclick="${x[2]}"><span class="e">${x[0]}</span><span>${x[1]}</span></div>`).join('')}</div>
      <div class="mc"><div class="mc-h"><b>我的相册</b><span class="link" onclick="Warm.newAlbum('${who}')">＋ 新建 ›</span></div>${albHTML}
        <div class="mbtns" style="margin-top:10px"><button class="btn sm" onclick="Mob.wPrintList()">🖨 打印成纸质</button><button class="btn sm" onclick="Mob.wPrintList()">🔗 分享一本</button></div></div>
      <div class="mc"><div class="mc-h"><b>记一条 · 笔记 / 录音 / 画画 / 拍照</b><span>四种都能留</span></div>${Warm.diaryPanel(S.dyKind||'笔记', who, true)}</div>
      <div class="mc"><div class="mc-h"><b>我留下的记录</b><span>${dis.length} 条 · 点开可回看与引用</span></div>${disHTML}</div>
      <div class="mc"><div class="mc-h"><b>我的传记（传承）</b><span class="link" onclick="Warm.genForm('${who}')">🤖 AI 辅生成 ›</span></div>${bioHTML}</div>`;
  },

  /* ===== 子女端 · 传承（接收与守护） ===== */
  cLegacy(kind){
    const who = MB.elder;
    const albs = Warm.albums(who,'',false).filter(a=>a.priv!=='私密');
    const dis = Warm.diaries(who,'').filter(d=>d.auth!=='私密');
    const bios = Warm.bios(who).filter(b=>b.status==='已成稿'||b.status==='已交付');
    const phN = albs.reduce((s,a)=>s+Warm.photos(a).length,0);
    const quote = (bios[0] && bios[0].deliverMsg) || '';
    return `<div class="wb-hero" style="background:linear-gradient(135deg,#0d4bb3,#7c5cff)"><b>🕯 传承 · ${esc(who)} 家人可见的内容</b>
        <p>仅在长者授权的范围内查看；查看行为写入操作日志，长者可随时收回授权或撤销分享。</p>
        <div class="row"><div><b>${albs.length}</b><span>本共享相册</span></div><div><b>${phN}</b><span>张照片</span></div><div><b>${dis.length}</b><span>篇日记</span></div><div><b>${bios.length}</b><span>部传记</span></div></div></div>
      ${quote? `<div class="mcard2"><b>💌 父亲交付时的一句话</b><p>${esc(quote)}</p><div style="margin-top:9px"><button class="btn sm g" onclick="Mob.legacyBack(${bios[0]._id})">回一句感谢</button></div></div>`:''}
      <div class="mc"><div class="mc-h"><b>AI 个人传记</b><span>${bios.length} 部已成稿 / 已交付</span></div>
        ${bios.length? bios.map(b=>`<div class="wb-bio"><b>${esc(b.title)}</b>
          <div class="ab-tags">${tagHTML({tag:{'已成稿':'green','已交付':'purple'}}, b.status)}<span class="tag blue">${(b.chapters||[]).length} 章</span><span class="tag">${esc(b.style)}</span></div>
          <p>${esc(String((b.chapters&&b.chapters[b.chapters.length-1]&&b.chapters[b.chapters.length-1].c)||'').slice(0,60))}</p>
          <div class="mbtns" style="margin-top:8px"><button class="btn sm p" onclick="Mob.wBio(${b._id})">📖 阅读全文</button>
            <button class="btn sm" onclick="Warm.printBio(${b._id})">🖨 打印装订</button>
            <button class="btn sm g" onclick="Mob.legacyBack(${b._id})">💬 回应一句</button></div></div>`).join('')
        : '<div class="tiny" style="padding:6px 0">长者还没有定稿的传记。他写好后，会第一时间出现在这里。</div>'}</div>
      <div class="mc"><div class="mc-h"><b>共享相册</b><span>长者设为「私密」的不展示</span></div>
        ${albs.length? `<div class="wb-grid">${albs.map(a=>`<div class="wb-al" onclick="Mob.wAlbum(${a._id})"><div class="im">${esc(a.cover||'📷')}<i>${Warm.photos(a).length} 张</i></div>
          <b>${esc(a.name)}</b><p>${esc(a.cate)} · ${esc(a.share==='已生成链接'?'有效期至 '+(a.shareExp||'—'):'未分享')}</p></div>`).join('')}</div>`:'<div class="tiny">暂无共享相册</div>'}</div>
      <div class="mc"><div class="mc-h"><b>最近的日记</b><span>${dis.length} 条</span></div>
        <ul class="mlist">${dis.slice(0,6).map(d=>`<li onclick="Mob.wDiary(${d._id})"><div class="ic ${d.kind==='录音'?'':d.kind==='画画'?'g':d.kind==='拍照'?'w':''}">${({'笔记':'🖊','录音':'🎙','画画':'🎨','拍照':'📷'})[d.kind]||'📔'}</div>
          <div class="tx"><b>${esc(d.title)}</b><p>${esc(d.date)} · ${esc(d.mood||'平静')} · ${esc(String(d.content||'').replace('【转写】','').slice(0,22))}</p></div>
          <div class="rt"><span class="link">查看</span></div></li>`).join('')}</ul></div>
      <div class="mc"><div class="mc-h"><b>帮父亲续写</b><span>可远程发起，长者确认后写入</span></div>
        <div class="mbtns"><button class="btn p" onclick="Mob.remindWrite()">🔔 提醒父亲记一条</button><button class="btn" onclick="Mob.printElderAlbum()">🖨 为父亲订一本纸质相册</button></div></div>`;
  },

  /* ===== 特殊长者 · 智能手环端 ===== */
  sBand(kind){
    const a=MB.SA(), h=MB.BH(), d=new Date(), p=n=>String(n).padStart(2,'0');
    const wk=['日','一','二','三','四','五','六'][d.getDay()];
    const log = S.bandLog||[];
    const dots = MB.BLOCS().map(L=>{const ok=log.some(x=>x.id===L.id);return `<div style="flex:1;text-align:center"><div style="width:44px;height:44px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:${ok?'linear-gradient(135deg,#1668dc,#00b578)':'#eef2f7'};color:${ok?'#fff':'#9aa7b6'}">${L.ico}</div><div style="font-size:10.5px;margin-top:4px;color:var(--sub)">${esc(L.name)}</div></div>`;}).join('');
    const next = MB.BLOCS().find(L=>!log.some(x=>x.id===L.id));
    const done = MB.BLOCS().filter(L=>log.some(x=>x.id===L.id)).length;
    return `<div class="mc" style="text-align:center;background:linear-gradient(160deg,#0f2038,#0a1524);color:#fff">
      <div style="font-size:13px;opacity:.82">${d.getMonth()+1} 月 ${d.getDate()} 日 · 周${wk} · ${esc(a.zone)}</div>
      <div class="big" style="font-size:66px;line-height:1.1;letter-spacing:2px;margin:2px 0">${p(d.getHours())}:${p(d.getMinutes())}</div>
      <div style="font-size:12.5px;opacity:.85">🔋 ${esc(h.bat||'86%')} · 📶 手环已连接 · 🟢 定位正常</div></div>
    <div class="mc"><div class="mc-h"><b>今日自动打卡</b><span>${done} / ${MB.BLOCS().length}</span></div>
      <div style="display:flex;gap:6px">${dots}</div>
      ${next?`<p class="tiny" style="margin-top:10px">下一站：<b>${next.ico} ${esc(next.name)}</b>（${esc(next.time)}）— 到达将自动打卡</p>`:'<p class="tiny" style="margin-top:10px">今日打卡已全部完成 ✅</p>'}</div>
    <div class="mc" style="border:2px solid var(--green)"><div class="mc-h"><b>📳 手环提醒</b><span>语音已播报</span></div>
      <ul class="mlist"><li><div class="ic g">🔔</div><div class="tx"><b style="font-size:16px">${esc(h.tip||'该喝温水了')}</b><p>震动 + 语音提示 · 无需操作</p></div></li></ul></div>
    <div style="display:flex;gap:12px;margin:4px 0 12px">
      <button class="btn dg" style="flex:1;height:78px;font-size:20px;border-radius:18px;line-height:1.4" onclick="Mob.sos()">🆘<br>呼救</button>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px">
        <button class="btn p" style="flex:1;font-size:15px" onclick="Mob.bandCall()">👧 呼叫家人</button>
        <button class="btn" style="flex:1;font-size:15px" onclick="Mob.bandVibrate()">📳 震动了没</button>
      </div></div>
    <div class="mc"><div class="mc-h"><b>实时体征（手环）</b><span>${esc(h.date||today())}</span></div>
      <div class="hcards" style="grid-template-columns:repeat(3,1fr)"><div class="hc1"><label>心率</label><b>${esc(h.hr)}<i style="font-size:11px"> bpm</i></b></div>
      <div class="hc2"><label>血压</label><b style="font-size:16px">${esc(h.bp)}</b></div><div class="hc3"><label>血氧</label><b>${esc(h.spo2)}<i style="font-size:11px"> %</i></b></div></div></div>
    <div class="mbtns"><button class="btn g blk" onclick="Mob.go('${kind}',1)">📍 查看今日打卡 ›</button></div>`;
  },
  sCheckin(kind){
    const log = S.bandLog||[];
    const locs = MB.BLOCS().map(L=>{const done=log.some(x=>x.id===L.id);const rec=log.find(x=>x.id===L.id);
      return `<div class="mc" style="display:flex;align-items:center;gap:12px;${done?'border:1.5px solid var(--green)':''}">
        <div style="width:48px;height:48px;border-radius:14px;background:${done?'linear-gradient(135deg,#1668dc,#00b578)':'var(--blue-l)'};color:${done?'#fff':'#1668dc'};display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto">${L.ico}</div>
        <div style="flex:1;min-width:0"><b style="font-size:15px">${esc(L.name)}</b><p class="tiny" style="margin:2px 0 0">${esc(L.time)} · 活动：${esc(L.act)}</p><p class="tiny" style="color:var(--sub-l)">${esc(L.hint)}</p></div>
        <div style="text-align:right;flex:0 0 auto">${done?`<span class="tag green">已打卡</span><div class="tiny">${esc(rec.t||'')}</div>`:`<button class="btn sm p" onclick="Mob.arrive(${L.id})">模拟到达</button>`}</div></div>`;}).join('');
    return `<div class="mhero"><b>🛰 到位置动打卡</b><p>长者走到以下特殊位置时，手环通过蓝牙 / GPS 围栏自动打卡、震动确认，并自动参加对应活动，全程无需任何操作。</p></div>
      ${locs}
      <div class="mc"><div class="mc-h"><b>今日打卡记录</b><span>${log.length} 条 · 已同步后台健康档案</span></div>
        <ul class="mlist">${log.length?log.slice().reverse().map(x=>`<li><div class="ic g">${x.ico||'📍'}</div><div class="tx"><b>${esc(x.name)}</b><p>${esc(x.act||'')} · 手环自动签到</p></div><div class="rt">${esc(x.t||'')}</div></li>`).join(''):'<li><div class="tx"><p style="text-align:center;color:var(--sub-l)">暂无记录，点击上方“模拟到达”体验</p></div></li>'}</ul></div>
      <div class="mbtns"><button class="btn g" onclick="Mob.arriveAll()">一键演示全部到达</button><button class="btn" onclick="S.bandLog=[];renderMobile(S.view)">清空记录</button></div>`;
  },
  sMine(kind){
    const a=MB.SA();
    return `<div class="mc" style="display:flex;align-items:center;gap:12px"><div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#1668dc,#00b578);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px">⌚</div>
      <div style="flex:1"><b style="font-size:17px">${esc(a.name)}</b><div class="tiny">${esc(a.zone)} ${esc(a.room)} · ${esc(a.age||80)} 岁 · 特殊长者</div></div><span class="tag green">在院</span></div>
    <div class="mc"><div class="mc-h"><b>我的智能手环</b><span>仅 5 项功能 · 零文字</span></div>
      <ul class="mlist">${[['🕒','显示时间','超大数字，整点震动报时'],['📳','震动提醒','吃药 / 活动 / 吃饭前震动 + 语音'],['🆘','一键呼救','长按 3 秒直连值班与家属'],['🛰','自动打卡','到特殊位置自动签到，无需操作'],['🔊','语音播报','一键报时、报当前位置、报天气']].map(x=>`<li><div class="ic">${x[0]}</div><div class="tx"><b style="font-size:15px">${x[1]}</b><p>${x[2]}</p></div></li>`).join('')}</ul></div>
    <div class="mc"><div class="mc-h"><b>设备与照护</b><span>IoT 已登记</span></div>
      <ul class="mlist"><li><div class="ic g">🔋</div><div class="tx"><b>电量 / 连接</b><p>${esc(MB.BH().bat||'86%')} · 蓝牙 + GPS 双定位</p></div><div class="rt"><span class="tag green">在线</span></div></li>
      <li><div class="ic">👧</div><div class="tx"><b>紧急联系人</b><p>${esc(a.guardian||'蒋涛')} · ${esc(a.gphone||'135****1180')}</p></div><div class="rt"><span class="link" onclick="Mob.bandCall()">呼叫</span></div></li>
      <li><div class="ic w">🗣</div><div class="tx"><b>语音播报 / 大字体</b><p>已开启 · 不识长者友好模式</p></div><div class="rt"><button class="btn sm g" onclick="this.classList.toggle('g');toast('设置已更新（演示）','ok')">开</button></div></li></ul></div>
    <div class="mbtns"><button class="btn" onclick="App.go('home')">← 返回门户</button><button class="btn dg" onclick="App.logout()">退出登录</button></div>`;
  },

  /* ===== 紧急监管端（APP / 小程序共用，Web 紧急监管的移动化转换） ===== */
  gKpi(){ EME.seed();
    const urg = EME.list.filter(x=>x.lvl===1 && !['已闭环','误报'].includes(x.status)).length;
    return { open:EME.openCnt(), urg, last: EME.list.length?EME.list.slice().sort((a,b)=>b.ts-a.ts)[0]:null };
  },
  gFeed(n){
    const order = {'待处理':0,'升级中':1,'处置中':2,'已闭环':3,'误报':4};
    return EME.list.slice().sort((a,b)=>(order[a.status]||0)-(order[b.status]||0)||b.ts-a.ts).slice(0,n||8).map(it=>{
      const done = it.status==='已闭环'||it.status==='误报';
      return `<li class="${it.lvl===1&&!done?'em-al':''}"><div class="ic ${it.lvl===1?'r':it.lvl===2?'w':'g'}">${it.ico}</div>
        <div class="tx"><b>${esc(it.kind)} <span class="em-lv v${it.lvl}">${it.lvl===1?'一级':it.lvl===2?'二级':'三级'}</span></b>
          <p>${esc(it.obj)} · ${esc(it.val)}</p>
          <p class="tiny">${esc(it.time.slice(5))} · ${esc(it.owner||'待接单')} · ${esc(it.status)}</p></div>
        <div class="rt">${done?`<span class="tag green">${esc(it.status)}</span>`
          :`<button class="btn sm p" onclick="Mob.emHandle(${it.id})">处理</button>`}</div></li>`; }).join('')
      || `<li><div class="tx"><p style="text-align:center;color:var(--sub-l)">当前无告警，园区安全运行中</p></div></li>`;
  },
  gHome(kind){
    const k = MB.gKpi(), d=new Date(), p=n=>String(n).padStart(2,'0');
    return `<div class="mhero em-hero"><b>${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} · ${p(d.getMonth()+1)}-${p(d.getDate())}</b>
      <p>一级接警席位 · 3 分钟未确认升级院长/值班领导，必要时 120</p>
      <div class="row"><div>待处理<b>${k.open}</b></div><div>一级紧急<b>${k.urg}</b></div><div>执勤/备勤<b>${EM_DUTY.length}/${EM_STANDBY.length}</b></div></div></div>
    <div class="mc"><div class="mc-h"><b>最近预警</b><span>${k.last?esc(k.last.time.slice(11))+' · '+esc(k.last.kind):'暂无'}</span></div>
      <ul class="mlist">${MB.gFeed(5)}</ul>
      <div class="mbtns"><button class="btn g blk" onclick="Mob.go('${kind}',1)">🚨 进入告警处置 ›</button></div></div>
    <div class="mc"><div class="mc-h"><b>场景安全状态</b><span>${EM_SCENES.length} 类 · 🟢 安全 / 🔴 紧急</span></div>
      <div class="em-g">${EM_SCENES.map(s=>{ const st=EME.scenes[s.k]||{n:0,open:0};
        return `<div class="em-c${st.open?' al':''}" onclick="Mob.emScene('${s.k}')"><div class="e">${s.ico}</div><b>${esc(s.name)}</b><i>${st.open?'紧急':'安全'} · ${st.n} 条</i></div>`; }).join('')}</div></div>
    <div class="mc"><div class="mc-h"><b>备勤人员 · 快速通话</b><span>点击直拨</span></div>
      <ul class="mlist">${EM_STANDBY.slice(0,3).map(s=>`<li><div class="ic g">🛡</div><div class="tx"><b>${esc(s.name)}</b><p>${esc(s.role)}</p></div>
        <div class="rt"><span class="link" onclick="Mob.emCall('${esc(s.name)}','${esc(s.role)}','${esc(s.phone)}')">📞 通话</span></div></li>`).join('')}</ul></div>`;
  },
  gAlert(kind){
    const k = MB.gKpi();
    return `<div class="mhero"><b>🚨 实时告警列表</b><p>最新在上 · 待处理 ${k.open} 条 · 一级 ${k.urg} 条 · 与 Web 端紧急监管同源</p></div>
      <div class="mc"><div class="mc-h"><b>全部告警</b><span class="link" onclick="renderMobile('${kind}')">↻ 刷新</span></div><ul class="mlist">${MB.gFeed(14)}</ul></div>
      <div class="mc"><div class="mc-h"><b>三级响应规则</b><span>点击展开</span></div>
      <ul class="mlist">${EM_RULES.map(r=>`<li><div class="ic ${r.color==='red'?'r':r.color==='warn'?'w':'g'}">${r.color==='red'?'🆘':r.color==='warn'?'⚠️':'ℹ️'}</div>
        <div class="tx"><b>${esc(r.lvl)}</b><p>${esc(r.scenes)}</p><p class="tiny">接警 ${esc(r.first)} · 处置 ${esc(r.main)}</p></div>
        <div class="rt"><span class="link" onclick="toast('${esc(r.esc)}','warn')">升级</span></div></li>`).join('')}</ul></div>`;
  },
  gStandby(kind){
    const row = (x, tag) => `<li><div class="ic ${tag}">🛡</div><div class="tx"><b>${esc(x.name)} <span class="em-lv v3">${esc(x.role.split(' · ')[0])}</span></b><p>${esc(x.phone)} · 总机转接</p></div>
      <div class="rt"><button class="btn sm g" onclick="Mob.emCall('${esc(x.name)}','${esc(x.role)}','${esc(x.phone)}')">📞</button></div></li>`;
    return `<div class="mhero"><b>🛡 执勤 / 备勤调度</b><p>执勤 ${EM_DUTY.length} 人 24h 在岗 · 备勤 ${EM_STANDBY.length} 人随叫随到</p></div>
      <div class="mc"><div class="mc-h"><b>当班执勤</b><span>安保中控室</span></div><ul class="mlist">${EM_DUTY.map(x=>row(x,'g')).join('')}</ul></div>
      <div class="mc"><div class="mc-h"><b>备勤人员</b><span>升级处置链</span></div><ul class="mlist">${EM_STANDBY.map(x=>row(x,'w')).join('')}</ul></div>
      <div class="mc"><div class="mc-h"><b>一键群呼</b><span>演练 / 重大事件</span></div>
      <div class="mbtns"><button class="btn p blk" onclick="toast('已发起群呼：执勤 ${EM_DUTY.length} 人 + 备勤 ${EM_STANDBY.length} 人（演示）','ok');logAct('紧急监管 · 群呼','执勤+备勤','高')">📣 群呼全部人员</button></div></div>`;
  },
  gMine(kind){
    return `<div class="mc" style="display:flex;align-items:center;gap:12px"><div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#e5484d,#f5a623);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px">🛡</div>
      <div style="flex:1"><b style="font-size:17px">${esc(S.user?S.user.name:'赵启明')}</b><div class="tiny">${esc(S.user?S.user.role:'安保中控室 · 紧急监管端')} · ${kind==='app'?'APP 端':'小程序端'}</div></div><span class="tag red">一级接警席</span></div>
    <div class="mc"><div class="mc-h"><b>接警能力</b><span>与 Web 后台同源</span></div>
      <ul class="mlist">${[['📥','实时接收','全系统预警报警统一汇聚，秒级滚动'],['🗺','场景状态','10 类场景安全/紧急状态与记录数'],['🚑','接单处置','确认→处置→闭环/误报，全留痕'],['⏫','自动升级','一级 3 分钟 / 二级 15 分钟未处理自动升级'],['📞','快速通话','执勤与备勤人员一键直拨']].map(x=>`<li><div class="ic">${x[0]}</div><div class="tx"><b style="font-size:15px">${x[1]}</b><p>${x[2]}</p></div></li>`).join('')}</ul></div>
    <div class="mc"><div class="mc-h"><b>本端快捷入口</b><span>演示</span></div>
      <div class="mgrid">${[['🚨','紧急监管台',"App.go('admin','emergency')"],['🏙','3D 监控',"App.go('admin','twin')"],['📈','设备告警',"App.go('admin','iot')"],['🛰','数字大屏',"App.go('screen')"]].map(x=>`<div onclick="${x[2]}"><div class="e">${x[0]}</div>${x[1]}</div>`).join('')}</div></div>
    <div class="mbtns"><button class="btn" onclick="App.go('home')">← 返回门户</button><button class="btn dg" onclick="App.logout()">退出登录</button></div>`;
  }
};

/* ---------- 交互动作（写入模块数据，与后台实时联动） ---------- */
const Mob = {
  go(kind, i){ S[kind+'Tab'] = i; renderMobile(kind); },
  role(kind, r){ S.mobileRole[kind]=r; S[kind+'Tab']=0; renderMobile(kind); toast(`${kind==='app'?'APP':'小程序'}已切换为${r==='elder'?'长者端':r==='child'?'子女端':r==='guard'?'紧急监管端':'特殊长者手环端'}`,'ok'); },

  /* ---- 紧急监管端 · 移动端弹框（手机屏内的 .sheet 底部弹层，参考长者端样式） ---- */
  emHandle(id){ const it = EME.list.find(x=>x.id===id); if(!it) return;
    const pool = it.lvl===1?EM_DUTY.slice(0,3).concat(EM_STANDBY.slice(0,2)):it.lvl===2?EM_DUTY.slice(1):EM_STANDBY.slice(3);
    const rule = EM_RULES[it.lvl-1];
    MB.sheet(`<h4>${it.ico} 告警处置 · ${esc(it.kind)}（${it.lvl===1?'一级 紧急':it.lvl===2?'二级 警告':'三级 提示'}） <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform">
        <div class="field"><label>触发位置 / 对象</label><input class="inp" value="${esc(it.obj)}" readonly></div>
        <div class="field"><label>采集数值</label><input class="inp" value="${esc(it.val)}" readonly></div>
        <div class="field"><label>上报时间</label><input class="inp" value="${esc(it.time)}" readonly></div>
        <div class="field"><label>指派处置人</label><select class="sel" id="emOwner">${pool.map(o=>`<option>${esc(o.name)} · ${esc(o.role)}</option>`).join('')}</select></div>
        <div class="field"><label>处置措施</label><textarea class="txta" id="emAct" style="height:72px;padding:8px 12px">${it.lvl===1?'对讲机通知就近护理员 30 秒内到场，医护同步待命，已推送子女端':'安排值班人员现场确认并登记工单'}</textarea></div>
        <div class="tiny">响应要求：${esc(rule.first)} 接警 → ${esc(rule.main)} 主处置 → <b style="color:#e5484d">${esc(rule.esc)}</b></div>
      </div>
      <div class="mbtns" style="margin-top:12px"><button class="btn" onclick="MB.close()">取消</button><button class="btn g" onclick="Mob.emTake(${id})">确认接单</button></div>`);
  },
  emTake(id){ const it = EME.list.find(x=>x.id===id); if(!it) return;
    const o=$('emOwner'), a=$('emAct');
    it.owner = o?o.value.split(' · ')[0]:it.owner; it.status='处置中'; it.result=(a?a.value:'').slice(0,60);
    MB.close(); toast(`已接单：${it.kind} → ${it.owner} 处置中`,'ok'); logAct('紧急监管 · 接单处置', it.kind+' / '+it.obj, '高');
    EME.syncScene(); persist(); renderMobile(S.view);
  },
  emScene(k){ const s = typeof k==='number'?EM_SCENES[k]:EM_SCENES.find(x=>x.k===k)||EM_SCENES[0];
    const rows = EME.list.filter(x=>x.scene===s.k);
    MB.sheet(`<h4>${s.ico} ${esc(s.name)} · 记录信息（${rows.length} 条） <span class="link" onclick="MB.close()">关闭</span></h4>
      <ul class="mlist">${rows.length?rows.map(r=>`<li><div class="ic ${r.status==='已闭环'?'g':r.status==='误报'?'w':'r'}">${r.ico}</div>
        <div class="tx"><b>${esc(r.obj)}</b><p>${esc(r.val)}</p><p class="tiny">${esc(r.time.slice(5))} · ${esc(r.owner||'—')} · ${esc(r.status)}</p></div></li>`).join('')
        : `<li><div class="tx"><p style="text-align:center;color:var(--sub-l)">该场景当前无告警记录，状态安全</p></div></li>`}</ul>
      <div class="tiny" style="margin-top:10px">监测点位：${s.place.map(p=>esc(p)).join(' / ')}　·　响应级别：${s.lvl===1?'一级（紧急）':s.lvl===2?'二级（警告）':'三级（提示）'}</div>`);
  },
  emCall(name, role, phone){
    MB.sheet(`<h4>📞 快速通话 <span class="link" onclick="Mob.emHangup()">挂断</span></h4>
      <div class="em-pw" style="border:0;padding:6px 0 12px"><div class="av" style="width:46px;height:46px;font-size:22px">🛡</div>
        <div style="flex:1"><b style="font-size:15px">${esc(name)}</b><div class="tiny">${esc(role)} · ${esc(phone)}</div></div>
        <span class="tag green" id="emCallSt">呼叫中…</span></div>
      <div class="tiny">通话经由安保中控室总机转接（演示）　·　<span id="emCallTm">00:00</span></div>
      <div class="mbtns" style="margin-top:12px"><button class="btn dg blk" onclick="Mob.emHangup()">📞 挂断</button></div>`);
    clearInterval(window.__emCall); let s=0;
    const tick=()=>{ const n=$('emCallTm'); if(!n){ clearInterval(window.__emCall); return; }
      s++; n.textContent = String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
      if(s===3){ const st=$('emCallSt'); if(st){ st.textContent='已接通'; st.className='tag blue'; } toast(`已接通 ${name}（${role}）`,'ok'); } };
    tick(); window.__emCall = setInterval(tick, 1000);
    logAct('紧急监管 · 快速通话', name+' / '+role, '中');
  },
  emHangup(){ clearInterval(window.__emCall); MB.close(); },

  signup(id){ const a=MODULES.activity.rows.find(x=>x._id===id); if(!a) return;
    const left=(+a.quota||0)-(+a.signed||0);
    if(left<=0){ toast('名额已满，已加入候补队列','warn'); a.need='需家属陪同'; a.status='报名中'; }
    else { a.signed=(+a.signed||0)+1; toast(`「${a.title}」报名成功，签到码已下发手环与大屏`,'ok'); }
    persist(); renderMobile(S.view);
    logAct('活动报名（'+S.view.toUpperCase()+'）', a.title+' · 已报名 '+a.signed, '低');
    MODULES.remind && MODULES.remind.rows.unshift({ _id:++UID, title:'活动签到提醒：'+a.title, target:MB.elder, kind:'活动', time:a.date, level:'普通', repeat:'仅一次', channel:'站内+APP', owner:S.user?S.user.name:'系统', content:'请提前 10 分钟到场，凭手环二维码或人脸签到', status:'待推送', ack:'' });
  },
  actList(){ MB.sheet(`<h4>🎪 可报名活动 <span class="link" onclick="MB.close()">关闭</span></h4><ul class="mlist">${MB.ACTS().map(a=>`<li><div class="ic">${a.status==='进行中'?'🔴':'🎟'}</div><div class="tx"><b>${esc(a.title)}</b><p>${esc(a.date)} · ${esc(a.place)} · ${esc(a.desc||'')}</p></div><div class="rt"><button class="btn sm p" onclick="MB.close();Mob.signup(${a._id})">${(+a.quota||0)-(+a.signed||0)>0?'报名':'候补'}</button></div></li>`).join('')}</ul>`); },

  meal(){ MB.sheet(`<h4>🍚 今日订餐 <span class="link" onclick="MB.close()">关闭</span></h4>
    <ul class="mlist">${MODULES.menu.rows.filter(m=>m.meal==='午餐'&&m.status==='供应中').slice(0,6).map(d=>`<li><div class="ic">🍲</div><div class="tx"><b>${esc(d.dish)}</b><p>${esc(d.kcal)} kcal · ${esc(d.tag)} · ¥${esc(d.price)}</p></div><div class="rt"><button class="btn sm p" onclick="Mob.mealAdd('${esc(d.dish)}',${+d.price||0})">＋</button></div></li>`).join('')}</ul>
    <div style="margin-top:10px" class="mbtns"><button class="btn g" onclick="Mob.mealSubmit()">提交订单（${MB.cart.length} 件）</button><button class="btn" onclick="MB.cart=[];MB.close();renderMobile(S.view)">清空</button></div>`); },
  mealAdd(dish, price){ MB.cart.push({d:dish,p:price}); toast(`已加入购物车：${dish}`,'ok');
    const n=$('cartN'), a=$('cartA'); if(n) n.textContent=MB.cart.length+' 件'; if(a) a.textContent='¥'+MB.cart.reduce((s,c)=>s+c.p,0); },
  mealSubmit(){ if(!MB.cart.length){ toast('请先选择菜品','warn'); return; }
    const total = MB.cart.reduce((s,c)=>s+c.p,0);
    MODULES.order.rows.unshift({ _id:++UID, no:'DD'+String(Date.now()).slice(-10), name:MB.elder, goods:MB.cart.map(c=>c.d).join('、'), amount:total, pay:'储值余额', payer:MB.elder, point:0, date:now(), status:'待支付', staff:'', invoice:'待开具', remark:'APP/小程序订餐，需低盐' });
    MODULES.arrange && MODULES.arrange.rows.unshift({ _id:++UID, name:MB.elder, date:today(), br:'小米南瓜粥+水煮蛋', lunch:MB.cart.map(c=>c.d).join('、'), dinner:'山药粥+豆腐羹', snack:'无糖点心', kcal:1580, salt:1750, check:'达标', cook:'待确认', note:'长者端自助订餐，请少盐' });
    MB.cart=[]; MB.close(); persist(); renderMobile(S.view); logAct('自助订餐', '订单 ¥'+total, '低');
    toast(`订餐已提交 ¥${total}，已生成配餐计划并推送厨房确认`,'ok');
    setTimeout(()=>{ if(S.view==='admin'&&S.mod==='order') renderPage(); }, 60);
  },

  bookSheet(){ MB.sheet(`<h4>📅 预约 / 代预约 <span class="link" onclick="MB.close()">关闭</span></h4>
    <div class="mform"><div class="field"><label><i>*</i>项目</label><select class="sel" id="sItem"><option>中医理疗体验</option><option>康复理疗评估</option><option>营养膳食体验</option><option>认知功能筛查</option><option>旅居客房体验</option></select></div>
    <div class="field"><label>时间</label><input class="inp" id="sDate" type="datetime-local" value="2026-10-28T10:00"></div>
    <div class="field"><label>场地 / 服务人</label><input class="inp" id="sPlace" value="康养区 理疗室 1 · 陈叙白"></div>
    <div class="field"><label>备注</label><input class="inp" id="sNote" value="肩颈不适，希望安排上午"></div>
    <button class="btn p blk" onclick="Mob.bookSubmit()">提交预约</button></div>`); },
  bookSubmit(){ const it=$('sItem').value, d=($('sDate').value||'').replace('T',' '), pl=$('sPlace').value, nt=$('sNote').value;
    const kind = S.mobileRole[S.view]==='child'?'子女代约':'长者';
    MODULES.booking.rows.unshift({ _id:++UID, code:'YY'+String(Date.now()).slice(-11), name:S.mobileRole[S.view]==='child'?MB.child:MB.elder, kind, item:it,
      date:d||'2026-10-28 10:00', dur:45, place:pl, staff:(pl.split('·')[1]||'').trim()||'待分配', price:128, from:S.view==='mp'?'小程序':'APP', note:nt, status:'待确认', lead:'—' });
    MB.close(); persist(); renderMobile(S.view); logAct('提交预约（'+S.view.toUpperCase()+'）', it, '低');
    toast(`预约已提交，等待运营在「预约体验管理」确认`,'ok'); },

  leaveSheet(){ MB.sheet(`<h4>📝 外出 / 请假申请 <span class="link" onclick="MB.close()">关闭</span></h4>
    <div class="mform"><div class="field"><label>类型</label><select class="sel" id="lType"><option>回家探亲</option><option>就医外出</option><option>短途旅居</option><option>参加活动</option></select></div>
    <div class="field"><label><i>*</i>开始</label><input class="inp" id="lS" type="datetime-local" value="2026-10-27T09:00"></div>
    <div class="field"><label><i>*</i>预计归园</label><input class="inp" id="lE" type="datetime-local" value="2026-10-27T18:00"></div>
    <div class="field"><label>目的地 / 陪同人</label><input class="inp" id="lD" value="南京市鼓楼区 · 徐乐陪同"></div>
    <div class="field"><label>事由</label><input class="inp" id="lR" value="家庭聚会"></div>
    <button class="btn g blk" onclick="Mob.leaveSubmit()">提交申请（进入审批流）</button></div>`); },
  leaveSubmit(){ const t=$('lType').value, s=($('lS').value||'').replace('T',' '), e=($('lE').value||'').replace('T',' '), d=$('lD').value, r=$('lR').value;
    MODULES.leave.rows.unshift({ _id:++UID, code:'QJ'+String(Date.now()).slice(-11), name:MB.elder, type:t, start:s||now(), end:e||now(), dest:d.split('·')[0].trim(), with:(d.split('·')[1]||'').trim()||'家属', gphone:'139****8801', reason:r||d, status:'待审批', approver:'' });
    MB.close(); persist(); renderMobile(S.view); logAct('提交请假申请', t, '低'); toast('已提交，运营端「请假管理」待审批角标 +1','ok'); },
  approve(id){ const l=MODULES.leave.rows.find(x=>x._id===id); if(!l) return; toast(`已催办：${l.name} 的${l.type}申请（当前 ${l.status}）`,'warn'); pushAlert('子女催办请假审批', `${l.name} 的「${l.type}」申请待 ${l.approver||'运营'} 处理`); },

  like(id){ const c=MODULES.circle.rows.find(x=>x._id===id); if(!c) return; c.likes=(+c.likes||0)+1; S.liked=S.liked||new Set(); S.liked.add(id);
    persist(); renderMobile(S.view); toast('已点赞，内容同步到子女端','ok'); },
  comment(id){ MB.sheet(`<h4>💬 留言 <span class="link" onclick="MB.close()">关闭</span></h4>
    <div class="field"><textarea class="txta" id="cTxt" style="height:80px;padding:8px 12px" placeholder="写点什么给${id?'这篇动态':'父亲'}…">爸，血压记录我看到了，注意休息</textarea></div>
    <button class="btn p blk" onclick="Mob.commentSend(${id||0})">发布留言（同步房间大屏）</button>`); },
  commentSend(id){ const t=($('cTxt')&&$('cTxt').value)||'留言内容';
    MODULES.circle.rows.unshift({ _id:++UID, author:S.mobileRole[S.view]==='child'?MB.child:MB.elder, kind:'子女留言', text:t, imgs:'', likes:0, cmts:0, share:'已同步', date:now(), status:S.mobileRole[S.view]==='child'?'已发布':'待审核' });
    if(id){ const c=MODULES.circle.rows.find(x=>x._id===id); if(c) c.cmts=(+c.cmts||0)+1; }
    MB.close(); persist(); renderMobile(S.view); logAct('发布留言', t.slice(0,20), '低'); toast('留言已发布并推送到对方终端','ok'); },
  post(){ MB.sheet(`<h4>✍️ 发布康养圈动态 <span class="link" onclick="MB.close()">关闭</span></h4>
    <div class="field"><label>内容（大字体输入）</label><textarea class="txta" id="pTxt" style="height:86px;padding:8px 12px">今天和老伙伴们下了一盘棋，还参加了书法课，心情很好！</textarea></div>
    <div class="field"><label>同步给子女</label><select class="sel" id="pShare"><option>已同步</option><option>未同步</option></select></div>
    <button class="btn g blk" onclick="Mob.postSend()">发布（需内容审核）</button>`); },
  postSend(){ const t=$('pTxt').value, sh=$('pShare').value;
    MODULES.circle.rows.unshift({ _id:++UID, author:MB.elder, kind:'康养圈动态', text:t, imgs:'📷', likes:0, cmts:0, share:sh, date:now(), status:'待审核' });
    MB.close(); persist(); renderMobile(S.view); logAct('发布动态', t.slice(0,20), '低'); toast('已提交，运营端「康养圈」待审核 +1','ok'); },

  aiOpen(){ MB.chat = MB.chat.length?MB.chat:[{me:0,t:'徐爷爷上午好呀☀ 今天园区 18℃，适合去银杏大道走走，要我帮您约李爷爷一起吗？'}];
    MB.sheet(`<h4>🤖 AI 陪伴「小康」 <span class="link" onclick="Mob.aiClose()">结束会话</span></h4>
      <div class="chat" id="aiBox" style="flex:1;overflow:auto;min-height:280px">${MB.chat.map(Mob.bubble).join('')}</div>
      <div class="qk" style="margin-top:10px">${['今天吃什么好？','给我讲段评书','提醒我吃药','我有点想家'].map(q=>`<button onclick="Mob.aiAsk('${q}')">${q}</button>`).join('')}</div>`, 'height:76%;display:flex;flex-direction:column'); },
  bubble(m){ return `<div class="m ${m.me?'me':''}"><div class="av">${m.me?'🧓':'🤖'}</div><div class="bb">${esc(m.t)}</div></div>`; },
  aiAsk(q){ MB.chat.push({me:1,t:q}); const h=new Date().getHours();
    const rp = /吃|餐/.test(q)?`今天午餐推荐清蒸鲈鱼配杂粮饭，低盐又高蛋白，您的血压最近控制得不错。需要我直接下单吗？`
      : /评书|戏曲|讲/.test(q)?`好的，来一段《杨家将》选段🎶 唱完我们一起聊聊重阳节汇演的节目单吧。`
      : /药/.test(q)?`已为您设置 12:30 降压药提醒，同时通知值班护士站。服药后请坐 5 分钟再起身～`
      : /想家|难过|闷/.test(q)?`我懂这种想念的感觉。要不要我给徐乐发个提醒，今晚 19:00 你们视频聊聊？我也可以陪您翻翻老照片。`
      : `${MB.greet()}！当前您的心率 78、血压 ${MB.H().bp}，状态平稳。今天有智能手机课堂（防诈实操）和太极课，我帮您报名哪一个？`;
    if(/想家|难过|闷/.test(q)) MB.mood='低落';
    MB.chat.push({me:0,t:rp});
    const b=$('aiBox'); if(b){ b.innerHTML=MB.chat.map(Mob.bubble).join(''); b.scrollTop=b.scrollHeight; } },
  aiClose(){ if(MB.chat.length>1){
      MODULES.ai.rows.unshift({ _id:++UID, name:MB.elder, term:S.view==='mp'?'小程序':'APP', date:now(), turns:Math.floor(MB.chat.length/2),
        topic:/想家|难过|闷/.test(MB.chat.map(c=>c.t).join(''))?'情绪陪伴':'日常问候', mood:MB.mood||'积极',
        snippet:MB.chat.slice(-2).map(c=>c.t).join(' / ').slice(0,120), alert:MB.mood==='低落'?'已派关怀任务':'无', persona:'小康·贴心管家', dur:MB.chat.length });
      if(MB.mood==='低落'){ pushAlert('AI 陪伴情绪预警', '识别到长者情绪低落，已自动生成人文关怀任务并指派管家'); MODULES.care.rows.unshift({ _id:++UID, name:MB.elder, type:'情绪疏导', date:today(), owner:'周与安', channel:'上门陪伴', content:'AI 识别情绪低落，安排 30 分钟陪伴聊天并邀请参加书法课', result:'', status:'待执行', sat:'待回访' }); }
      MB.mood=null; MB.chat=[]; persist(); logAct('AI 陪伴会话归档', 'APP/小程序端', '低'); toast('会话已归档至「AI 聊天陪伴」并生成情绪分析','ok'); }
    MB.close(); },

  sos(){ MB.sheet(`<h4>🆘 一键呼救确认</h4><p style="font-size:13px;line-height:1.9;color:var(--sub)">将同时通知：<b>值班医护 · 智能门禁 · 房间大屏 · 子女端</b><br>定位：${esc(MB.A().zone)} ${esc(MB.A().room)}</p>
    <div style="text-align:center;margin:14px 0"><div class="big" style="color:var(--danger)" id="sosN">3</div></div>
    <button class="btn dg blk" style="height:46px;font-size:16px" onclick="Mob.sosGo()">立即呼救</button>`, 'text-align:left');
    let n=3; const t=setInterval(()=>{ n--; const e=$('sosN'); if(e) e.textContent=n; if(n<=0){ clearInterval(t); Mob.sosGo(); } },1000); Mob._t=t; },
  sosGo(){ clearInterval(Mob._t); MB.close();
    pushAlert('SOS 一键呼救', `${MB.elder} 在 ${MB.A().room} 触发紧急呼叫，手环同步检测到心率 ${MB.H().hr}、血氧 ${MB.H().spo2}%，请 3 分钟内到场`);
    logAct('SOS 呼救', MB.elder+' / '+S.view.toUpperCase(), '高'); persist(); },
  sosCall(){ toast('已呼叫园区 24 小时值班电话（演示）','warn'); pushAlert('子女端发起紧急联系', `${MB.child} 请求与值班管家立即沟通，涉及长者 ${MB.elder}`); },

  sport(){ const st=[['快走 30 分钟',32,3200,186],['太极基础',25,1400,120],['平衡训练',15,600,74]]; const x=st[Math.floor(Math.random()*st.length)];
    MODULES.sport.rows.unshift({ _id:++UID, name:MB.elder, date:today(), plan:x[0], dur:x[1], step:x[2], hr:96, maxhr:118, kcal:x[3], rpe:'适中', safe:'运动后请补水 200ml，注意防滑', coach:'王芳', status:'已达标' });
    const h=MB.HIST()[0]; if(h) h.step=(+h.step||0)+x[2]; persist(); renderMobile(S.view); logAct('运动打卡', x[0], '低'); toast(`已打卡：${x[0]} · ${x[2]} 步 · 消耗 ${x[3]} kcal`,'ok'); },
  remind(id){ const r=MODULES.remind.rows.find(x=>x._id===id); if(!r) return; r.status='已确认'; r.ack=now();
    persist(); renderMobile(S.view); toast(`已确认：${r.title}`,'ok'); logAct('确认提醒', r.title, '低');
    if(r.kind==='用药'){ MODULES.health.rows.unshift({ _id:++UID, name:MB.elder, date:today(), hr:MB.H().hr, spo2:MB.H().spo2, bp:MB.H().bp, sleep:MB.H().sleep, step:MB.H().step, risk:'低', type:'护理记录', note:'长者端自助确认服药：'+r.title, doctor:'陈叙白', auth:'已授权' }); } },
  scan(){ const a=MODULES.activity.rows.find(x=>x.status==='进行中')||MB.ACTS()[0];
    if(a){ a.checkin=(+a.checkin||0)+1; persist(); logAct('扫码/人脸签到', a.title, '低'); toast(`核销成功：${a.title} · 累计签到 ${a.checkin} 人`,'ok'); } else toast('签到成功','ok'); },
  repair(){ MB.sheet(`<h4>🛠 服务报修 / 申请 <span class="link" onclick="MB.close()">关闭</span></h4>
    <div class="mform"><div class="field"><label>类型</label><select class="sel" id="rpType"><option>房间保洁</option><option>设备报修（呼叫器/手环）</option><option>陪同就医</option><option>助浴协助</option><option>餐饮调整</option></select></div>
    <div class="field"><label>描述</label><input class="inp" id="rpTx" value="浴室地垫翘起，存在滑倒风险"></div>
    <button class="btn p blk" onclick="Mob.repairSend()">提交（生成服务工单）</button></div>`); },
  repairSend(){ const t=$('rpType').value, x=$('rpTx').value; MB.close();
    MODULES.complaint.rows.unshift({ _id:++UID, code:'TS'+String(Date.now()).slice(-10), title:t+'：'+x.slice(0,18), from:S.user?S.user.name:MB.elder,
      role:S.mobileRole[S.view]==='child'?'子女':'长者', channel:S.view==='mp'?'小程序':'APP', kind:['设备报修（呼叫器/手环）'].includes(t)?'意见':'咨询',
      cate:/设备/.test(t)?'设备':/保洁/.test(t)?'环境':/餐/.test(t)?'膳食':'其他', content:x, level:/报修|滑倒/.test(t)?'重要':'普通',
      owner:'孙婉清', sla:/报修|滑倒/.test(t)?'24 小时':'48 小时', date:now(), status:'待受理', reply:'' });
    persist(); renderMobile(S.view); logAct('提交服务申请', t, '低'); toast('已受理，进入后台「投诉与服务管理」待处理','ok'); },
  video(){ toast('已提交录像查看申请，需管理决策层授权（演示）','warn');
    MODULES.auth2 && MODULES.auth2.rows.unshift({ _id:++UID, plat:'社区系统', scope:'健康摘要', obj:`子女 ${MB.child} → 长者 ${MB.elder}（公共区域录像调阅）`,
      map:'video_no, time_range, area → 脱敏后回执', mask:'姓名去标识', start:today(), end:today(), cnt:0, check:'待校验', status:'待授权' });
    persist(); logAct('申请录像查看', MB.A().room+' 公共区域', '高'); },
  pay(id){ const o=MODULES.order.rows.find(x=>x._id===id); if(!o) return; o.status='已支付'; o.pay=(o.pay==='储值余额'?'子女代付':'子女代付'); o.payer=MB.child;
    const m=MB.MEM(); m.spend=(+m.spend||0)+(+o.amount||0); m.point=(+m.point||0)+Math.round((+o.amount||0)/10);
    persist(); renderMobile(S.view); logAct('子女代付', o.goods+' ¥'+o.amount, '中'); toast(`已为父亲代付 ¥${o.amount}，积分 +${Math.round(o.amount/10)}`,'ok'); },
  topay(v){ v=v||500; const m=MB.MEM(); m.balance=(+m.balance||0)+v;
    MODULES.order.rows.unshift({ _id:++UID, no:'CZ'+String(Date.now()).slice(-10), name:MB.elder, goods:'储值充值 ¥'+v, amount:v, pay:'微信支付', payer:MB.child, point:0, date:now(), status:'已支付', staff:'', invoice:'已开具', remark:'子女端充值' });
    persist(); renderMobile(S.view); logAct('储值充值', '¥'+v, '中'); toast(`充值成功 ¥${v}，父亲余额现为 ¥${(+m.balance).toLocaleString()}`,'ok'); },

  /* ===== 特殊长者手环：到达自动打卡与联动 ===== */
  arrive(id){ S.bandLog=S.bandLog||[]; const L=MB.BLOCS().find(x=>x.id===id); if(!L) return;
    if(S.bandLog.some(x=>x.id===id)){ toast('该位置今日已自动打卡','warn'); return; }
    Mob._blog(L); persist(); renderMobile(S.view); logAct('手环自动打卡', L.name+' / '+S.view.toUpperCase(), '低');
    const act=MODULES.activity.rows.find(a=>a.title===L.act);
    toast(`📳 手环震动：已自动打卡「${L.name}」${act?'，并参加活动《'+L.act+'》':''}`,'ok'); },
  _blog(L){ S.bandLog=S.bandLog||[]; S.bandLog.push({id:L.id,name:L.name,ico:L.ico,act:L.act,t:now().slice(11,16)});
    const act=MODULES.activity.rows.find(a=>a.title===L.act); if(act) act.checkin=(+act.checkin||0)+1;
    const h=MB.BH();
    MODULES.health.rows.unshift({ _id:++UID, name:MB.special, date:today(), hr:h.hr, spo2:h.spo2, bp:h.bp, sleep:h.sleep||0, step:(+h.step||0)+(L.id===4?600:0), risk:'低', type:'护理记录', note:'手环自动打卡：到达「'+L.name+'」'+(act?'，自动签到活动《'+L.act+'》':'，完成定位与体征确认')+'，手环已震动确认', doctor:'何雨欣', auth:'已授权' }); },
  arriveAll(){ S.bandLog=S.bandLog||[]; MB.BLOCS().forEach(L=>{ if(!S.bandLog.some(x=>x.id===L.id)) Mob._blog(L); }); persist(); renderMobile(S.view); logAct('手环自动打卡（批量演示）', MB.special, '低'); toast('📳 已模拟长者依次到达全部特殊位置并自动打卡','ok'); },
  bandVibrate(){ toast('📳 手环已震动并语音播报（演示）','ok'); logAct('手环震动测试', MB.special, '低'); },
  bandCall(){ toast('📞 已语音呼叫家人（'+(MB.SA().gphone||'135****1180')+'）','warn'); pushAlert('特殊长者手环呼叫', `${MB.special} 通过智能手环发起亲情呼叫，已通知家属与值班管家`); logAct('手环亲情呼叫', MB.special, '中'); },
  /* ===== 温暖与传承：手机屏内弹层（与 Web 端共用 Warm 能力层） ===== */
  wKind(k){ S.dyKind=k; renderMobile(S.view); toast('已切换到「'+k+'」记录方式，填好点下方保存即可','ok'); },

  /* ---- 相册 ---- */
  wNewAlbum(owner){
    const def = owner || MB.elder;
    MB.sheet(`<h4>📔 新建相册 <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform">
        <div class="field"><label><i>*</i>相册名称</label><input class="inp" id="wName" placeholder="如：1970s 厂门口的那些年"></div>
        <div class="field"><label>归属长者</label><select class="sel" id="wOwner">${ELDER_NAMES.map(n=>`<option${n===def?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label>相册分类</label><select class="sel" id="wCate">${ALBUM_CATES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>可见范围</label><div class="seg" id="wPriv">${['私密','家人可见','园区公开'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>拍摄地 / 来源</label><input class="inp" id="wPlace" value="家里翻拍"></div>
        <div class="field"><label>相册简介</label><textarea class="inp" id="wNote" rows="2" placeholder="这本相册想留给谁、想说些什么"></textarea></div></div>
      <div class="mbtns"><button class="btn" onclick="MB.close()">取消</button><button class="btn p" onclick="Warm.createAlbum()">创建并添加第一张</button></div>`);
    Warm.seg('wPriv');
  },
  wAlbum(id){
    const a = Warm.album(id); if(!a) return; const ps = Warm.photos(a);
    const ro = S.mobileRole && S.mobileRole[S.view]==='child';
    MB.sheet(`<h4>📸 ${esc(a.name)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="ab-h"><div class="ab-cover">${esc(a.cover||'📷')}</div><div><b style="font-size:14px">${esc(a.name)}</b>
        <div class="tiny">${esc(a.owner)} · ${esc(a.cate)} · ${esc(a.place||'—')} · 创建 ${esc(a.date)}</div>
        <div class="ab-tags">${tagHTML({tag:{'私密':'ink','家人可见':'blue','园区公开':'green'}}, a.priv)}${tagHTML({tag:{'未分享':'ink','已生成链接':'green','已撤销':'warn'}}, a.share)}${tagHTML({tag:{'正常':'green','已销毁':'red'}}, a.status)}<span class="tag purple">${ps.length} 张</span></div></div></div>
      ${a.note?`<div class="ab-note">${esc(a.note)}</div>`:''}
      <div class="ab-grid">${ps.length? ps.map((p,i)=>`<div class="ab-ph"><div class="im">${p.img?`<img src="${p.img}">`:p.sketch?`<img src="${p.sketch}">`:esc(p.ico||'📷')}${p.fixed?'<i class="fx">AI 修复</i>':''}</div>
        <b>${esc(p.t)}</b><p>${esc(p.cap||'（未填写图注）')}</p><span>${esc(p.date||'')}${p.voice?' · 🎙 '+esc(p.voice):''}</span>
        ${ro?'':`<div class="ab-ops"><button class="btn sm" onclick="Warm.fixPhoto(${a._id},${i})">✨</button><button class="btn sm" onclick="Mob.wPhotoNote(${a._id},${i})">💬</button><button class="btn sm d" onclick="Warm.delPhoto(${a._id},${i})">🗑</button></div>`}</div>`).join('')
        : '<div class="tiny">还没有照片，点下方「＋ 添加照片」。</div>'}</div>
      <div class="mbtns" style="margin-top:12px">${ro
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm p blk" onclick="Warm.printSheet(${a._id})">🖨 订一本纸质相册</button><button class="btn sm" onclick="Mob.wAlbum(${a._id})">↻ 刷新</button><button class="btn sm" onclick="MB.close()">关闭</button></div>`
        : `<button class="btn p blk" onclick="Warm.addPhoto(${a._id})">＋ 添加照片</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm g" onclick="Warm.share(${a._id})">🔗 分享</button><button class="btn sm" onclick="Warm.printSheet(${a._id})">🖨 打印纸质</button><button class="btn sm d" onclick="Warm.destroy(${a._id})">🗑 销毁</button><button class="btn sm" onclick="Mob.wAlbum(${a._id})">↻ 刷新</button></div>`}</div>`);
  },
  wAddPhoto(id){
    const a = Warm.album(id); if(!a) return;
    MB.sheet(`<h4>🖼 添加到《${esc(a.name)}》 <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="seg" id="pSrc">${['拍照上传','扫描翻拍','手迹作品','园区活动'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div>
      <div class="mform" style="margin-top:10px">
        <div class="field"><label><i>*</i>照片标题</label><input class="inp" id="pTitle" placeholder="如：1985 年 · 技术能手奖状"></div>
        <div class="field"><label>拍摄 / 年份日期</label><input class="inp" id="pDate" value="${today()}"></div>
        <div class="field"><label>画面内容（原型用图标代图）</label><div class="seg" id="pIco">${['📷','🏭','🌳','💑','🖊','🎤','🧣','🥟','🌅','🖼','🏆','👵'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>想说的话（图注）</label><textarea class="inp" id="pCap" rows="2" placeholder="这张照片背后的故事"></textarea></div>
        <div class="field"><label>语音配图（可选）</label><div class="rec-row"><button class="btn sm" onclick="Warm.recPhoto(this)">● 按住说话</button><span class="mono" id="pRecT">00'00\u0022</span><span class="tiny" id="pRecS">未录制</span></div></div></div>
      <div class="mbtns"><button class="btn" onclick="Mob.wAlbum(${a._id})">返回相册</button><button class="btn p" onclick="Warm.savePhoto(${a._id})">💾 保存这张</button></div>`);
    Warm.seg('pSrc'); Warm.seg('pIco');
  },
  wPhotoNote(id, i){
    const a = Warm.album(id); const p = a && a.photos[i]; if(!p) return;
    MB.sheet(`<h4>💬 补充图注 · ${esc(p.t)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="field"><label>这张照片的故事</label><textarea class="inp" id="pnCap" rows="4">${esc(p.cap||'')}</textarea></div>
      <div class="field"><label>画面内容</label><div class="seg" id="pnIco">${['📷','🏭','🌳','💑','🖊','🎤','🧣','🥟','🌅','🖼','🏆','👵'].map(x=>`<button class="${x===(p.ico||'📷')?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="tiny">图注会以第一人称进入 AI 传记草稿。</div>
      <div class="mbtns" style="margin-top:12px"><button class="btn" onclick="Mob.wAlbum(${a._id})">返回</button><button class="btn p" onclick="Warm.saveNote(${a._id},${i})">保存</button></div>`);
    Warm.seg('pnIco');
  },
  wShare(id){
    const a = Warm.album(id); if(!a) return;
    const code = 'ALB'+String(a._id).padStart(4,'0')+String(Date.now()).slice(-4);
    const link = 'https://ky-park.cn/a/'+code;
    MB.sheet(`<h4>🔗 分享《${esc(a.name)}》 <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform"><div class="field"><label>分享范围</label><div class="seg" id="shScope">${['仅家人','园区公开','凭链接任何人'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>有效期</label><div class="seg" id="shExp">${['7 天','30 天','长期有效'].map((x,i)=>`<button class="${i===1?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>接收对象</label><input class="inp" id="shTo" value="${esc(a.owner==='徐世昌'?'徐乐（女儿）/ 家庭群':'家人')}"></div>
        <div class="field"><label>分享链接</label><div class="share-box"><span class="mono">${link}</span><button class="btn sm" onclick="navigator.clipboard&&navigator.clipboard.writeText('${link}');toast('链接已复制，可转发到家庭群','ok')">复制</button></div>
          <div class="tiny">分享码：<b class="mono">${code}</b>　·　可随时撤销，撤销后链接立即失效。</div></div></div>
      <div class="mbtns"><button class="btn" onclick="Mob.wAlbum(${a._id})">取消</button><button class="btn p" onclick="Warm.doShare(${a._id})">生成分享</button></div>`);
    Warm.seg('shScope'); Warm.seg('shExp');
  },
  wPrint(id){
    const a = Warm.album(id); if(!a) return;
    MB.sheet(`<h4>🖨 打印成纸质相册 · ${esc(a.name)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform"><div class="field"><label>纸张规格</label><div class="seg" id="prPaper">${['A4 哑光','12 寸相簿','拍立得 3寸'].map((x,i)=>`<button class="${i===1?'on':''}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>装订方式</label><div class="seg" id="prBind">${['精装硬壳','蝴蝶对裱','环装可拆'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>打印份数</label><input class="inp" id="prCopies" type="number" min="1" max="9" value="1"></div>
        <div class="field"><label>随册附印</label><div class="ck-row">${['图注全文','长者可手写页','AI 传记摘录','二维码回到电子相册'].map((x,i)=>`<label class="ck2"><input type="checkbox" ${i<2?'checked':''}> ${x}</label>`).join('')}</div></div>
        <div class="tiny">已打印 ${a.printCnt||0} 次；接单后 1 个工作日送出，可到园区服务台领取。</div></div>
      <div class="mbtns"><button class="btn" onclick="Mob.wAlbum(${a._id})">取消</button><button class="btn p" onclick="Warm.doPrint(${a._id})">生成版式并打印</button></div>`);
    Warm.seg('prPaper'); Warm.seg('prBind');
  },
  wPrintList(){
    const list = Warm.albums(MB.elder,'',false);
    if(!list.length){ toast('还没有相册，先去「温暖」新建一本','warn'); return; }
    MB.sheet(`<h4>🖨 选一本相册（打印 / 分享） <span class="link" onclick="MB.close()">关闭</span></h4>
      <ul class="mlist">${list.map(a=>`<li onclick="Mob.wPrint(${a._id})"><div class="ic">${esc(a.cover||'📷')}</div>
        <div class="tx"><b>${esc(a.name)}</b><p>${Warm.photos(a).length} 张 · ${esc(a.cate)} · 已打印 ${a.printCnt||0} 次 · ${esc(a.priv)}</p></div>
        <div class="rt"><span class="link" onclick="event.stopPropagation();Warm.share(${a._id})">分享</span></div></li>`).join('')}</ul>
      <div class="mbtns" style="margin-top:12px"><button class="btn blk" onclick="MB.close()">关闭</button></div>`);
  },
  wTrash(){
    const dead = Warm.albums(MB.elder,'',true).filter(a=>a.status==='已销毁');
    MB.sheet(`<h4>🗑 相册回收站 <span class="link" onclick="MB.close()">关闭</span></h4>
      ${dead.length? `<ul class="mlist">${dead.map(a=>`<li><div class="ic w">🗑</div><div class="tx"><b>${esc(a.name)}</b><p>销毁于 ${esc(a.destroyAt||a.date)} · 30 天内可恢复</p></div>
        <div class="rt"><span class="link" onclick="Warm.restore(${a._id})">恢复</span></div></li>`).join('')}</ul>`
        : '<div class="tiny">回收站是空的。相册可随时销毁，销毁后分享链接立即失效，30 天内可恢复。</div>'}
      <div class="mbtns" style="margin-top:12px"><button class="btn blk" onclick="renderMobile(S.view)">关闭并刷新</button></div>`);
  },

  /* ---- 日记 ---- */
  wDiary(id){
    const d = Warm.diary(id); if(!d) return;
    MB.sheet(`<h4>📔 ${esc(d.title)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="dy-view"><div class="dy-meta">${esc(d.name)} · ${esc(d.kind)} · ${esc(d.date)} ${esc(d.time||'')} · ${esc(d.from||'')}${d.dur?' · 时长 '+esc(d.dur):''}</div>
        <div class="dy-tags">${tagHTML({tag:{'笔记':'blue','录音':'purple','画画':'green','拍照':'warn'}}, d.kind)}${tagHTML({tag:{'家人可见':'green','私密':'ink','园区公开':'blue'}}, d.auth)}${tagHTML({tag:{'已引用':'green','未引用':'ink'}}, d.bio)}<span class="tag purple">心情 ${esc(d.mood)}</span></div>
        ${d.kind==='录音'? `<div class="play"><button class="btn sm p" onclick="Warm.play(this)">▶ 播放</button><div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="mono">${esc(d.dur||'')}</span></div>`:''}
        ${d.sketch? `<div class="dy-img"><img src="${d.sketch}"></div>` : (d.img? `<div class="dy-img big">${esc(d.img)}</div>`:'')}
        <div class="dy-text">${esc(d.content||'（未填写内容）')}</div></div>
      <div class="mbtns" style="margin-top:12px">
        <button class="btn sm ${d.bio==='已引用'?'':'g'}" onclick="Warm.toggleBio(${d._id})">${d.bio==='已引用'?'➖ 取消引用':'＋ 用作传记素材'}</button>
        <button class="btn sm" onclick="Warm.toAlbum(${d._id})">📸 归入相册</button>
        <button class="btn sm d" onclick="Warm.delDiary(${d._id})">🗑 删除</button>
        <button class="btn sm" onclick="Mob.wDiary(${d._id})">↻ 刷新</button></div>`);
  },
  wToAlbum(id){
    const d = Warm.diary(id); if(!d) return;
    const list = Warm.albums(d.name,'',false);
    MB.sheet(`<h4>📸 归入相册 · ${esc(d.title)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform"><div class="field"><label>选择相册（归属：${esc(d.name)}）</label>
        <select class="sel" id="taAlb">${list.length? list.map(a=>`<option value="${a._id}">${esc(a.name)}（${Warm.photos(a).length} 张）</option>`).join('') : '<option value="">暂无相册，将新建一本「日记手记」</option>'}</select></div>
        <div class="tiny">笔记与录音会生成一张带正文摘录的卡片图；画画与拍照直接使用原图。</div></div>
      <div class="mbtns"><button class="btn" onclick="Mob.wDiary(${d._id})">返回</button><button class="btn p" onclick="Warm.doToAlbum(${d._id})">确定归入</button></div>`);
  },

  /* ---- 传记（传承） ---- */
  wGen(owner){
    const who = owner || MB.elder;
    const albs = Warm.albums(who,'',false), dis = Warm.diaries(who,'');
    if(!albs.length && !dis.length){ toast(who+' 还没有相册或日记，请先创建温暖素材','warn'); return; }
    const ar = archiveOf(who);
    const fam = ar && ar.family ? String(ar.family).split(/[、,，]/)[0] : '';
    MB.sheet(`<h4>🤖 联动日记与相册 · 辅生成传记 <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform"><div class="field"><label>传主</label><select class="sel" id="gName" onchange="Warm.genRefresh()">${ELDER_NAMES.map(n=>`<option${n===who?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label>传记名</label><input class="inp" id="gTitle" value="${esc(who+'的人生小记')}"></div>
        <div class="field"><label>体裁</label><div class="seg" id="gStyle">${BIO_STYLES.map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>交付对象</label><input class="inp" id="gFam" value="${esc(fam||'子女')}"></div></div>
      <div id="gMats"><div class="tiny">正在加载素材…</div></div>
      <div class="lgc-tip">⚠ AI 只负责把您写的与拍的串成草稿，<b>全部内容由您自由改写</b>；定稿前不对外展示。</div>
      <div class="mbtns" style="margin-top:12px"><button class="btn" onclick="MB.close()">取消</button><button class="btn p" onclick="Warm.startGen()">🤖 生成草稿</button></div>`);
    Warm.seg('gStyle'); Warm.genRefresh();
  },
  wBio(id){
    const b = Warm.bio(id); if(!b) return; const chs = b.chapters||[];
    const ro = S.mobileRole && S.mobileRole[S.view]==='child';
    MB.sheet(`<h4>🕯 ${esc(b.title)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="ab-tags">${tagHTML({tag:{'草稿':'ink','生成中':'blue','已成稿':'green','已交付':'purple'}}, b.status)}<span class="tag blue">${chs.length} 章</span><span class="tag purple">${esc(b.style)}</span><span class="tag">${esc(b.vol||'')}</span></div>
      <div class="prog" style="margin:10px 0"><i style="width:${b.progress||0}%"></i></div>
      <div class="tiny">${ro?'父亲授权您阅读的部分，仅家属可见；如需补充可提醒父亲。':(b.status==='生成中'?'AI 正在逐章生成，完成后可直接编写':'每一章都可以自己重写，也可以加一章想说的话。')}</div>
      ${chs.length? chs.map((c,i)=>`<div class="lgc-ch"><div class="lgc-ch-h"><b>${esc(c.t)}</b><span class="tiny">${(c.c||'').length} 字 · ${c.edited?'本人已改':'AI 初稿'}</span></div>
        <textarea class="inp" id="ch${i}" rows="3" ${ro?'readonly':''}>${esc(c.c||'')}</textarea>
        ${ro?'':`<div class="lgc-ch-ops"><button class="btn sm" onclick="Warm.saveOne(${b._id},${i})">💾 本章</button><button class="btn sm" onclick="Warm.polish(${b._id},${i})">🤖 换说法</button><button class="btn sm" onclick="Warm.fromMate(${b._id},${i})">📔 引原文</button></div>`}</div>`).join('')
        : '<div class="tiny">草稿生成中…</div>'}
      <div class="mbtns" style="margin-top:12px">${ro
        ? `<button class="btn p blk" onclick="Mob.legacyBack(${b._id})">💬 回应一句</button>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="Warm.printBio(${b._id})">🖨 打印装订</button><button class="btn sm" onclick="Mob.wBio(${b._id})">↻ 刷新</button><button class="btn sm" onclick="MB.close()">关闭</button></div>`
        : (b.status==='生成中'
          ? `<button class="btn blk" onclick="Mob.wBio(${b._id})">后台生成，重新打开</button>`
          : `<button class="btn p blk" onclick="Warm.saveChapters(${b._id})">💾 全部保存</button>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="Warm.addChapter(${b._id})">＋ 加一章</button><button class="btn sm g" onclick="Warm.finalize(${b._id})">✅ 定稿</button><button class="btn sm" onclick="Warm.printBio(${b._id})">🖨 成书</button><button class="btn sm p" onclick="Warm.deliver(${b._id})">📮 交付</button></div>`)} </div>`);
  },
  wDeliver(id){
    const b = Warm.bio(id); if(!b) return;
    MB.sheet(`<h4>📮 交付家人 <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="mform"><div class="field"><label>交付对象</label><input class="inp" id="dlTo" value="${esc(b.family||'徐乐')}"></div>
        <div class="field"><label>送达方式</label><div class="seg" id="dlWay">${['APP 推送','短信链接','纸质快递','园区服务台领取'].map((x,i)=>`<button class="${i?'':'on'}" data-v="${x}">${x}</button>`).join('')}</div></div>
        <div class="field"><label>附一句话</label><textarea class="inp" id="dlMsg" rows="2" placeholder="想对家人说的话">这本册子交给你们，翻到它就像我还在说话。</textarea></div>
        <div class="tiny">交付后子女端「传承」会同步出现《${esc(b.title)}》，仅授权家属可见，可随时撤销。</div></div>
      <div class="mbtns"><button class="btn" onclick="Mob.wBio(${b._id})">返回</button><button class="btn p" onclick="Warm.doDeliver(${b._id})">确认交付</button></div>`);
    Warm.seg('dlWay');
  },
  legacyBack(id){
    const b = Warm.bio(id);
    MB.sheet(`<h4>💬 回一句给${esc(MB.elder)} <span class="link" onclick="MB.close()">关闭</span></h4>
      <div class="field"><label>回应${b?'《'+esc(b.title)+'》':''}</label><textarea class="inp" id="lbTxt" rows="3">爸，这本册子我读了三遍，明年我们把老屋那几张也补上去。</textarea></div>
      <button class="btn p blk" onclick="Mob.legacySend(${id||0})">发送回应（同步长者端与房间大屏）</button>`);
  },
  legacySend(id){
    const t = ($('lbTxt')&&$('lbTxt').value)||'回应'; const b = Warm.bio(id);
    MODULES.circle.rows.unshift({ _id:++UID, author:MB.child, kind:'子女留言', text:t+(b?'　—— 读《'+b.title+'》':''), imgs:'', likes:0, cmts:0, share:'已同步', date:now(), status:'已发布' });
    if(b){ b.replyMsg=t; b.replyTime=now(); }
    MB.close(); persist(); renderMobile(S.view); logAct('子女回应传记', (b?b.title:'')+'：'+String(t).slice(0,18), '低');
    toast('已回应，长者端「温暖」与房间大屏会收到','ok');
  },
  remindWrite(){
    MB.close();
    pushAlert('子女关怀提醒', `子女 ${MB.child} 提醒 ${MB.elder} 记一条时光日记 / 整理一张老照片，已推送到长者端与房间大屏`);
    logAct('提醒长者记录', MB.elder+' / '+S.view.toUpperCase(), '低'); toast('已提醒父亲记录','ok');
  },
  printElderAlbum(){ Mob.wPrintList(); },

broadcast(){ const a=MB.SA(), d=new Date(), p=n=>String(n).padStart(2,'0');
    const wk=['日','一','二','三','四','五','六'][d.getDay()]; const h=d.getHours();
    const seg=h<6?'凌晨':h<11?'上午':h<13?'中午':h<18?'下午':'晚上';
    const t=`${d.getMonth()+1} 月 ${d.getDate()} 日 周${wk} ${seg} ${p(d.getHours())} 点 ${p(d.getMinutes())} 分`;
    const last=(S.bandLog||[]).slice(-1)[0];
    const loc=last?`${esc(last.name)}（${esc(a.zone)}）`:`${esc(a.zone)} ${esc(a.room)} 附近`;
    const wx=MB.wx();
    const msg=`现在是${t}。您当前位置：${loc}。今天天气：${wx.text}，气温${wx.temp}，${wx.tip}。`;
    if(navigator.vibrate){ try{ navigator.vibrate([120,60,120]); }catch(e){} }
    try{ if(window.speechSynthesis){ const u=new SpeechSynthesisUtterance(msg); u.lang='zh-CN'; u.rate=.92; speechSynthesis.cancel(); speechSynthesis.speak(u); } }catch(e){}
    MB.sheet(`<h4>🔊 手环语音播报</h4>
      <div style="font-size:16px;line-height:2.1;color:var(--ink)">
        <div>🕒 ${esc(t)}</div>
        <div>📍 当前位置：${loc}</div>
        <div>${wx.ico} 今日天气：${esc(wx.text)} ${esc(wx.temp)} · ${esc(wx.tip)}</div>
      </div>
      <p class="tiny" style="margin-top:10px">已震动 + 语音播报（不识长者友好，无需操作）</p>
      <div class="mbtns"><button class="btn g blk" onclick="Mob.broadcast()">🔊 再播一次</button><button class="btn" onclick="speechSynthesis&&speechSynthesis.cancel();MB.close()">关闭</button></div>`, 'text-align:left');
    toast('🔊 已播报时间、位置与天气','ok'); logAct('手环语音播报', MB.special, '低'); }
};

function renderMobile(kind){ MB.render(kind); }

/* ---------- 3D 导航路线（孪生视图调用） ---------- */
function navRoute(){
  const to = ($('navTo')&&$('navTo').value) || '康复理疗室 2（康养区 B 栋）';
  const steps = [['🛏',`出发：${MB.A().zone} ${MB.A().room}`, '室内定位 · 精度 1.5m'],
    ['🚶','沿 A 栋连廊向 B 栋步行 68 m', '地面防滑 · 无台阶'],
    ['🛗','乘 B 栋 2 号无障碍电梯至 2F', '已预约电梯 · 门禁自动开启'],
    ['🚪','右转 20 m 到达目的地', to],
    ['⏱','预计 4 分 30 秒', '沿途有 3 处休息座椅 · 摄像头覆盖']];
  const host = $('navPath');
  if(host) host.innerHTML = steps.map(s=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe">
    <span style="font-size:16px">${s[0]}</span><div style="flex:1"><b style="font-size:13px">${esc(s[1])}</b><div class="tiny">${esc(s[2])}</div></div></div>`).join('');
  if(S.view==='admin') logAct('下发 3D 导航路线', to, '低');
}

/* ---------- 启动 ---------- */
function bootApp(){
  App.boot();
  if(!location.hash) location.hash = '#/login';
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootApp); else bootApp();
