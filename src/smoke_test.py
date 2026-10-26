import json, pathlib, sys, time
from playwright.sync_api import sync_playwright

URL = 'file:///data/work/build/index.html'
OUT = pathlib.Path('/data/work/shots'); OUT.mkdir(parents=True, exist_ok=True)
errs, logs = [], []

def shot(page, name, full=False):
    page.wait_for_timeout(350)
    page.screenshot(path=str(OUT/name), full_page=full)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/chromium',
                          args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width':1920,'height':1080}, device_scale_factor=1)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
    pg.goto(URL); pg.wait_for_timeout(800)
    pg.evaluate("try{localStorage.clear()}catch(e){}")
    pg.reload(); pg.wait_for_timeout(1200)

    # 1 登录页
    shot(pg, '01-login.png')

    # 2 演示账号弹框
    pg.click('#showAcc'); pg.wait_for_timeout(500); shot(pg, '02-login-accounts.png')
    pg.click('#mFoot .btn.p'); pg.wait_for_timeout(300)
    pg.select_option('#lgEnd','home')
    pg.click('#lgBtn'); pg.wait_for_timeout(900)
    print('view after login =', pg.evaluate("S.view"), '| user =', pg.evaluate("(S.user&&S.user.u)"))

    # 3 门户
    shot(pg, '03-home.png')

    # 4 后台各模块遍历
    keys = pg.evaluate("visibleModules()")
    print('visible modules =', len(keys))
    bad = []
    for k in keys:
        pg.evaluate(f"App.go('admin','{k}')"); pg.wait_for_timeout(260)
        txt = pg.evaluate("document.getElementById('page').innerText.length")
        if txt < 30: bad.append(k)
    print('thin pages =', bad)
    for k, name in [('dashboard','04-admin-dashboard'),('twin','05-admin-twin'),('archive','06-admin-archive'),
                    ('order','07-admin-order'),('iot','08-admin-iot'),('reports','09-admin-reports')]:
        pg.evaluate(f"App.go('admin','{k}')"); pg.wait_for_timeout(900 if k in ('dashboard','twin','reports','iot') else 400)
        shot(pg, name+'.png')

    # 5 新增（CRUD create）
    before = pg.evaluate("MODULES.archive.rows.length")
    pg.evaluate("App.go('admin','archive');Crud.open('archive')"); pg.wait_for_timeout(500)
    shot(pg, '10-admin-crud-add.png')
    pg.evaluate("""(()=>{const f=document.getElementById('cform');
      f.querySelector('#f_name').value='测试·王奶奶';
      const sx=f.querySelector('#f_sex'); if(sx) sx.value='女';
      const a=f.querySelector('#f_age'); if(a) a.value=82;
      const r=f.querySelector('#f_room'); if(r) r.value='C-101';
      f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));})()""")
    pg.wait_for_timeout(500)
    after = pg.evaluate("MODULES.archive.rows.length")
    print('CRUD create:', before, '->', after)

    # 6 编辑 + 详情 + 流程
    pg.evaluate("Crud.detail('archive', MODULES.archive.rows[0]._id)"); pg.wait_for_timeout(400); shot(pg,'11-admin-detail.png')
    pg.evaluate("Modal.close()")
    n0 = pg.evaluate("MODULES.archive.rows.length")
    pg.evaluate("Crud.del('archive', MODULES.archive.rows[0]._id)"); pg.wait_for_timeout(400); shot(pg,'11b-admin-delete.png')
    pg.evaluate("document.querySelector('#mFoot .btn.p').click()"); pg.wait_for_timeout(400)
    print('CRUD delete:', n0, '->', pg.evaluate("MODULES.archive.rows.length"))
    pg.evaluate("App.go('admin','leave')"); pg.wait_for_timeout(400)
    st0 = pg.evaluate("(()=>{const r=MODULES.leave.rows.find(x=>x.status==='待审批');return r?r.status:'none'})()")
    pg.evaluate("""(()=>{const r=MODULES.leave.rows.find(x=>x.status==='待审批'); if(r) Crud.flow('leave', r._id, 0);})()""")
    pg.wait_for_timeout(400); shot(pg,'12-admin-flow.png')
    pg.evaluate("""(()=>{const n=document.getElementById('flowNote'); if(n){n.value='同意，注意保暖'; document.querySelector('#mFoot .btn.g').click();}})()""")
    pg.wait_for_timeout(400)
    st1 = pg.evaluate("(()=>{const r=MODULES.leave.rows.find(x=>x.name==='徐世昌');return r?r.status:'none'})()")
    print('flow:', st0, '->', st1)

    # 7 筛选/搜索
    pg.evaluate("S.kw.archive='徐'; S.mod='archive'; App.go('admin','archive')"); pg.wait_for_timeout(400); shot(pg,'13-admin-search.png')

    # 8 大数据屏
    pg.evaluate("App.go('screen')"); pg.wait_for_timeout(2600); shot(pg,'14-screen.png')
    print('echarts loaded =', pg.evaluate("!!window.echarts"), '| charts =', pg.evaluate("Object.keys(CHARTS).length"))

    # 9 APP 端（长者 / 子女）
    pg.evaluate("App.go('app')"); pg.wait_for_timeout(600); shot(pg,'15-app-elder-home.png')
    pg.evaluate("Mob.like(MODULES.circle.rows[0]._id)"); pg.wait_for_timeout(400)
    pg.evaluate("Mob.sport()"); pg.wait_for_timeout(400)
    pg.evaluate("Mob.signup(MODULES.activity.rows[0]._id)"); pg.wait_for_timeout(500); shot(pg,'16-app-action.png')
    pg.evaluate("S.appTab=1; renderMobile('app')"); pg.wait_for_timeout(1200); shot(pg,'17-app-health.png')
    pg.evaluate("S.appTab=3; renderMobile('app')"); pg.wait_for_timeout(400); shot(pg,'18-app-circle.png')
    pg.evaluate("Mob.aiOpen()"); pg.wait_for_timeout(400)
    pg.evaluate("Mob.aiAsk('我有点想家')"); pg.wait_for_timeout(500); shot(pg,'19-app-ai.png')
    pg.evaluate("Mob.aiClose()"); pg.wait_for_timeout(400)
    pg.evaluate("Mob.sos()"); pg.wait_for_timeout(900); shot(pg,'20-app-sos.png')
    pg.evaluate("MB.close(); Mob.sosGo()"); pg.wait_for_timeout(500)
    pg.evaluate("S.appTab=4; renderMobile('app')"); pg.wait_for_timeout(400); shot(pg,'21-app-mine.png')
    pg.evaluate("Mob.role('app','child')"); pg.wait_for_timeout(700); shot(pg,'22-app-child.png')
    pg.evaluate("S.appTab=3; renderMobile('app')"); pg.wait_for_timeout(500); shot(pg,'23-app-child-pay.png')
    pg.evaluate("Mob.topay(1000)"); pg.wait_for_timeout(400)
    pg.evaluate("S.appTab=2; renderMobile('app')"); pg.wait_for_timeout(500); shot(pg,'24-app-child-book.png')

    # 10 小程序端
    pg.evaluate("App.go('mp')"); pg.wait_for_timeout(700); shot(pg,'25-mp-elder.png')
    pg.evaluate("S.mpTab=1; renderMobile('mp')"); pg.wait_for_timeout(500); shot(pg,'26-mp-service.png')
    pg.evaluate("Mob.mealAdd('清蒸鲈鱼',18); Mob.mealAdd('杂粮饭',3); Mob.mealSubmit()"); pg.wait_for_timeout(600); shot(pg,'27-mp-meal.png')
    pg.evaluate("S.mpTab=2; renderMobile('mp')"); pg.wait_for_timeout(400); shot(pg,'28-mp-circle.png')
    pg.evaluate("Mob.post()"); pg.wait_for_timeout(300)
    pg.evaluate("Mob.postSend()"); pg.wait_for_timeout(400)
    pg.evaluate("Mob.role('mp','child')"); pg.wait_for_timeout(600); shot(pg,'29-mp-child.png')
    pg.evaluate("S.mpTab=1; renderMobile('mp')"); pg.wait_for_timeout(400); shot(pg,'30-mp-child-care.png')

    # 11 数据一致性：订单/请假/动态/告警
    print('orders =', pg.evaluate("MODULES.order.rows.length"),
          '| leave =', pg.evaluate("MODULES.leave.rows.length"),
          '| circle =', pg.evaluate("MODULES.circle.rows.length"),
          '| alarms =', pg.evaluate("MODULES.devalarm.rows.length"),
          '| ai =', pg.evaluate("MODULES.ai.rows.length"),
          '| sport =', pg.evaluate("MODULES.sport.rows.length"))

    # 12 门户以另一角色（长者 elder）登录，验证 RBAC
    pg.evaluate("App.logout()"); pg.wait_for_timeout(600)
    pg.fill('#lgUser','elder'); pg.fill('#lgPwdIn','123456'); pg.select_option('#lgEnd','admin')
    pg.click('#lgBtn'); pg.wait_for_timeout(900)
    print('elder view =', pg.evaluate("S.view"), '| elder nav modules =', pg.evaluate("visibleModules().length"))
    shot(pg,'31-home-elder-role.png')
    pg.evaluate("App.go('admin')"); pg.wait_for_timeout(600); shot(pg,'32-admin-elder-role.png')

    # 手机视口
    pg2 = b.new_page(viewport={'width':420,'height':900}, device_scale_factor=2)
    pg2.on('pageerror', lambda e: errs.append('PAGEERROR2: '+str(e)))
    pg2.goto(URL); pg2.wait_for_timeout(900); shot(pg2,'40-mobile-login.png')
    pg2.fill('#lgUser','child'); pg2.fill('#lgPwdIn','123456'); pg2.select_option('#lgEnd','app')
    pg2.click('#lgBtn'); pg2.wait_for_timeout(1200); shot(pg2,'41-mobile-app.png')
    pg2.close()

    b.close()

print('\n=== PAGE ERRORS (%d) ===' % len(errs))
for e in errs[:25]: print(e)
print('\n=== CONSOLE (%d) ===' % len(logs))
for l in logs[:25]: print(l[:220])
