// app.js - 主应用逻辑
(function () {
  'use strict';

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const view = document.getElementById('view');
  const pageTitle = document.getElementById('pageTitle');
  const TITLES = { advice: '今日建议', timeline: '健康时间线', record: '记录', food: '饮食查询', me: '我的' };
  let currentTab = 'advice';
  let dietPicks = [];
  let reportPendingBlob = null;

  // ---------- helpers ----------
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function today() { return Store.todayStr(); }
  function now() { return Store.nowTime(); }
  function defaultMeal() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return '早餐';
    if (h >= 11 && h < 17) return '午餐';
    return '晚餐';
  }
  function val(id) {
    const el = $('#modalRoot #' + id) || document.getElementById(id);
    return el ? el.value : '';
  }
  function checked(name) {
    const el = document.querySelector('#modalRoot input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function field(label, control) { return '<div class="field"><label>' + label + '</label>' + control + '</div>'; }
  function chips(name, arr, sel) {
    return arr.map(function (v) {
      return '<label class="chip' + (v === sel ? ' sel' : '') + '" onclick="App.pickChip(this)"><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (v === sel ? ' checked' : '') + '>' + esc(v) + '</label>';
    }).join('');
  }
  function pickChip(lab) {
    const inp = lab.querySelector('input[type=radio]');
    if (!inp) return;
    const name = inp.getAttribute('name');
    document.querySelectorAll('#modalRoot input[name="' + name + '"]').forEach(function (r) {
      const l = r.closest('.chip');
      if (r === inp) { r.checked = true; if (l) l.classList.add('sel'); }
      else { r.checked = false; if (l) l.classList.remove('sel'); }
    });
  }

  const EVT = {
    symptom: { ico: '🩺', label: '症状' },
    diet: { ico: '🍽️', label: '饮食' },
    water: { ico: '💧', label: '饮水' },
    med: { ico: '💊', label: '用药' },
    checkup: { ico: '📄', label: '检查' },
    note: { ico: '📝', label: '备注' }
  };
  const URINE = ['正常', '淡黄', '深黄', '发红', '浑浊'];
  const PAIN = ['无', '轻度', '中度', '重度'];
  const FEVER = ['否', '是'];

  function stoneLabel(t) {
    return ({ unknown: '未知', calcium: '草酸钙结石', uric: '尿酸结石', other: '其他' })[t] || '未知';
  }

  // ---------- modal ----------
  function openModal(html, opts) {
    opts = opts || {};
    const root = document.getElementById('modalRoot');
    root.innerHTML = '<div class="modal-mask' + (opts.center ? ' center' : '') + '"><div class="modal">' + html + '</div></div>';
    root.querySelector('.modal-mask').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeModal();
    });
  }
  function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }

  // ---------- router ----------
  function go(tab) {
    currentTab = tab;
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    pageTitle.textContent = TITLES[tab] || '肾石康复助手';
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    if (currentTab === 'advice') return renderAdvice();
    if (currentTab === 'timeline') return renderTimeline();
    if (currentTab === 'record') return renderRecordHome();
    if (currentTab === 'food') return renderFood();
    if (currentTab === 'me') return renderMe();
  }

  // ---------- 建议 ----------
  function renderAdvice() {
    const p = Store.getProfile();
    const tl = Store.getTimeline();
    const rp = Store.getReports();
    const adv = Advice.buildAdvice(p, tl, rp);

    // —— 仪表盘数据 ——
    const ds = (p && p.surgeryDate) ? Advice.daysSince(p.surgeryDate) : null;
    const goal = (p && p.waterGoal) || 2000;
    const tStr = Store.todayStr();
    let waterTotal = 0;
    tl.forEach(function (e) {
      if (e.type === 'water' && e.date === tStr) waterTotal += Number((e.detail && e.detail.amount) || 0);
    });
    const waterPct = Math.min(100, Math.round(waterTotal / goal * 100));
    const name = (p && p.name) ? p.name : '';
    const nowD = new Date();
    const dateStr = (nowD.getMonth() + 1) + '月' + nowD.getDate() + '日';

    // 问候语与阶段文案
    let greet = name ? ('你好，' + name) : '你好';
    let sub;
    if (!p) sub = '完善个人档案，获得专属康复建议';
    else if (ds === null) sub = '记得到「我的」填写手术日期';
    else if (ds < 0) sub = '手术日期待确认，请核对档案';
    else if (ds <= 7) sub = '术后急性恢复期 · 多休息、多喝水';
    else if (ds <= 30) sub = '恢复早期 · 逐步活动，避免剧烈';
    else if (ds <= 90) sub = '恢复中期 · 重点预防复发';
    else sub = '长期管理期 · 坚持饮水与复查';

    // 术后天数显示
    let dayNum, dayUnit = '', dayLbl = '术后天数';
    if (ds !== null && ds >= 0) { dayNum = ds; dayUnit = '天'; dayLbl = '术后第几天'; }
    else { dayNum = '—'; }

    let html = '';
    html += '<div class="hero">';
    html += '<div class="hero-top"><div><div class="hero-greet">' + esc(greet) + ' 👋</div><div class="hero-sub">' + esc(sub) + '</div></div><div class="hero-date">' + esc(dateStr) + '</div></div>';
    html += '<div class="hero-stats">';
    html += '<div class="hstat"><div class="hstat-num">' + dayNum + (dayUnit ? '<span class="hstat-unit">' + dayUnit + '</span>' : '') + '</div><div class="hstat-lbl">' + dayLbl + '</div></div>';
    html += '<div class="hstat"><div class="hstat-num">' + waterTotal + '<span class="hstat-unit">ml</span></div><div class="hstat-lbl">今日饮水</div></div>';
    html += '</div>';
    html += '<div class="water-bar"><div class="water-fill" style="width:' + waterPct + '%"></div></div>';
    html += '<div class="water-txt">饮水目标 ' + goal + 'ml · 还差 ' + Math.max(0, goal - waterTotal) + 'ml（少量多次更护肾）</div>';
    html += '<div class="hero-actions">';
    html += '<button class="btn-light" onclick="App.quickSymptom()">记症状</button>';
    html += '<button class="btn-light" onclick="App.quickWater()">记饮水</button>';
    html += '<button class="btn-light" onclick="App.quickDiet()">记饮食</button>';
    html += '<button class="btn-light" onclick="App.go(\'food\')">查饮食</button>';
    html += '</div></div>';

    html += renderDietScore();
    adv.forEach(function (a) {
      html += '<div class="advice ' + a.level + '"><div class="a-title">' + esc(a.title) + '</div><div class="a-text">' + esc(a.text) + '</div></div>';
    });
    html += '<div class="ai-entry"><button class="btn ai-btn" onclick="App.openAIChat()">🤖 有复杂问题？问问 AI 助手</button>' +
      '<div class="muted" style="text-align:center;margin-top:6px">基于你的档案与近期记录作答（默认未启用，需在「我的」中开启）</div></div>';
    view.innerHTML = html;
  }

  // 今日饮食评分卡片（环形仪表）
  function renderDietScore() {
    const p = Store.getProfile();
    const tl = Store.getTimeline();
    const s = Advice.scoreTodayDiet(p, tl);
    let html = '<div class="diet-score">';
    html += '<div class="row-between"><h2>🍱 今日饮食评分</h2><span class="muted">' + esc(s.date) + '</span></div>';
    if (s.empty) {
      html += '<div class="muted" style="margin-top:8px">' + esc(s.text) + '</div>';
    } else {
      const ringColor = s.level === 'good' ? 'var(--ring-good)' : (s.level === 'info' ? 'var(--ring-info)' : 'var(--ring-warn)');
      html += '<div class="score-gauge">';
      html += '<div class="score-ring" style="--p:' + s.score + '; --ring:' + ringColor + '"><div class="ring-hole"><div class="ring-num">' + s.score + '<span class="ring-unit">分</span></div><div class="ring-lvl" style="color:' + ringColor + '">' + s.levelText + '</div></div></div>';
      html += '<div class="score-meta"><div class="score-level ' + s.level + '">' + s.levelText + ' · ' + s.total + ' 种食物</div>';
      html += '<div class="score-tags"><span class="badge ok">可吃 ' + s.ok + '</span><span class="badge limit">适量 ' + s.limit + '</span><span class="badge avoid">忌口 ' + s.avoid + '</span></div></div>';
      html += '</div>';
      html += '<div class="score-analysis">' + esc(s.analysis) + '</div>';
      if (s.avoidList && s.avoidList.length) {
        html += '<div class="score-avoid">⚠️ 忌口食物：' + s.avoidList.map(function (i) { return esc(i.name); }).join('、') + '</div>';
      }
      if (s.limitList && s.limitList.length) {
        html += '<div class="score-limit">⚖️ 适量食物：' + s.limitList.map(function (i) { return esc(i.name); }).join('、') + '</div>';
      }
      s.suggestions.forEach(function (t) {
        html += '<div class="score-sug">' + esc(t) + '</div>';
      });
      html += '<button class="btn secondary sm" style="margin-top:12px" onclick="App.go(\'food\')">去查食物宜忌</button>';
    }
    html += '</div>';
    return html;
  }

  // ---------- 记录首页 ----------
  function renderRecordHome() {
    const items = [
      { key: 'symptom', ico: '🩺', tx: '症状记录' },
      { key: 'diet', ico: '🍽️', tx: '饮食记录' },
      { key: 'water', ico: '💧', tx: '饮水记录' },
      { key: 'med', ico: '💊', tx: '用药记录' },
      { key: 'checkup', ico: '📄', tx: '检查报告' },
      { key: 'note', ico: '📝', tx: '文字备注' }
    ];
    let html = '<div class="card"><h2>想记录什么？</h2><p class="muted">所有记录都会带上日期与时间，时间线不会串台。</p></div>';
    html += '<div class="rec-grid">';
    items.forEach(function (it) {
      html += '<button class="rec-card" onclick="App.openForm(\'' + it.key + '\')"><div class="rc-ico">' + it.ico + '</div><div class="rc-tx">' + it.tx + '</div></button>';
    });
    html += '</div>';
    view.innerHTML = html;
  }

  function openForm(key) {
    if (key === 'symptom') return openSymptomForm();
    if (key === 'diet') return openDietForm();
    if (key === 'water') return openWaterForm();
    if (key === 'med') return openMedForm();
    if (key === 'checkup') return openReportForm();
    if (key === 'note') return openNoteForm();
  }

  // ---------- 症状 ----------
  function openSymptomForm() {
    let html = '<h2>🩺 症状记录</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += field('时间', '<input type="time" id="f_time" value="' + now() + '">');
    html += '<div class="field"><label>尿液颜色</label><div class="chip-row">' + chips('urine', URINE, '淡黄') + '</div></div>';
    html += '<div class="field"><label>疼痛程度</label><div class="chip-row">' + chips('pain', PAIN, '无') + '</div></div>';
    html += '<div class="field"><label>是否发热</label><div class="chip-row">' + chips('fever', FEVER, '否') + '</div></div>';
    html += field('备注', '<textarea id="f_note" placeholder="如：左侧腰部隐痛、尿量正常等"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveSymptom()">保存</button></div>';
    openModal(html);
  }
  function saveSymptom() {
    const detail = {
      urineColor: checked('urine'), pain: checked('pain'),
      fever: checked('fever'), note: val('f_note').trim()
    };
    Store.addEvent({ type: 'symptom', date: val('f_date') || today(), time: val('f_time') || now(), detail: detail });
    closeModal(); toast('已保存症状记录'); go('advice');
  }

  // ---------- 饮食 ----------
  var dietAllParts = [];
  function openDietForm() {
    dietPicks = [];
    dietAllParts = [];
    let html = '<h2>🍽️ 饮食记录</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += '<div class="field"><label>餐次</label><div class="chip-row">' + chips('meal', ['早餐', '午餐', '晚餐'], defaultMeal()) + '</div></div>';
    html += '<div class="field"><label>添加食物（可输入菜名自动识别食材）</label><div class="search-box"><span class="si">🔍</span><input type="text" id="diet_search" placeholder="如 番茄鸡蛋汤、菠菜汤" oninput="App.dietSearch()"></div><div id="diet_cand"></div><div class="pick-list" id="diet_picks"></div></div>';
    html += field('备注', '<textarea id="f_note" placeholder="如：中午在外就餐，喝了一杯可乐"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveDiet()">保存</button></div>';
    openModal(html);
    renderPicks();
  }
  function dietSearch() {
    const q = val('diet_search').trim();
    const box = $('#diet_cand');
    if (!box) return;
    if (!q) { box.innerHTML = ''; dietAllParts = []; return; }
    const profile = Store.getProfile();
    const stone = profile ? profile.stoneType : 'unknown';
    // 精确匹配
    const exact = Knowledge.FOODS.filter(function (f) { return f.name.indexOf(q) >= 0 || f.cat.indexOf(q) >= 0; });
    // 菜谱匹配：输入文本命中菜名 → 列出组成食材（来自 DISHES）
    const dishParts = [];
    let matchedDish = '';
    Knowledge.DISHES.forEach(function (d) {
      if (q.indexOf(d.name) >= 0 || d.name.indexOf(q) >= 0) {
        matchedDish = d.name;
        d.ingredients.forEach(function (ing) {
          if (Knowledge.findFood(ing) && dishParts.indexOf(ing) < 0) dishParts.push(ing);
        });
      }
    });
    // 成分识别：输入文本中包含的食物名（如"番茄鸡蛋汤"→番茄、鸡蛋）
    const subParts = Knowledge.FOODS.filter(function (f) {
      return f.name.length >= 2 && q.indexOf(f.name) >= 0 && exact.indexOf(f) < 0;
    });
    // 合并菜谱与子串识别结果，去重
    const allNames = dishParts.concat(subParts.map(function (f) { return f.name; }));
    const allParts = [];
    allNames.forEach(function (n) { if (allParts.indexOf(n) < 0) allParts.push(n); });
    dietAllParts = allParts;
    let html = '';
    if (exact.length) {
      html += exact.slice(0, 8).map(function (f) {
        const j = Knowledge.judge(f, stone);
        return '<div class="food-item" onclick="App.addPick(\'' + esc(f.name) + '\')"><div class="food-main"><div class="food-name">' + esc(f.name) + '</div><div class="food-cat">' + esc(f.cat) + '</div></div><span class="badge ' + j.verdict + '">' + j.label + '</span></div>';
      }).join('');
    }
    if (allParts.length) {
      const qIsExactFood = exact.some(function (f) { return f.name === q; });
      const title = (matchedDish && !qIsExactFood)
        ? ('识别为菜品：' + matchedDish + '，已列出常见食材（点选或一键加入）：')
        : ('从「' + q + '」中识别出以下食材（点选或一键加入）：');
      const list = allParts.slice(0, 16).map(function (n) {
        const f = Knowledge.findFood(n);
        const j = Knowledge.judge(f, stone);
        return '<div class="food-item" onclick="App.addPick(\'' + esc(n) + '\')"><div class="food-main"><div class="food-name">' + esc(n) + '</div><div class="food-cat">' + esc(f ? f.cat : '') + '</div></div><span class="badge ' + j.verdict + '">' + j.label + '</span></div>';
      }).join('');
      html += '<div class="ocr-hint">' + esc(title) + '</div>' + list +
        '<div style="margin:6px 0 10px"><button class="btn sm" onclick="App.addAllParts()">全部加入（' + allParts.length + '）</button></div>';
    }
    box.innerHTML = html;
  }
  function addAllParts() {
    let names = dietAllParts;
    if (!names || !names.length) {
      const q = val('diet_search').trim();
      if (!q) return;
      names = Knowledge.FOODS.filter(function (f) { return f.name.length >= 2 && q.indexOf(f.name) >= 0; }).map(function (f) { return f.name; });
    }
    names.forEach(function (n) { addPick(n); });
    const s = $('#diet_search'); if (s) s.value = '';
    const box = $('#diet_cand'); if (box) box.innerHTML = '';
  }
  function addPick(name) {
    if (dietPicks.find(function (x) { return x.name === name; })) return;
    const p = Store.getProfile();
    const f = Knowledge.findFood(name);
    const j = Knowledge.judge(f, p ? p.stoneType : 'unknown');
    dietPicks.push({ name: name, verdict: j.verdict, label: j.label });
    renderPicks();
    const box = $('#diet_cand'); if (box) box.innerHTML = '';
    const s = $('#diet_search'); if (s) s.value = '';
  }
  function renderPicks() {
    const box = $('#diet_picks'); if (!box) return;
    box.innerHTML = dietPicks.map(function (p, i) {
      return '<span class="pick"><span class="badge ' + p.verdict + '">' + p.label + '</span>' + esc(p.name) + ' <span class="x" onclick="App.removePick(' + i + ')">✕</span></span>';
    }).join('');
  }
  function removePick(i) { dietPicks.splice(i, 1); renderPicks(); }
  function saveDiet() {
    if (!dietPicks.length) { toast('请先添加食物'); return; }
    Store.addEvent({
      type: 'diet', date: val('f_date') || today(),
      detail: { foods: dietPicks.map(function (p) { return { name: p.name }; }), note: val('f_note').trim(), meal: checked('meal') }
    });
    closeModal(); toast('已保存饮食记录'); go('advice');
  }

  // ---------- 饮水 ----------
  function openWaterForm() {
    let html = '<h2>💧 饮水记录</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += field('时间', '<input type="time" id="f_time" value="' + now() + '">');
    html += field('饮水量(ml)', '<input type="number" id="f_amount" placeholder="如 250" inputmode="numeric">');
    html += '<div class="field"><label>类型</label><div class="chip-row">' + chips('wtype', ['白开水', '柠檬水', '淡茶', '其他'], '白开水') + '</div></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveWater()">保存</button></div>';
    openModal(html);
  }
  function saveWater() {
    const amount = Number(val('f_amount'));
    if (!amount || amount <= 0) { toast('请填写饮水量'); return; }
    Store.addEvent({
      type: 'water', date: val('f_date') || today(), time: val('f_time') || now(),
      detail: { amount: amount, wtype: checked('wtype') }
    });
    closeModal(); toast('已保存饮水 ' + amount + 'ml'); go('advice');
  }

  // ---------- 用药 ----------
  function openMedForm() {
    let html = '<h2>💊 用药记录</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += field('药名', '<input type="text" id="f_name" placeholder="如 排石颗粒">');
    html += field('剂量/频次', '<input type="text" id="f_dose" placeholder="如 一次1袋 一日3次">');
    html += field('备注', '<textarea id="f_note" placeholder="如：饭后服用"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveMed()">保存</button></div>';
    openModal(html);
  }
  function saveMed() {
    const name = val('f_name').trim();
    if (!name) { toast('请填写药名'); return; }
    Store.addEvent({
      type: 'med', date: val('f_date') || today(),
      detail: { name: name, dose: val('f_dose').trim(), note: val('f_note').trim() }
    });
    closeModal(); toast('已保存用药记录'); go('advice');
  }

  // ---------- 备注 ----------
  function openNoteForm() {
    let html = '<h2>📝 文字备注</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += field('内容', '<textarea id="f_text" placeholder="记录任何想记的事，如：今天复查、医生叮嘱…"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveNote()">保存</button></div>';
    openModal(html);
  }
  function saveNote() {
    const text = val('f_text').trim();
    if (!text) { toast('请填写内容'); return; }
    Store.addEvent({ type: 'note', date: val('f_date') || today(), detail: { text: text } });
    closeModal(); toast('已保存'); go('advice');
  }

  // ---------- 检查报告 ----------
  function openReportForm() {
    reportPendingBlob = null;
    let html = '<h2>📄 上传检查报告</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += '<div class="field"><label>报告类型</label><select id="f_rtype"><option>尿常规</option><option>肾功能</option><option>腹部B超</option><option>CT</option><option>出院记录</option><option>其他</option></select></div>';
    html += '<div class="field"><label>拍照/上传图片</label><input type="file" id="f_img" accept="image/*" onchange="App.previewReport(this)"></div>';
    html += '<div id="rep_prev"></div>';
    html += field('关键指标（选填）', '<textarea id="f_metrics" placeholder="如：红细胞 ＋、白细胞 少量、肌酐 78、尿酸 420"></textarea>');
    html += field('备注', '<textarea id="f_note" placeholder="医生诊断、叮嘱等"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveReport()">保存</button></div>';
    openModal(html);
  }
  function previewReport(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('请选择图片'); return; }
    reportPendingBlob = file;
    const url = URL.createObjectURL(file);
    const box = $('#rep_prev');
    if (box) box.innerHTML = '<img class="rep-img-full" src="' + url + '">';
  }
  async function saveReport() {
    const date = val('f_date') || today();
    const id = Store.uid();
    let imageId = null;
    if (reportPendingBlob) {
      imageId = id;
      try { await Store.putImage(id, reportPendingBlob); } catch (e) { toast('图片保存失败'); }
    }
    Store.addReport({ id: id, date: date, type: val('f_rtype'), imageId: imageId, metrics: val('f_metrics').trim(), note: val('f_note').trim() });
    closeModal(); toast('已保存报告'); go('me');
  }
  function openReports() {
    const reports = Store.getReports().slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (!reports.length) { toast('还没有报告，去「记录→检查报告」上传'); go('record'); return; }
    let html = '<div class="card"><div class="row-between"><h2>📄 检查报告</h2><button class="btn secondary sm" onclick="App.openReportForm()">＋上传</button></div></div>';
    html += '<div id="rep_list">';
    reports.forEach(function (r) {
      const sub = r.metrics ? esc(r.metrics).slice(0, 40) : '无文字指标';
      html += '<div class="rep-item" onclick="App.openReportDetail(\'' + r.id + '\')"><div class="rep-main"><div class="rep-title">' + esc(r.type) + ' · ' + esc(r.date) + '</div><div class="rep-sub">' + sub + '</div></div><span class="muted">›</span></div>';
    });
    html += '</div>';
    view.innerHTML = html;
  }
  async function openReportDetail(id) {
    const r = Store.getReports().find(function (x) { return x.id === id; });
    if (!r) return;
    let html = '<h2>📄 ' + esc(r.type) + '</h2>';
    html += '<div class="muted">日期：' + esc(r.date) + '</div>';
    if (r.imageId) {
      try {
        const blob = await Store.getImage(r.imageId);
        if (blob) html += '<img class="rep-img-full" src="' + URL.createObjectURL(blob) + '">';
      } catch (e) {}
    }
    if (r.metrics) html += '<div class="field"><label>关键指标</label><div class="card" style="margin:0">' + esc(r.metrics).replace(/\n/g, '<br>') + '</div></div>';
    if (r.note) html += '<div class="field"><label>备注</label><div class="card" style="margin:0">' + esc(r.note).replace(/\n/g, '<br>') + '</div></div>';
    html += '<div class="modal-actions"><button class="btn danger" onclick="App.delReport(\'' + id + '\')">删除</button><button class="btn" onclick="App.closeModal()">关闭</button></div>';
    openModal(html, { center: true });
  }
  function delReport(id) {
    if (confirm('确定删除这份报告？')) {
      Store.deleteReport(id);
      closeModal(); toast('已删除'); openReports();
    }
  }

  // ---------- 饮食查询 ----------
  function renderFood() {
    const p = Store.getProfile();
    let head = '<div class="card"><h2>🍎 饮食查询</h2>';
    head += '<p class="muted">输入食物名，查看「能不能吃」及原因。当前按结石类型：<b>' + stoneLabel(p ? p.stoneType : 'unknown') + '</b> 判断。</p></div>';
    head += '<div class="search-box"><span class="si">🔍</span><input type="text" id="food_q" placeholder="输入食物，如 菠菜" oninput="App.foodSearch()"></div>';
    head += '<div id="food_list"></div>';
    view.innerHTML = head;
    foodSearch();
  }
  function foodSearch() {
    const p = Store.getProfile();
    const q = (val('food_q') || '').trim();
    const box = $('#food_list'); if (!box) return;
    let list;
    if (!q) {
      list = Knowledge.FOODS.slice(0, 40);
    } else {
      list = Knowledge.FOODS.filter(function (f) { return f.name.indexOf(q) >= 0 || f.cat.indexOf(q) >= 0; });
    }
    if (!list.length) { box.innerHTML = '<div class="empty">未找到相关食物，试试别的名字</div>'; return; }
    box.innerHTML = list.slice(0, 40).map(function (f) {
      const j = Knowledge.judge(f, p ? p.stoneType : 'unknown');
      return '<div class="food-item"><div class="food-main"><div class="food-name">' + esc(f.name) + '</div><div class="food-cat">' + esc(f.cat) + '</div><div class="food-note">' + esc(f.note) + '</div></div><span class="badge ' + j.verdict + '">' + j.label + '</span></div>';
    }).join('');
  }

  // ---------- 我的 ----------
  function renderMe() {
    const p = Store.getProfile();
    const reports = Store.getReports();
    let html = '';
    html += '<div class="card" onclick="App.openProfileForm()" style="cursor:pointer"><div class="row-between"><h2>👤 个人档案</h2><span class="muted">编辑 ›</span></div>';
    if (p) {
      html += '<div class="profile-line"><b>' + esc(p.name || '未填姓名') + '</b>' + (p.gender ? ' · ' + esc(p.gender) : '') + (p.age ? ' · ' + esc(p.age) + '岁' : '') + '</div>';
      html += '<div class="muted">诊断：' + esc(p.diagnosis || '肾结石') + (p.affectedSide ? '（' + esc(p.affectedSide) + '）' : '') + '</div>';
      html += '<div class="muted">手术日期：' + esc(p.surgeryDate || '未填') + (p.surgeryType ? ' · ' + esc(p.surgeryType) : '') + '</div>';
      html += '<div class="muted">结石类型：' + stoneLabel(p.stoneType) + '</div>';
      html += '<div class="muted">饮水目标：' + (p.waterGoal || 2000) + 'ml/天</div>';
    } else {
      html += '<div class="muted">尚未填写，点此完善（建议必填手术日期与结石类型）</div>';
    }
    html += '</div>';

    html += '<div class="card" onclick="App.openReportOCR()" style="cursor:pointer"><div class="row-between"><h2>🏥 出院记录识别</h2><span class="muted">自动填档 ›</span></div><div class="muted">拍照或粘贴出院记录文字，自动提取信息填入个人档案与报告。</div></div>';

    html += '<div class="card" onclick="App.openReports()" style="cursor:pointer"><div class="row-between"><h2>📄 检查报告</h2><span class="muted">' + reports.length + ' 份 ›</span></div><div class="muted">上传报告图片与关键指标，随时回看</div></div>';

    const ai = Store.getAIConfig();
    const aiStatus = (ai.enabled && ai.apiKey) ? '已启用' : '未启用';
    html += '<div class="card" onclick="App.openAISettings()" style="cursor:pointer"><div class="row-between"><h2>🤖 AI 助手设置</h2><span class="muted">' + aiStatus + ' ›</span></div><div class="muted">接入大模型后可自由提问、解读报告。默认关闭，启用需填写 API Key，数据策略本地优先。</div></div>';

    html += '<div class="card"><h2>💾 数据备份</h2><p class="muted">数据只存在本机。换手机前请导出备份，再导入新手机。</p>';
    html += '<div style="display:flex;gap:8px"><button class="btn secondary sm" onclick="App.exportBackup()">导出备份</button><button class="btn secondary sm" onclick="App.importBackup()">导入备份</button></div></div>';

    html += '<div class="card"><h2>ℹ️ 关于与免责</h2><p class="muted" style="white-space:pre-line">本应用所有内容仅为健康信息整理与通用建议，不能替代医生诊断与治疗。如出现剧烈疼痛、发热、持续血尿等请及时就医。\n\n所有数据仅保存在你本机浏览器，不会上传任何服务器。</p></div>';
    view.innerHTML = html;
  }
  function openProfileForm() {
    const p = Store.getProfile() || {};
    const st = p.stoneType || 'unknown';
    const side = p.affectedSide || '';
    let html = '<h2>👤 个人档案</h2>';
    html += field('姓名', '<input type="text" id="p_name" value="' + esc(p.name || '') + '" placeholder="选填">');
    html += '<div class="field"><label>性别</label><div class="chip-row">' +
      chips('gender', ['男', '女'], p.gender || '') + '</div></div>';
    html += field('年龄', '<input type="number" id="p_age" value="' + esc(p.age || '') + '" placeholder="岁" inputmode="numeric">');
    html += field('诊断', '<input type="text" id="p_dx" value="' + esc(p.diagnosis || '肾结石') + '">');
    html += field('手术日期', '<input type="date" id="p_surgery" value="' + esc(p.surgeryDate || '') + '">');
    html += field('手术方式', '<input type="text" id="p_surgery_type" value="' + esc(p.surgeryType || '') + '" placeholder="如 经尿道输尿管软镜钬激光碎石术">');
    html += '<div class="field"><label>结石类型</label><select id="p_stone">' +
      '<option value="unknown"' + (st === 'unknown' ? ' selected' : '') + '>未知</option>' +
      '<option value="calcium"' + (st === 'calcium' ? ' selected' : '') + '>草酸钙结石</option>' +
      '<option value="uric"' + (st === 'uric' ? ' selected' : '') + '>尿酸结石</option>' +
      '<option value="other"' + (st === 'other' ? ' selected' : '') + '>其他</option></select></div>';
    html += '<div class="field"><label>患病侧</label><select id="p_side">' +
      '<option value=""' + (side === '' ? ' selected' : '') + '>未知</option>' +
      '<option value="左侧"' + (side === '左侧' ? ' selected' : '') + '>左侧</option>' +
      '<option value="右侧"' + (side === '右侧' ? ' selected' : '') + '>右侧</option>' +
      '<option value="双侧"' + (side === '双侧' ? ' selected' : '') + '>双侧</option></select></div>';
    html += field('饮水目标(ml/天)', '<input type="number" id="p_water" value="' + (p.waterGoal || 2000) + '" inputmode="numeric">');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveProfile()">保存</button></div>';
    openModal(html);
  }
  function saveProfile() {
    const p = Store.getProfile() || {};
    p.name = val('p_name').trim();
    p.gender = checked('gender');
    p.age = val('p_age').trim();
    p.diagnosis = val('p_dx').trim() || '肾结石';
    p.surgeryDate = val('p_surgery');
    p.surgeryType = val('p_surgery_type').trim();
    p.stoneType = val('p_stone');
    p.affectedSide = val('p_side');
    p.waterGoal = Number(val('p_water')) || 2000;
    Store.saveProfile(p);
    closeModal(); toast('已保存档案'); go('me');
  }

  // ---------- 时间线 ----------
  function renderTimeline() {
    const list = Store.getTimeline().slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    if (!list.length) {
      view.innerHTML = '<div class="empty"><div class="em-ico">📅</div><p>还没有记录</p><p class="muted">点底部「＋」开始记录你的症状、饮食、饮水…</p></div>';
      return;
    }
    let html = '';
    let curDate = null;
    list.forEach(function (ev) {
      if (ev.date !== curDate) { curDate = ev.date; html += '<div class="tl-date">' + esc(curDate) + '</div>'; }
      html += renderEvent(ev);
    });
    view.innerHTML = html;
  }
  function renderEvent(ev) {
    const meta = EVT[ev.type] || { ico: '•', label: ev.type };
    const d = ev.detail || {};
    let title = meta.label, sub = '', subHtml = '';
    if (ev.type === 'symptom') {
      title = '症状';
      sub = '尿色：' + (d.urineColor || '—') + '　疼痛：' + (d.pain || '—') + '　发热：' + (d.fever || '—');
      if (d.note) sub += '\n' + d.note;
    } else if (ev.type === 'diet') {
      title = '饮食' + (d.meal ? (' · ' + d.meal) : '');
      const profile = Store.getProfile();
      const stone = profile ? profile.stoneType : 'unknown';
      const pills = (d.foods || []).map(function (f) {
        const food = Knowledge.findFood(f.name);
        const j = food ? Knowledge.judge(food, stone) : null;
        const cls = j ? j.verdict : 'unknown';
        return '<span class="tl-food ' + cls + '" title="' + (j ? esc(j.label) : '未识别') + '">' + esc(f.name) + '</span>';
      }).join('');
      subHtml = '<div class="tl-foods">' + pills + '</div>';
      if (d.note) subHtml += '<div class="tl-note">备注：' + esc(d.note) + '</div>';
    } else if (ev.type === 'water') {
      title = '饮水'; sub = (d.amount || 0) + 'ml · ' + (d.wtype || '');
    } else if (ev.type === 'med') {
      title = '用药'; sub = (d.name || '') + (d.dose ? (' · ' + d.dose) : '');
      if (d.note) sub += '\n' + d.note;
    } else if (ev.type === 'note') {
      title = '备注'; sub = d.text || '';
    }
    return '<div class="tl-item"><div class="tl-ico">' + meta.ico + '</div><div class="tl-body"><div class="tl-title">' + title + (ev.time ? (' · ' + esc(ev.time)) : '') + '</div><div class="tl-sub">' + (subHtml || esc(sub)) + '</div></div><button class="tl-del" onclick="App.delEvent(\'' + ev.id + '\')">🗑</button></div>';
  }
  function delEvent(id) {
    if (confirm('删除这条记录？')) { Store.deleteEvent(id); toast('已删除'); renderTimeline(); }
  }

  // ---------- 备份 ----------
  async function exportBackup() {
    try {
      const json = await Store.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '肾石康复助手备份_' + today() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      toast('已导出备份文件');
    } catch (e) { toast('导出失败'); }
  }
  function importBackup() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = async function () {
      const f = inp.files && inp.files[0]; if (!f) return;
      try {
        const text = await f.text();
        await Store.importAll(text);
        toast('已导入备份'); render();
      } catch (e) { toast('导入失败：文件格式错误'); }
    };
    inp.click();
  }

  // ---------- AI 助手（预留接入，默认关闭） ----------
  function openAIChat() {
    const cfg = Store.getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      openModal('<h2>🤖 AI 助手</h2>' +
        '<p class="muted">你还没有启用 AI 助手。请先到「我的 → AI 助手设置」中开启并填写 API Key。</p>' +
        '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">关闭</button><button class="btn" onclick="App.closeModal();App.go(\'me\')">去设置</button></div>');
      return;
    }
    let html = '<h2>🤖 问问 AI 助手</h2>';
    html += '<div class="muted" style="margin-bottom:10px">基于你的档案与近 7 天记录作答，不发送历史对话与报告图片。</div>';
    html += '<div class="ai-chat" id="ai_chat"><div class="ai-tip">例如：今天尿色还有点淡红，能喝排骨汤吗？为什么？</div></div>';
    html += '<div class="ai-input-row"><textarea id="ai_q" placeholder="用你自己的话描述问题…" onkeydown="App.aiKey(event)"></textarea><button class="btn ai-send" onclick="App.sendAI()">发送</button></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">关闭</button></div>';
    openModal(html, { center: true });
  }
  function aiKey(e) { if (e && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) App.sendAI(); }
  async function sendAI() {
    const ta = $('#ai_q'); if (!ta) return;
    const q = ta.value.trim();
    if (!q) { toast('请先输入问题'); return; }
    const chat = $('#ai_chat'); if (!chat) return;
    chat.innerHTML += '<div class="ai-msg me">我：' + esc(q) + '</div>';
    ta.value = '';
    const loading = document.createElement('div');
    loading.className = 'ai-msg bot loading'; loading.textContent = 'AI 正在思考…';
    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;
    try {
      const r = await AI.ask(q);
      loading.remove();
      if (r.ok) {
        chat.innerHTML += '<div class="ai-msg bot">AI：' + esc(r.message).replace(/\n/g, '<br>') + '</div>';
      } else {
        chat.innerHTML += '<div class="ai-msg bot err">⚠️ ' + esc(r.message) + '</div>';
      }
    } catch (e) {
      loading.remove();
      chat.innerHTML += '<div class="ai-msg bot err">⚠️ 出错了：' + esc((e && e.message) || '未知错误') + '</div>';
    }
    chat.scrollTop = chat.scrollHeight;
  }
  function openAISettings() {
    const c = Store.getAIConfig();
    let html = '<h2>🤖 AI 助手设置</h2>';
    html += '<div class="ai-warn">⚠️ API Key 仅保存在你本机浏览器，不会上传到本应用服务器。但调用时你的问题内容会发送给你所填的 AI 服务商。请仅使用你信任的服务，并妥善保管 Key，不要泄露。</div>';
    html += '<label class="field ai-switch-field"><span class="ai-switch-label">启用 AI 助手</span>' +
      '<input type="checkbox" id="ai_enabled" class="ai-switch-input"' + (c.enabled ? ' checked' : '') + '>' +
      '<span class="switch"></span></label>';
    html += field('服务地址（Base URL）', '<input type="text" id="ai_base" value="' + esc(c.apiBase) + '" placeholder="如 https://api.deepseek.com/v1">');
    html += field('API Key', '<input type="password" id="ai_key" value="' + esc(c.apiKey) + '" placeholder="sk-..." autocomplete="off">');
    html += field('模型名', '<input type="text" id="ai_model" value="' + esc(c.model) + '" placeholder="如 deepseek-chat">');
    html += '<div class="field"><label>兼容说明</label><div class="muted">接口采用 OpenAI Chat Completions 格式，可填写 DeepSeek、通义千问、豆包、OpenAI 等。需服务商支持浏览器跨域(CORS)。</div></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveAISettings()">保存</button></div>';
    openModal(html);
  }
  function saveAISettings() {
    const enabledEl = $('#ai_enabled');
    const enabled = !!(enabledEl && enabledEl.checked);
    const apiKey = val('ai_key').trim();
    if (enabled && !apiKey) { toast('启用需填写 API Key'); return; }
    const cfg = {
      enabled: enabled,
      apiBase: val('ai_base').trim() || 'https://api.deepseek.com/v1',
      apiKey: apiKey,
      model: val('ai_model').trim() || 'deepseek-chat'
    };
    Store.saveAIConfig(cfg);
    closeModal();
    toast(enabled ? 'AI 助手已启用' : '已保存（未启用）');
    go('me');
  }

  // ---------- 出院记录识别 ----------
  function openReportOCR() {
    let html = '<h2>🏥 出院记录识别</h2>';
    html += '<div class="ocr-warn">⚠️ 为保护隐私，识别过程在本地完成；若开启 AI，仅当点击「用 AI 解析」时才会发送报告文字。不会上传图片。</div>';
    html += '<div class="field"><label>拍照/上传出院记录</label><input type="file" id="ocr_img" accept="image/*" onchange="App.ocrPreview(this)"></div>';
    html += '<div id="ocr_prev"></div>';
    html += '<div class="field"><label>或粘贴报告文字（可先用微信/扫描软件识别文字后粘贴）</label><textarea id="ocr_text" placeholder="粘贴出院记录全文…"></textarea></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn secondary" onclick="App.parseReportText(false)">本地规则解析</button><button class="btn" onclick="App.parseReportText(true)">用 AI 解析</button></div>';
    html += '<div id="ocr_result"></div>';
    openModal(html, { center: true });
  }
  let ocrPendingBlob = null;
  function ocrPreview(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('请选择图片'); return; }
    ocrPendingBlob = file;
    const url = URL.createObjectURL(file);
    const box = $('#ocr_prev');
    if (box) box.innerHTML = '<img class="rep-img-full" src="' + url + '">';
  }
  function normalizeDate(s) {
    if (!s) return '';
    s = String(s).trim();
    // 2026-07-11 / 2026/07/11 / 2026.7.10 / 2026年7月11日
    let m = s.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/);
    if (m) return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
    // 2026.7.10
    m = s.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (m) return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
    return s;
  }
  function extractBlock(text, startKeys, endKeys) {
    for (const sk of startKeys) {
      const idx = text.indexOf(sk);
      if (idx < 0) continue;
      let tail = text.slice(idx + sk.length);
      for (const ek of endKeys) {
        const eidx = tail.indexOf(ek);
        if (eidx >= 0) tail = tail.slice(0, eidx);
      }
      return tail.replace(/\s+/g, ' ').trim();
    }
    return '';
  }
  function localParseReport(text) {
    const t = text.replace(/\r/g, '\n');
    const get = function (re) { const m = t.match(re); return m ? m[1].trim() : ''; };
    const has = function (s) { return t.indexOf(s) >= 0; };
    const admissionDiag = extractBlock(t, ['入院诊断：', '入院诊断:', '入院诊断'], ['出院诊断', '科室', '出院情况', '出院医嘱', '入院情况', '诊疗经过', '遂于']);
    const dischargeDiag = extractBlock(t, ['出院诊断：', '出院诊断:', '出院诊断'], ['出院情况', '出院医嘱', '特殊检查编号', '遂于', '在全麻', '手术']);
    const note = extractBlock(t, ['出院医嘱：', '出院医嘱:', '出院医嘱', '医嘱：'], ['特殊检查编号', '离院方式', '是否有出院']);

    // 手术日期：找 "遂于YYYY-MM-DD" 或日期紧跟手术描述的
    let surgeryDate = '';
    const sdMatch = t.match(/遂于\s*(\d{4}[-年/]\d{1,2}[-月/]\d{1,2})/) || t.match(/(\d{4}[-年/]\d{1,2}[-月/]\d{1,2}).{0,30}(?:全麻|手术|碎石|镜)/);
    if (sdMatch) surgeryDate = normalizeDate(sdMatch[1]);

    // 手术方式
    let surgeryType = '';
    const stMatch = t.match(/(经尿道[\S]{0,20}镜[\S]{0,20}碎石[\S]{0,6})/) || t.match(/(经皮肾镜[\S]{0,20}碎石[\S]{0,6})/) || t.match(/(输尿管[软硬]?镜[\S]{0,20}激光碎石[\S]{0,6})/);
    if (stMatch) surgeryType = stMatch[1];

    // 结石成分
    let stoneType = 'unknown';
    if (has('草酸钙')) stoneType = 'calcium';
    else if (has('尿酸')) stoneType = 'uric';
    else if (has('胱氨酸') || has('磷酸钙') || has('感染') || has('鸟粪石')) stoneType = 'other';

    // 患病侧（优先以输尿管/手术侧为准，更准确对应术后恢复）
    let affectedSide = '';
    if (has('左输尿管')) affectedSide = '左侧';
    else if (has('右输尿管')) affectedSide = '右侧';
    else if (has('双侧') || has('双肾')) affectedSide = '双侧';
    else if (has('左侧') || has('左肾')) affectedSide = '左侧';
    else if (has('右侧') || has('右肾')) affectedSide = '右侧';

    return {
      name: get(/姓名[:：]\s*([^\s\n]+)/),
      gender: get(/性别[:：]\s*(男|女)/),
      age: get(/年龄[:：]\s*(\d+)/),
      hospitalNo: get(/住院号[:：]\s*([^\s\n]+)/),
      hospital: get(/医院[:：]\s*([^\n]+)/) || (has('第一人民医院') ? '襄阳市第一人民医院' : ''),
      admissionDate: normalizeDate(get(/入院时间[:：]\s*([^\n]+)/)),
      dischargeDate: normalizeDate(get(/出院时间[:：]\s*([^\n]+)/)),
      diagnosis: dischargeDiag || admissionDiag,
      surgeryDate: surgeryDate,
      surgeryType: surgeryType,
      stoneType: stoneType,
      affectedSide: affectedSide,
      memo: note,
      reportNote: ''
    };
  }
  async function parseReportText(useAI) {
    const ta = $('#ocr_text');
    const text = ta ? ta.value.trim() : '';
    if (!text && !ocrPendingBlob) { toast('请先上传图片或粘贴报告文字'); return; }
    if (!text && ocrPendingBlob) { toast('当前仅上传了图片，请先用手机扫描软件识别文字后粘贴到文本框'); return; }

    const resultBox = $('#ocr_result');
    if (resultBox) resultBox.innerHTML = '<div class="ocr-loading">正在解析…</div>';

    let data;
    if (useAI) {
      const r = await AI.parseReport(text);
      if (!r.ok) {
        if (resultBox) resultBox.innerHTML = '<div class="ocr-error">' + esc(r.message) + '</div>';
        return;
      }
      data = r.data;
    } else {
      data = localParseReport(text);
    }
    showParsedResult(data);
  }
  function showParsedResult(data) {
    const resultBox = $('#ocr_result');
    if (!resultBox) return;
    const rows = [
      ['姓名', data.name], ['性别', data.gender], ['年龄', data.age],
      ['住院号', data.hospitalNo], ['医院', data.hospital],
      ['入院日期', data.admissionDate], ['出院日期', data.dischargeDate],
      ['诊断', data.diagnosis], ['手术日期', data.surgeryDate], ['手术方式', data.surgeryType],
      ['结石类型', data.stoneType], ['患病侧', data.affectedSide]
    ];
    let html = '<div class="ocr-result"><h3>识别结果（请核对）</h3>';
    html += '<table class="ocr-table">';
    rows.forEach(function (r) {
      html += '<tr><td class="ocr-k">' + esc(r[0]) + '</td><td class="ocr-v">' + (r[1] ? esc(String(r[1])) : '<span class="muted">未识别</span>') + '</td></tr>';
    });
    html += '</table>';
    html += '<div class="field"><label>医生叮嘱/出院医嘱（可编辑）</label><textarea id="ocr_memo">' + esc(data.memo || '') + '</textarea></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.applyParsedProfile()">确认填入档案</button></div></div>';
    resultBox.innerHTML = html;
    resultBox.dataset.parsed = JSON.stringify(data);
  }
  function applyParsedProfile() {
    const resultBox = $('#ocr_result');
    const raw = resultBox && resultBox.dataset.parsed;
    if (!raw) { toast('没有可应用的识别结果'); return; }
    const data = JSON.parse(raw);
    const p = Store.getProfile() || {};
    if (data.name) p.name = String(data.name).trim();
    if (data.gender) p.gender = String(data.gender).trim();
    if (data.age) p.age = String(data.age).trim();
    if (data.diagnosis) p.diagnosis = String(data.diagnosis).trim();
    if (data.surgeryDate) p.surgeryDate = normalizeDate(data.surgeryDate);
    if (data.surgeryType) p.surgeryType = String(data.surgeryType).trim();
    if (data.stoneType && ['calcium', 'uric', 'other', 'unknown'].indexOf(data.stoneType) >= 0) p.stoneType = data.stoneType;
    if (data.affectedSide) p.affectedSide = String(data.affectedSide).trim();
    if (data.hospital) p.hospital = String(data.hospital).trim();
    if (data.hospitalNo) p.hospitalNo = String(data.hospitalNo).trim();
    const memo = $('#ocr_memo') ? $('#ocr_memo').value.trim() : (data.memo || '');
    if (memo) p.memo = memo;
    Store.saveProfile(p);

    // 同时存一份「出院记录」报告
    const reportDate = normalizeDate(data.dischargeDate) || (data.surgeryDate ? normalizeDate(data.surgeryDate) : Store.todayStr());
    const reportMetrics = (data.diagnosis ? ('诊断：' + data.diagnosis) : '') + (data.surgeryDate ? ('\n手术日期：' + normalizeDate(data.surgeryDate)) : '') + (data.surgeryType ? ('\n手术方式：' + data.surgeryType) : '');
    const reportNote = (data.memo || '') + (data.reportNote ? ('\n' + data.reportNote) : '');
    Store.addReport({ id: Store.uid(), date: reportDate, type: '出院记录', metrics: reportMetrics, note: reportNote, imageId: null });

    closeModal();
    toast('已填入档案并保存出院记录');
    go('me');
  }

  // ---------- 快捷 ----------
  function quickSymptom() { openForm('symptom'); }
  function quickWater() { openForm('water'); }

  // ---------- init ----------
  function init() {
    $$('.tab').forEach(function (t) { t.addEventListener('click', function () { go(t.dataset.tab); }); });
    go('advice');
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
  }
  init();

  window.App = {
    pickChip: pickChip, go: go, closeModal: closeModal, openForm: openForm,
    saveSymptom: saveSymptom, saveDiet: saveDiet, saveWater: saveWater,
    saveMed: saveMed, saveNote: saveNote,
    dietSearch: dietSearch, addPick: addPick, removePick: removePick, addAllParts: addAllParts,
    previewReport: previewReport, saveReport: saveReport,
    openReportDetail: openReportDetail, delReport: delReport, openReports: openReports,
    foodSearch: foodSearch,
    openProfileForm: openProfileForm, saveProfile: saveProfile,
    exportBackup: exportBackup, importBackup: importBackup,
    delEvent: delEvent, quickSymptom: quickSymptom, quickWater: quickWater, quickDiet: openDietForm,
    openAIChat: openAIChat, sendAI: sendAI, aiKey: aiKey,
    openAISettings: openAISettings, saveAISettings: saveAISettings,
    openReportOCR: openReportOCR, ocrPreview: ocrPreview,
    parseReportText: parseReportText, applyParsedProfile: applyParsedProfile
  };
})();
