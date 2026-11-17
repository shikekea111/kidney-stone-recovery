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
  const APP_VERSION = '2.10.4';

  // ---------- 统一线性图标（替代 emoji，跨机型一致）----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    drop: '<path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z"/>',
    activity: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
    utensils: '<path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11"/><path d="M16 3c-2 2-2.5 4-2.5 6H19c0-2-.5-4-3-6M16.5 9v12"/>',
    pill: '<path d="M10.5 3.5 3.5 10.5a5 5 0 0 0 7 7l7-7a5 5 0 0 0-7-7Z"/><path d="m7 14 7-7"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 13h6M9 17h6"/>',
    note: '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 6 3 3"/>',
    alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    hospital: '<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5M12 8v5M9.5 10.5h5"/>',
    save: '<path d="M5 3h12l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    pin: '<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z"/><path d="M12 14v7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-5 3 2 4-6"/>'
  };
  function icon(name, size, cls) {
    const s = size || 20;
    return '<svg class="ico ' + (cls || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
  }

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
  function checkedValues(name) {
    const els = document.querySelectorAll('#modalRoot input[name="' + name + '"]:checked');
    const out = [];
    els.forEach(function (el) { if (el.value) out.push(el.value); });
    return out;
  }
  function toggleCondFields() {
    const vals = checkedValues('cond');
    const kf = document.getElementById('kidney_fields');
    const tf = document.getElementById('tooth_fields');
    const hf = document.getElementById('hypertension_fields');
    if (kf) kf.style.display = (vals.indexOf('kidney_stone') >= 0) ? '' : 'none';
    if (tf) tf.style.display = (vals.indexOf('wisdom_tooth') >= 0) ? '' : 'none';
    if (hf) hf.style.display = (vals.indexOf('hypertension') >= 0) ? '' : 'none';
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
    symptom: { ico: 'activity', label: '症状' },
    diet: { ico: 'utensils', label: '饮食' },
    water: { ico: 'drop', label: '饮水' },
    med: { ico: 'pill', label: '用药' },
    checkup: { ico: 'file', label: '检查' },
    note: { ico: 'note', label: '备注' }
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
    pageTitle.textContent = TITLES[tab] || '能吃吗';
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    if (currentTab === 'advice') renderAdvice();
    else if (currentTab === 'timeline') renderTimeline();
    else if (currentTab === 'record') renderRecordHome();
    else if (currentTab === 'food') renderFood();
    else if (currentTab === 'me') renderMe();
    playViewAnim();
  }
  // 页面切换淡入（重置动画需强制重排）
  function playViewAnim() {
    try {
      view.classList.remove('fade');
      void view.offsetWidth;
      view.classList.add('fade');
    } catch (e) { /* 忽略 */ }
  }

  // ---------- 建议（结论优先 · v4）----------
  function renderAdvice() {
    const p = Store.getProfile();
    const tl = Store.getTimeline();
    const rp = Store.getReports();
    const s = Advice.scoreTodayDiet(p, tl);
    const adv = Advice.buildAdvice(p, tl, rp);
    const conds = p ? Knowledge.getConditions(p) : [];
    const hasKidney = conds.some(function (c) { return c.id === 'kidney_stone'; });
    const goal = (p && p.waterGoal) || 2000;
    const todayStr = Store.todayStr();

    // 病种摘要：保留原有信息，降级为一行小字
    let summary = '';
    if (!p) {
      summary = '尚未填写个人档案，到「我的」勾选病种后，宜忌判定会更准。';
    } else if (conds.length) {
      const parts = conds.map(function (c) {
        if (c.id === 'kidney_stone') {
          const ds = Advice.daysSince(c.surgeryDate);
          return '肾结石 · ' + stoneLabel(c.stoneType) + (ds !== null && ds >= 0 ? ' · 术后第' + ds + '天' : '');
        }
        if (c.id === 'wisdom_tooth') {
          const st = (Knowledge.CONDITIONS.wisdom_tooth.stages[c.stage] || {}).name || '发炎期';
          return '智齿发炎 · ' + st;
        }
        if (c.id === 'hypertension') return '高血压' + (c.meds && c.meds.length ? ' · 服药' : '');
        return c.id;
      });
      summary = parts.join('　·　') + (hasKidney ? ('　·　饮水目标 ' + goal + 'ml/天') : '');
    } else {
      summary = '已填部分信息，但未选择病种，建议到「我的」勾选。';
    }

    // 今日饮水 / 记录数
    let water = 0, todayCount = 0;
    tl.forEach(function (e) {
      if (e.date !== todayStr) return;
      todayCount++;
      if (e.type === 'water') water += Number((e.detail && e.detail.amount) || 0);
    });

    // 主结论：一句话说清「今天能不能吃」
    let headline, subline, ringLevel, ringVal, ringPct;
    if (s.empty) {
      headline = '今天还没记录饮食';
      subline = '记一笔，就能看到按你病种算出的宜忌结论。';
      ringLevel = 'empty'; ringVal = '—'; ringPct = 0;
    } else {
      ringVal = s.score;
      ringPct = Math.max(4, Math.min(100, Number(s.score) || 0));
      ringLevel = s.level;
      if (s.avoid > 0) {
        headline = '今天有 ' + s.avoid + ' 样要避开';
        subline = '其余 ' + (s.ok + s.limit) + ' 样已记录，下面有具体清单。';
      } else if (s.level === 'good') {
        headline = '今天可以放心吃';
        subline = '没有忌口记录，继续保持。';
      } else {
        headline = '今天总体平稳';
        subline = '有 ' + s.limit + ' 样建议控制分量。';
      }
    }
    const C = 2 * Math.PI * 40;
    const dash = (C * (1 - ringPct / 100)).toFixed(1);

    let html = '';
    // ① 主结论卡：全页唯一的视觉重心
    html += '<div class="card hero-status' + (s.empty ? ' is-empty' : '') + '">';
    html += '<div class="hs-top"><span class="hs-label">今日状态</span><span class="hs-date">' + esc(todayStr) + '</span></div>';
    html += '<div class="hs-main"><div class="hs-ring-wrap ' + ringLevel + '">';
    html += '<svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">' +
      '<circle cx="46" cy="46" r="40" fill="none" stroke="#efeae3" stroke-width="8"/>' +
      '<circle class="hs-ring-val" cx="46" cy="46" r="40" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + dash + '" transform="rotate(-90 46 46)"/></svg>';
    html += '<div class="hs-ring-tx">' + (s.empty ? '<b class="hs-none">暂无</b>' : '<b>' + ringVal + '</b><small>分</small>') + '</div></div>';
    html += '<div class="hs-copy"><div class="hs-headline">' + esc(headline) + '</div><div class="hs-sub">' + esc(subline) + '</div></div></div>';
    html += '<div class="hs-stats">' +
      '<div class="hs-stat ok"><b>' + (s.empty ? '—' : s.ok) + '</b><span>可吃</span></div>' +
      '<div class="hs-stat limit"><b>' + (s.empty ? '—' : s.limit) + '</b><span>适量</span></div>' +
      '<div class="hs-stat avoid"><b>' + (s.empty ? '—' : s.avoid) + '</b><span>忌口</span></div></div></div>';
    if (summary) html += '<div class="muted" style="margin:-4px 2px 12px;font-size:12px">' + esc(summary) + '</div>';

    // ② 页面唯一红色高亮：忌口清单（无忌口时退化为最重要的一条警示）
    const avoidNames = (s.avoidList || []).map(function (i) { return i.name; });
    const warnAdv = adv.filter(function (a) { return a.level === 'warn'; });
    if (avoidNames.length) {
      html += '<div class="avoid-alert">' + icon('alert', 22, 'aa-ico') +
        '<div class="aa-body"><div class="aa-title">今天要避开</div><div class="aa-list">' + esc(avoidNames.join('、')) + '</div></div>' +
        '<button class="aa-btn" onclick="App.go(\'food\')">查替代 ›</button></div>';
    } else if (warnAdv.length) {
      html += '<div class="avoid-alert">' + icon('alert', 22, 'aa-ico') +
        '<div class="aa-body"><div class="aa-title">需要留意</div><div class="aa-list">' + esc(warnAdv[0].title) + '</div></div>' +
        '<button class="aa-btn" onclick="App.showReminders()">看详情 ›</button></div>';
    }

    // ③ 用药到期提醒：带操作按钮，不折进折叠区
    html += medsExpiryNotice();

    // ④ 饮水进度（仅肾结石计入评分）/ 今日记录简报
    if (hasKidney) {
      const pct = Math.max(2, Math.min(100, Math.round(water / (goal || 2000) * 100)));
      html += '<div class="card mini-card">';
      html += '<div class="mc-top"><div class="mc-title">' + icon('drop', 18) + '今日饮水</div>' +
        '<div class="mc-num"><b>' + water + '</b> / ' + goal + ' ml</div></div>';
      html += '<div class="mc-bar"><div class="mc-bar-in' + (water >= goal ? ' done' : '') + '" style="width:' + pct + '%"></div></div>';
      html += '<div class="mc-actions">' +
        '<button class="btn secondary sm" onclick="App.quickAddWater(200)">＋ 200ml</button>' +
        '<button class="btn secondary sm" onclick="App.quickAddWater(300)">＋ 300ml</button>' +
        '<button class="btn link sm" onclick="App.quickWater()">自定义</button></div></div>';
    } else {
      html += '<div class="card mini-card"><div class="mc-top"><div class="mc-title">' + icon('calendar', 18) +
        '今日记录</div><div class="mc-num"><b>' + todayCount + '</b> 条</div></div>' +
        '<div class="muted">饮食、症状、用药都能记，时间线不会串台。</div></div>';
    }

    // ⑤ 其余提醒与评分明细折进可展开区
    const normal = adv.filter(function (a) { return a.level !== 'disclaimer'; });
    const warnCount = normal.filter(function (a) { return a.level === 'warn'; }).length;
    html += '<details class="reminder-fold" id="reminderFold"><summary>' + icon('bell', 18, 'rf-ico') +
      '<span class="rf-tx">今日提醒 <b>' + normal.length + ' 条</b></span>' +
      (warnCount ? '<span class="rf-dot"></span>' : '') +
      '<span class="rf-chev">' + icon('chevron', 16) + '</span></summary><div class="rf-body">';
    normal.forEach(function (a) {
      html += '<div class="advice ' + a.level + '"><div class="a-title">' + esc(a.title) + '</div><div class="a-text">' + esc(a.text) + '</div></div>';
    });
    html += renderDietScore() + renderScoreTrend() + '</div></details>';

    // ⑥ 快捷记录
    html += '<div class="quick-bar">' +
      '<button onclick="App.quickSymptom()">' + icon('activity', 20) + '<span>记症状</span></button>' +
      '<button onclick="App.quickDiet()">' + icon('utensils', 20) + '<span>记饮食</span></button>' +
      '<button onclick="App.openForm(\'med\')">' + icon('pill', 20) + '<span>记用药</span></button></div>';

    /* AI-BEGIN */
    // ⑦ AI 入口弱化 + 免责常驻
    html += '<div class="ai-mini"><button onclick="App.openAIChat()">' + icon('chat', 16) +
      '有复杂问题？问问 AI 助手 <span>›</span></button></div>';
    /* AI-END */
    html += '<div class="disclaimer-mini">' + esc(String(Advice.DISCLAIMER || '').replace(/^⚠️\s*/, '')) + '</div>';
    view.innerHTML = html;
  }

  // 今日饮食评分卡片
  function renderDietScore() {
    const p = Store.getProfile();
    const tl = Store.getTimeline();
    const s = Advice.scoreTodayDiet(p, tl);
    let html = '<div class="card diet-score' + (s.empty ? '' : ' ' + s.level) + '">';
    html += '<div class="row-between"><h2>' + icon('utensils', 16, 'h2-ico') + '今日饮食评分</h2><span class="muted">' + esc(s.date) + '</span></div>';
    if (s.empty) {
      html += '<div class="muted" style="margin-top:8px">' + esc(s.text) + '</div>';
    } else {
      html += '<div class="score-row">';
      html += '<div class="score-big ' + s.level + '">' + s.score + '<span class="score-unit">分</span></div>';
      const pct = Math.max(4, Math.min(100, Number(s.score) || 0));
      html += '<div class="score-meta"><div class="score-level ' + s.level + '">' + s.levelText + '</div>';
      html += '<div class="score-bar"><div class="score-bar-in ' + s.level + '" style="width:' + pct + '%"></div></div>';
      const recTag = (s.rec > 0) ? '<span class="badge recommend">推荐 ' + s.rec + '</span>' : '';
      html += '<div class="score-tags"><span class="badge ok">可吃 ' + s.ok + '</span><span class="badge limit">适量 ' + s.limit + '</span><span class="badge avoid">忌口 ' + s.avoid + '</span>' + recTag + '</div></div>';
      html += '</div>';
      html += '<div class="score-analysis">' + esc(s.analysis) + '</div>';
      if (s.avoidList && s.avoidList.length) {
        html += '<div class="score-avoid">忌口食物：' + s.avoidList.map(function (i) { return esc(i.name); }).join('、') + '</div>';
      }
      s.suggestions.forEach(function (t) {
        html += '<div class="score-sug">• ' + esc(t) + '</div>';
      });
      html += '<button class="btn secondary sm" style="margin-top:10px" onclick="App.go(\'food\')">去查食物宜忌</button>';
    }
    html += '</div>';
    return html;
  }

  // ---------- 近 7 天评分趋势（折叠区内）----------
  function renderScoreTrend() {
    const p = Store.getProfile();
    const tl = Store.getTimeline();
    const week = ['日', '一', '二', '三', '四', '五', '六'];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base.getTime());
      d.setDate(d.getDate() - i);
      const ds = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      const s = Advice.scoreTodayDiet(p, tl, ds);
      days.push({
        date: ds,
        label: i === 0 ? '今' : week[d.getDay()],
        today: i === 0,
        score: s.empty ? null : s.score,
        level: s.level || 'info'
      });
    }
    const recorded = days.filter(function (d) { return d.score !== null; });
    const avg = recorded.length
      ? Math.round(recorded.reduce(function (a, d) { return a + d.score; }, 0) / recorded.length)
      : null;
    const fmt = function (ds) {
      const a = ds.split('-');
      return Number(a[1]) + '/' + Number(a[2]);
    };

    let html = '<div class="card trend-card">';
    html += '<div class="tc-head"><h2 class="tc-title">' + icon('chart', 16) + '近 7 天饮食评分</h2>' +
      '<span class="tc-meta">' + (avg === null ? '暂无数据' : '平均 ' + avg + ' 分') + '</span></div>';
    html += '<div class="tc-chart">';
    days.forEach(function (d) {
      const has = d.score !== null;
      const h = has ? Math.max(8, Math.min(100, d.score)) : 6;
      html += '<div class="tc-col">' +
        '<div class="tc-val' + (has ? '' : ' none') + '">' + (has ? d.score : '·') + '</div>' +
        '<div class="tc-bar-area"><div class="tc-bar ' + (has ? d.level : 'none') + '" style="height:' + h + '%" title="' + d.date + '"></div></div>' +
        '<div class="tc-x' + (d.today ? ' today' : '') + '">' + d.label + '</div></div>';
    });
    html += '</div>';
    html += '<div class="tc-foot">' + fmt(days[0].date) + ' – ' + fmt(days[6].date) +
      ' · 7 天里 ' + recorded.length + ' 天有记录' +
      (avg === null ? '。从今天开始记一笔，这里就会出现趋势。' : '。分数按当前档案判定，肾结石用户还含当日记入的饮水量。') + '</div>';
    html += '</div>';
    return html;
  }

  // ---------- 记录首页 ----------
  function renderRecordHome() {
    const items = [
      { key: 'symptom', ico: 'activity', tx: '症状记录' },
      { key: 'diet', ico: 'utensils', tx: '饮食记录' },
      { key: 'water', ico: 'drop', tx: '饮水记录' },
      { key: 'med', ico: 'pill', tx: '用药记录' },
      { key: 'checkup', ico: 'file', tx: '检查报告' },
      { key: 'note', ico: 'note', tx: '文字备注' }
    ];
    let html = '<div class="card"><h2>' + icon('plus', 16, 'h2-ico') + '想记录什么？</h2><p class="muted">所有记录都会带上日期与时间，时间线不会串台。</p></div>';
    html += '<div class="rec-grid">';
    items.forEach(function (it) {
      html += '<button class="rec-card" onclick="App.openForm(\'' + it.key + '\')"><div class="rc-ico">' + icon(it.ico, 30) + '</div><div class="rc-tx">' + it.tx + '</div></button>';
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
    let html = '<h2>' + icon('activity', 18, 'h2-ico') + '症状记录</h2>';
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
  function openDietForm() {
    dietPicks = [];
    let html = '<h2>' + icon('utensils', 18, 'h2-ico') + '饮食记录</h2>';
    html += field('日期', '<input type="date" id="f_date" value="' + today() + '">');
    html += '<div class="field"><label>餐次</label><div class="chip-row">' + chips('meal', ['早餐', '午餐', '晚餐'], defaultMeal()) + '</div></div>';
    html += '<div class="field"><label>添加食物（可输入菜名自动识别食材）</label><div class="search-box"><span class="si">' + icon('search', 16) + '</span><input type="text" id="diet_search" placeholder="如 番茄鸡蛋汤、菠菜汤" oninput="App.dietSearch()"></div><div id="diet_cand"></div><div class="pick-list" id="diet_picks"></div></div>';
    html += field('备注', '<textarea id="f_note" placeholder="如：中午在外就餐，喝了一杯可乐"></textarea>');
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveDiet()">保存</button></div>';
    openModal(html);
    renderPicks();
  }
  // 候选统一计算：搜索命中 + 菜名拆解，供展示与「全部加入」共用，避免两处口径不一致
  function dietCandidates(q) {
    const exact = Knowledge.searchFoods(q);
    const dish = Knowledge.analyzeDish(q);
    const whole = dish.whole;
    // 整道菜排最前：避免「襄阳豆腐面」只识别出「豆腐」，漏掉重盐辣汤的风险
    const ordered = whole ? [whole].concat(exact.filter(function (f) { return f !== whole; })) : exact;
    // 搜「黑椒牛排」时拆解也会认出「牛排」；已在候选列表里的不重复列、也不重复记
    const parts = dish.parts.filter(function (f) { return ordered.indexOf(f) < 0; });
    return { whole: whole, ordered: ordered, parts: parts };
  }
  function dietSearch() {
    const q = val('diet_search').trim();
    const box = $('#diet_cand');
    if (!box) return;
    if (!q) { box.innerHTML = ''; return; }
    const profile = Store.getProfile();
    const conds = Knowledge.getConditions(profile);
    const c = dietCandidates(q);
    const whole = c.whole, ordered = c.ordered, parts = c.parts;
    function row(f) {
      const j = Knowledge.judge(f, conds);
      const sub = (f === whole) ? f.cat + ' · 整道菜（含汤底调料）' : f.cat;
      return '<div class="food-item" onclick="App.addPick(\'' + esc(f.name) + '\')"><div class="food-main"><div class="food-name">' + esc(f.name) + '</div><div class="food-cat">' + esc(sub) + '</div></div><span class="badge ' + j.verdict + '">' + j.label + '</span>' + (j.recommended ? '<span class="badge recommend">推荐</span>' : '') + '</div>';
    }
    let html = '';
    if (ordered.length) html += ordered.slice(0, 8).map(row).join('');
    if (parts.length) {
      html += '<div class="ocr-hint">「' + esc(q) + '」里还含这些食材（点选或一键加入）：</div>' + parts.slice(0, 12).map(row).join('') +
        '<div style="margin:6px 0 10px"><button class="btn sm" onclick="App.addAllParts()">全部加入（' + parts.length + '）</button></div>';
    }
    if (!html) {
      html = unrecCardHtml(q, 'diet');
      Store.addPendingFood(q);
    }
    box.innerHTML = html;
  }
  function addAllParts() {
    const q = val('diet_search').trim();
    if (!q) return;
    const parts = dietCandidates(q).parts;
    parts.forEach(function (f) { addPick(f.name); });
    const s = $('#diet_search'); if (s) s.value = '';
    const box = $('#diet_cand'); if (box) box.innerHTML = '';
  }
  function addPick(name) {
    if (dietPicks.find(function (x) { return x.name === name; })) return;
    const p = Store.getProfile();
    const f = Knowledge.findFood(name);
    if (!f) return;
    const j = Knowledge.judge(f, Knowledge.getConditions(p));
    dietPicks.push({ name: name, verdict: j.verdict, label: j.label, reasons: j.reasons, recommended: j.recommended });
    renderPicks();
    const box = $('#diet_cand'); if (box) box.innerHTML = '';
    const s = $('#diet_search'); if (s) s.value = '';
  }
  function renderPicks() {
    const box = $('#diet_picks'); if (!box) return;
    box.innerHTML = dietPicks.map(function (p, i) {
      let r = '';
      if (p.reasons && p.reasons.length) {
        const rn = p.reasons.map(function (x) { return x.conditionName + (x.stageName ? '（' + x.stageName + '）' : ''); }).join('、');
        r = ' <span class="pick-reason">因' + esc(rn) + '</span>';
      }
      const recBadge = p.recommended ? '<span class="badge recommend">推荐</span>' : '';
      return '<span class="pick"><span class="badge ' + p.verdict + '">' + p.label + '</span>' + recBadge + esc(p.name) + r + ' <span class="x" onclick="App.removePick(' + i + ')">✕</span></span>';
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

  // ---------- 未收录食物：手动记一笔并加入"我的食物" ----------
  function verdictLabelLoc(v) {
    if (v === 'avoid') return '忌口/少吃';
    if (v === 'limit') return '适量';
    return '可吃';
  }
  function unrecCardHtml(q, ctx) {
    const catId = ctx === 'food' ? 'uc_cat_f' : 'uc_cat';
    const vId = ctx === 'food' ? 'uc_verdict_f' : 'uc_verdict';
    const btn = ctx === 'food' ? 'App.addCustomFood()' : 'App.addCustomPick()';
    const cats = ['蔬菜', '水果', '肉蛋奶', '主食', '零食', '饮品', '调料', '坚果', '补剂', '草药茶'];
    const catOpts = cats.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    return '<div class="ocr-hint" style="border:1px dashed #d98; padding:10px; border-radius:8px; line-height:1.7; margin-top:6px">' +
      '没找到「<b>' + esc(q) + '</b>」。可直接记一笔（下次自动识别）：' +
      '<div class="field" style="margin:8px 0"><label>分类</label><select id="' + catId + '" class="uc-sel">' + catOpts + '</select></div>' +
      '<div class="field"><label>你判断能不能吃</label><div class="chip-row" id="' + vId + '">' +
      '<span class="chip active" data-v="ok" onclick="App.ucVerdict(this)">可吃</span>' +
      '<span class="chip" data-v="limit" onclick="App.ucVerdict(this)">适量</span>' +
      '<span class="chip" data-v="avoid" onclick="App.ucVerdict(this)">忌口</span></div></div>' +
      '<button class="btn sm" onclick="' + btn + '">＋ 记一笔并加入我的食物</button>' +
      '</div>';
  }
  function ucVerdict(el) {
    const row = el.parentNode;
    Array.prototype.forEach.call(row.children, function (c) { if (c.classList) c.classList.remove('active'); });
    el.classList.add('active');
  }
  function ucBuildFood(q, catId, vId) {
    const cat = (val(catId) || '其他');
    const vEl = document.querySelector('#' + vId + ' .chip.active');
    const v = vEl ? vEl.dataset.v : 'ok';
    return { name: q, cat: cat, ox: v, ur: v, note: '（自定义食物，你标记为' + verdictLabelLoc(v) + '）', userAdded: true };
  }
  function addCustomPick() {
    const q = (val('diet_search') || '').trim();
    if (!q) return;
    const food = ucBuildFood(q, 'uc_cat', 'uc_verdict');
    Knowledge.addUserFood(food); Store.addUserFood(food); Store.addPendingFood(q);
    addPick(q);
    toast('已记录「' + q + '」并加入我的食物');
  }
  function addCustomFood() {
    const q = (val('food_q') || '').trim();
    if (!q) return;
    const food = ucBuildFood(q, 'uc_cat_f', 'uc_verdict_f');
    Knowledge.addUserFood(food); Store.addUserFood(food); Store.addPendingFood(q);
    foodSearch();
    toast('已加入我的食物');
  }

  // ---------- 饮水 ----------
  function openWaterForm() {
    let html = '<h2>' + icon('drop', 18, 'h2-ico') + '饮水记录</h2>';
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
    let html = '<h2>' + icon('pill', 18, 'h2-ico') + '用药记录</h2>';
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
    let html = '<h2>' + icon('note', 18, 'h2-ico') + '文字备注</h2>';
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
    let html = '<h2>' + icon('file', 18, 'h2-ico') + '上传检查报告</h2>';
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
    let html = '<div class="card"><div class="row-between"><h2>' + icon('file', 18, 'h2-ico') + '检查报告</h2><button class="btn secondary sm" onclick="App.openReportForm()">＋上传</button></div></div>';
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
    let html = '<h2>' + icon('file', 18, 'h2-ico') + '' + esc(r.type) + '</h2>';
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
    let head = '<div class="card"><h2>' + icon('search', 18, 'h2-ico') + '饮食查询</h2>';
    const conds = Knowledge.getConditions(p);
    const condText = conds.length ? conds.map(function (c) {
      if (c.id === 'kidney_stone') return '肾结石（' + stoneLabel(c.stoneType) + '）';
      if (c.id === 'wisdom_tooth') return '智齿发炎（' + ((Knowledge.CONDITIONS.wisdom_tooth.stages[c.stage] || {}).name || '发炎期') + '）';
      if (c.id === 'hypertension') return '高血压' + (c.meds && c.meds.length ? '（服药）' : '');
      return c.id;
    }).join('、') : '未选择病种（按通用参考）';
    head += '<p class="muted">输入食物名，查看「能不能吃」及原因。当前按：<b>' + esc(condText) + '</b> 判断。</p></div>';
    head += '<div class="search-box"><span class="si">' + icon('search', 16) + '</span><input type="text" id="food_q" placeholder="输入食物，如 菠菜" oninput="App.foodSearch()"></div>';
    head += '<div id="food_list"></div>';
    view.innerHTML = head;
    foodSearch();
  }
  function foodSearch() {
    const p = Store.getProfile();
    const conds = Knowledge.getConditions(p);
    const q = (val('food_q') || '').trim();
    const box = $('#food_list'); if (!box) return;
    let list;
    if (!q) {
      list = Knowledge.FOODS.slice(0, 40);
    } else {
      list = Knowledge.searchFoods(q);
      const whole = Knowledge.analyzeDish(q).whole;
      if (whole && list.indexOf(whole) < 0) list = [whole].concat(list);
    }
    if (!list.length) {
      box.innerHTML = '<div class="empty"><div class="em-ico">' + icon('search', 40) + '</div><p>没找到「' + esc(q) + '」</p>' +
        '<p class="muted">换个名字试试，或从下面常见的里面选</p></div>' + hotFoodHtml() + unrecCardHtml(q, 'food');
      Store.addPendingFood(q);
      return;
    }
    let pre = '';
    if (!q) pre = '<div class="muted" style="margin:2px 2px 8px">下面是常见食物，也可以直接搜菜名（如 番茄鸡蛋汤）</div>';
    box.innerHTML = pre + list.slice(0, 40).map(function (f) {
      const j = Knowledge.judge(f, conds);
      let reasonHtml = '';
      if (j.reasons && j.reasons.length) {
        reasonHtml = '<div class="food-reason">' + j.reasons.map(function (r) { return esc(r.conditionName + (r.stageName ? '（' + r.stageName + '）' : '') + '：' + r.note); }).join('；') + '</div>';
      }
      let recHtml = '';
      if (j.recommendReasons && j.recommendReasons.length) {
        recHtml = '<div class="food-reason rec">推荐理由：' + j.recommendReasons.map(function (r) { return esc(r.conditionName + '：' + r.note); }).join('；') + '</div>';
      }
      const catTx = f.cat + ((f.alias && f.alias.length) ? ' · 也叫 ' + f.alias.join('、') : '');
      return '<div class="food-item"><div class="food-main"><div class="food-name">' + esc(f.name) + '</div><div class="food-cat">' + esc(catTx) + '</div><div class="food-note">' + esc(f.note) + '</div>' + reasonHtml + recHtml + '</div><span class="badge ' + j.verdict + '">' + j.label + '</span>' + (j.recommended ? '<span class="badge recommend">推荐</span>' : '') + '</div>';
    }).join('');
  }
  // 常见食物快捷入口（空结果 / 引导用）
  function hotFoodHtml() {
    const hot = ['菠菜', '牛奶', '豆腐', '啤酒', '坚果', '巧克力', '番茄', '虾', '辣椒', '咖啡'];
    return '<div class="chip-row" style="justify-content:center;margin-top:4px">' + hot.map(function (n) {
      return '<span class="chip" onclick="App.setFoodQ(\'' + n + '\')">' + n + '</span>';
    }).join('') + '</div>';
  }
  function setFoodQ(n) {
    const el = document.getElementById('food_q');
    if (!el) return;
    el.value = n;
    foodSearch();
  }

  // ---------- 我的 ----------
  function renderMe() {
    const p = Store.getProfile();
    const reports = Store.getReports();
    let html = '';
    html += '<div class="card card-hero" onclick="App.openProfileForm()" style="cursor:pointer"><div class="row-between"><h2>' + icon('user', 18, 'h2-ico') + '个人档案</h2><span class="muted">编辑 ›</span></div>';
    if (p) {
      html += '<div class="profile-line"><b>' + esc(p.name || '未填姓名') + '</b>' + (p.gender ? ' · ' + esc(p.gender) : '') + (p.age ? ' · ' + esc(p.age) + '岁' : '') + '</div>';
      html += '<div class="muted">诊断：' + esc(p.diagnosis || '肾结石') + (p.affectedSide ? '（' + esc(p.affectedSide) + '）' : '') + '</div>';
      html += '<div class="muted">手术日期：' + esc(p.surgeryDate || '未填') + (p.surgeryType ? ' · ' + esc(p.surgeryType) : '') + '</div>';
      const conds = Knowledge.getConditions(p);
      if (conds.length) {
        conds.forEach(function (c) {
          if (c.id === 'kidney_stone') {
            html += '<div class="muted">肾结石 · ' + stoneLabel(c.stoneType) + (c.surgeryDate ? (' · 手术 ' + esc(c.surgeryDate)) : '') + '</div>';
          } else if (c.id === 'wisdom_tooth') {
            const st = stageName(c.stage);
            html += '<div class="muted">智齿发炎 · ' + esc(st) + (c.meds && c.meds.length ? (' · 服' + esc(c.meds.join('、'))) : '') + '</div>';
            html += '<div class="quick-row">' +
              '<span class="quick-chip" onclick="event.stopPropagation();App.quickEditStage()">阶段：' + esc(st) + '</span>' +
              '<span class="quick-chip" onclick="event.stopPropagation();App.quickEditMeds()">用药：' + (c.meds && c.meds.length ? esc(c.meds.join('、')) : '无') + '</span>' +
              '</div>';
          } else if (c.id === 'hypertension') {
            html += '<div class="muted">高血压' + (c.meds && c.meds.length ? (' · 服' + esc(c.meds.join('、'))) : ' · 未登记用药') + '</div>';
            html += '<div class="quick-row">' +
              '<span class="quick-chip" onclick="event.stopPropagation();App.quickEditBpMeds()">用药：' + (c.meds && c.meds.length ? esc(c.meds.join('、')) : '无') + '</span>' +
              '</div>';
          }
        });
      } else {
        html += '<div class="muted">未选择病种，点此完善</div>';
      }
      const meHasKidney = conds.some(function (c) { return c.id === 'kidney_stone'; });
      if (meHasKidney) html += '<div class="muted">饮水目标：' + (p.waterGoal || 2000) + 'ml/天</div>';
      if (p.updatedAt) {
        html += '<div class="muted" style="font-size:12px">档案更新于 ' + esc(updatedAgo(p.updatedAt)) + '</div>';
      }
    } else {
      html += '<div class="muted">尚未填写，点此完善（建议必填手术日期与结石类型）</div>';
    }
    html += '</div>';

    html += '<div class="sec-title">健康资料</div>';
    html += '<div class="card" onclick="App.openReportOCR()" style="cursor:pointer"><div class="row-between"><h2>' + icon('hospital', 18, 'h2-ico') + '出院记录识别</h2><span class="muted">自动填档 ›</span></div><div class="muted">拍照或粘贴出院记录文字，自动提取信息填入个人档案与报告。</div></div>';

    html += '<div class="card" onclick="App.openReports()" style="cursor:pointer"><div class="row-between"><h2>' + icon('file', 18, 'h2-ico') + '检查报告</h2><span class="muted">' + reports.length + ' 份 ›</span></div><div class="muted">上传报告图片与关键指标，随时回看</div></div>';

    /* AI-BEGIN */
    const ai = Store.getAIConfig();
    const aiStatus = (ai.enabled && ai.apiKey) ? '已启用' : '未启用';
    html += '<div class="card" onclick="App.openAISettings()" style="cursor:pointer"><div class="row-between"><h2>' + icon('chat', 18, 'h2-ico') + 'AI 助手设置</h2><span class="muted">' + aiStatus + ' ›</span></div><div class="muted">接入大模型后可自由提问、解读报告。默认关闭，启用需填写 API Key，数据策略本地优先。</div></div>';
    /* AI-END */

    html += '<div class="sec-title">数据与设置</div>';
    html += '<div class="card"><h2>' + icon('save', 18, 'h2-ico') + '数据备份</h2><p class="muted">数据只存在本机。换手机前请导出备份，再导入新手机。</p>';
    html += '<div style="display:flex;gap:8px"><button class="btn secondary sm" onclick="App.exportBackup()">导出备份</button><button class="btn secondary sm" onclick="App.importBackup()">导入备份</button></div></div>';

    html += '<div class="card"><h2>' + icon('info', 18, 'h2-ico') + '关于与免责</h2><p class="muted" style="white-space:pre-line">' + esc(String(Advice.DISCLAIMER || '').replace(/^⚠️\s*/, '')) + '\n\n所有数据仅保存在你的本机，不会上传任何服务器。</p></div>';

    const pend = Store.getPendingFoods().filter(function (w) { return !Knowledge.isKnown(w); });
    if (pend.length) {
      html += '<div class="card"><h2>' + icon('note', 18, 'h2-ico') + '待补充食物</h2><p class="muted">你在记饮食/查询时搜不到、已自动收集的词（共 ' + pend.length + ' 条，已补入食物库的自动隐藏）。可把这些词告诉开发者，批量补入正式食物库：</p>' +
        '<div class="chip-row" style="justify-content:flex-start;flex-wrap:wrap">' + pend.map(function (w) { return '<span class="chip">' + esc(w) + '</span>'; }).join('') + '</div></div>';
    }

    html += '<div class="card"><h2>' + icon('pin', 18, 'h2-ico') + '应用版本</h2><p class="muted">当前版本 <b>' + APP_VERSION + '</b>。若与最新发布版本不符，请完全关闭应用后重新打开（或下拉刷新）以加载新版本。</p></div>';
    view.innerHTML = html;
  }
  function openProfileForm() {
    const p = Store.getProfile() || {};
    const conds = (p.conditions && p.conditions.length) ? p.conditions
      : (p.stoneType ? [{ id: 'kidney_stone', stoneType: p.stoneType, surgeryDate: p.surgeryDate, surgeryType: p.surgeryType, affectedSide: p.affectedSide }] : []);
    const hasKidney = conds.some(function (c) { return c.id === 'kidney_stone'; });
    const hasTooth = conds.some(function (c) { return c.id === 'wisdom_tooth'; });
    const hasHyper = conds.some(function (c) { return c.id === 'hypertension'; });
    const kc = conds.find(function (c) { return c.id === 'kidney_stone'; }) || {};
    const tc = conds.find(function (c) { return c.id === 'wisdom_tooth'; }) || {};
    const hc = conds.find(function (c) { return c.id === 'hypertension'; }) || {};
    const hmeds = hc.meds || [];
    const st = kc.stoneType || 'unknown';
    const side = kc.affectedSide || '';
    const tstage = tc.stage || 'inflammation';
    const tmeds = tc.meds || [];
    const tmedsEnd = tc.medsEnd || '';
    let html = '<h2>' + icon('user', 18, 'h2-ico') + '个人档案</h2>';
    html += field('姓名', '<input type="text" id="p_name" value="' + esc(p.name || '') + '" placeholder="选填">');
    html += '<div class="field"><label>性别</label><div class="chip-row">' + chips('gender', ['男', '女'], p.gender || '') + '</div></div>';
    html += field('年龄', '<input type="number" id="p_age" value="' + esc(p.age || '') + '" placeholder="岁" inputmode="numeric">');
    // 病种多选
    html += '<div class="field"><label>我的病种（可多选）</label>' +
      '<label class="chk"><input type="checkbox" name="cond" value="kidney_stone"' + (hasKidney ? ' checked' : '') + ' onchange="App.toggleCondFields()"> 肾结石</label>' +
      '<label class="chk"><input type="checkbox" name="cond" value="wisdom_tooth"' + (hasTooth ? ' checked' : '') + ' onchange="App.toggleCondFields()"> 智齿发炎</label>' +
      '<label class="chk"><input type="checkbox" name="cond" value="hypertension"' + (hasHyper ? ' checked' : '') + ' onchange="App.toggleCondFields()"> 高血压</label></div>';
    // 肾结石字段（标题条 + 青色底；饮水目标属肾结石专属，一并放进本块）
    let kHtml = '<div class="cond-head kidney">肾结石</div>';
    kHtml += field('手术日期', '<input type="date" id="p_surgery" value="' + esc(kc.surgeryDate || '') + '">');
    kHtml += field('手术方式', '<input type="text" id="p_surgery_type" value="' + esc(kc.surgeryType || '') + '" placeholder="如 经尿道输尿管软镜钬激光碎石术">');
    kHtml += '<div class="field"><label>结石类型</label><select id="p_stone">' +
      '<option value="unknown"' + (st === 'unknown' ? ' selected' : '') + '>未知</option>' +
      '<option value="calcium"' + (st === 'calcium' ? ' selected' : '') + '>草酸钙结石</option>' +
      '<option value="uric"' + (st === 'uric' ? ' selected' : '') + '>尿酸结石</option>' +
      '<option value="other"' + (st === 'other' ? ' selected' : '') + '>其他</option></select></div>';
    kHtml += '<div class="field"><label>患病侧</label><select id="p_side">' +
      '<option value=""' + (side === '' ? ' selected' : '') + '>未知</option>' +
      '<option value="左侧"' + (side === '左侧' ? ' selected' : '') + '>左侧</option>' +
      '<option value="右侧"' + (side === '右侧' ? ' selected' : '') + '>右侧</option>' +
      '<option value="双侧"' + (side === '双侧' ? ' selected' : '') + '>双侧</option></select></div>';
    kHtml += field('饮水目标(ml/天)', '<input type="number" id="p_water" value="' + (p.waterGoal || 2000) + '" inputmode="numeric">');
    html += '<div id="kidney_fields" class="cond-block kidney"' + (hasKidney ? '' : ' style="display:none"') + '>' + kHtml + '</div>';
    // 智齿字段（标题条 + 橙色底）
    let tHtml = '<div class="cond-head tooth">智齿发炎</div>';
    const stages = [['inflammation', '发炎期'], ['post_extraction', '拔牙后'], ['recovery', '恢复期']];
    tHtml += '<div class="field"><label>当前阶段</label><div class="chip-row">' + stages.map(function (s) {
      const sel = (tstage === s[0]) ? ' checked' : '';
      return '<label class="chip' + (tstage === s[0] ? ' sel' : '') + '" onclick="App.pickChip(this)"><input type="radio" name="tstage" value="' + s[0] + '"' + sel + '>' + s[1] + '</label>';
    }).join('') + '</div></div>';
    tHtml += '<div class="field"><label>正在服用的消炎药</label>' +
      '<label class="chk"><input type="checkbox" name="tmeds" value="甲硝唑"' + (tmeds.indexOf('甲硝唑') >= 0 ? ' checked' : '') + '> 甲硝唑</label>' +
      '<label class="chk"><input type="checkbox" name="tmeds" value="头孢"' + (tmeds.indexOf('头孢') >= 0 ? ' checked' : '') + '> 头孢</label></div>';
    tHtml += field('消炎药预计用到', '<input type="date" id="p_meds_end" value="' + esc(tmedsEnd) + '">');
    tHtml += '<div class="muted" style="font-size:12px;margin-top:-2px">到期只会在首页提醒你确认，不会自动停药。</div>';
    html += '<div id="tooth_fields" class="cond-block tooth"' + (hasTooth ? '' : ' style="display:none"') + '>' + tHtml + '</div>';
    // 高血压字段（标题条 + 红色底）
    let hHtml = '<div class="cond-head hypertension">高血压</div>';
    hHtml += '<div class="field"><label>正在服用的降压药（选填；登记后启用"西柚/柚子红线"提醒）</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="钙拮抗剂(氨氯地平等)"' + (hmeds.indexOf('钙拮抗剂(氨氯地平等)') >= 0 ? ' checked' : '') + '> 钙拮抗剂(氨氯地平等)</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="ACEI(依那普利等)"' + (hmeds.indexOf('ACEI(依那普利等)') >= 0 ? ' checked' : '') + '> ACEI(依那普利等)</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="ARB(氯沙坦等)"' + (hmeds.indexOf('ARB(氯沙坦等)') >= 0 ? ' checked' : '') + '> ARB(氯沙坦等)</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="利尿剂(氢氯噻嗪等)"' + (hmeds.indexOf('利尿剂(氢氯噻嗪等)') >= 0 ? ' checked' : '') + '> 利尿剂(氢氯噻嗪等)</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="β阻滞剂(美托洛尔等)"' + (hmeds.indexOf('β阻滞剂(美托洛尔等)') >= 0 ? ' checked' : '') + '> β阻滞剂(美托洛尔等)</label>' +
      '<label class="chk"><input type="checkbox" name="hmeds" value="其他"' + (hmeds.indexOf('其他') >= 0 ? ' checked' : '') + '> 其他</label></div>';
    hHtml += '<div class="muted" style="font-size:12px;margin-top:-2px">当前未登记药物时，西柚红线不会触发；一旦开始服药请回来勾选，以便获得危险交互提醒。</div>';
    html += '<div id="hypertension_fields" class="cond-block hypertension"' + (hasHyper ? '' : ' style="display:none"') + '>' + hHtml + '</div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveProfile()">保存</button></div>';
    openModal(html);
  }
  function saveProfile() {
    const p = Store.getProfile() || {};
    p.name = val('p_name').trim();
    p.gender = checked('gender');
    p.age = val('p_age').trim();
    const oldConds = p.conditions || [];
    const cdVals = checkedValues('cond');
    const conds = [];
    if (cdVals.indexOf('kidney_stone') >= 0) {
      const stoneType = val('p_stone');
      conds.push({ id: 'kidney_stone', stoneType: stoneType, surgeryDate: val('p_surgery'), surgeryType: val('p_surgery_type').trim(), affectedSide: val('p_side'), stage: 'post_surgery' });
      p.stoneType = stoneType; p.surgeryDate = val('p_surgery'); p.surgeryType = val('p_surgery_type').trim(); p.affectedSide = val('p_side');
      // 饮水目标仅在勾选肾结石时更新，避免取消勾选后被默认 2000 覆盖
      p.waterGoal = Number(val('p_water')) || p.waterGoal || 2000;
    } else {
      delete p.stoneType; delete p.surgeryDate; delete p.surgeryType; delete p.affectedSide;
    }
    if (cdVals.indexOf('wisdom_tooth') >= 0) {
      // startDate 保留首次填写值，避免每次保存都被重置成今天
      const oldT = oldConds.filter(function (c) { return c.id === 'wisdom_tooth'; })[0] || {};
      conds.push({
        id: 'wisdom_tooth',
        stage: checked('tstage') || 'inflammation',
        meds: checkedValues('tmeds'),
        medsEnd: val('p_meds_end') || '',
        startDate: oldT.startDate || Store.todayStr()
      });
    }
    if (cdVals.indexOf('hypertension') >= 0) {
      const oldH = oldConds.filter(function (c) { return c.id === 'hypertension'; })[0] || {};
      conds.push({
        id: 'hypertension',
        meds: checkedValues('hmeds'),
        startDate: oldH.startDate || Store.todayStr()
      });
    }
    p.conditions = conds;
    p.diagnosis = conds.map(function (c) {
      if (c.id === 'kidney_stone') return '肾结石';
      if (c.id === 'wisdom_tooth') return '智齿发炎';
      if (c.id === 'hypertension') return '高血压';
      return c.id;
    }).join('、') || '未明确';
    p.updatedAt = new Date().toISOString();
    Store.saveProfile(p);
    closeModal(); toast('已保存档案'); go('me');
  }

  // ---------- 病种状态快速更新（不必打开完整档案表单） ----------
  function updatedAgo(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '未知';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 30) return days + ' 天前';
    return Math.floor(days / 30) + ' 个月前';
  }
  function findToothCond(p) {
    return ((p && p.conditions) || []).filter(function (c) { return c.id === 'wisdom_tooth'; })[0] || null;
  }
  function stageName(s) {
    return (Knowledge.CONDITIONS.wisdom_tooth.stages[s] || {}).name || '发炎期';
  }
  function quickEditStage() {
    const p = Store.getProfile() || {};
    const tc = findToothCond(p);
    if (!tc) { toast('请先在档案里勾选「智齿发炎」'); return; }
    const stages = [['inflammation', '发炎期'], ['post_extraction', '拔牙后'], ['recovery', '恢复期']];
    const cur = tc.stage || 'inflammation';
    let html = '<h2>' + icon('shield', 18, 'h2-ico') + '更新智齿阶段</h2>';
    html += '<div class="field"><label>当前阶段</label><div class="chip-row">' + stages.map(function (s) {
      return '<label class="chip' + (cur === s[0] ? ' sel' : '') + '" onclick="App.pickChip(this)"><input type="radio" name="qstage" value="' + s[0] + '"' + (cur === s[0] ? ' checked' : '') + '>' + s[1] + '</label>';
    }).join('') + '</div></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveQuickStage()">保存</button></div>';
    openModal(html);
  }
  function saveQuickStage() {
    const p = Store.getProfile() || {};
    const tc = findToothCond(p);
    if (!tc) { closeModal(); return; }
    tc.stage = checked('qstage') || tc.stage;
    p.updatedAt = new Date().toISOString();
    Store.saveProfile(p);
    closeModal(); toast('阶段已更新为「' + stageName(tc.stage) + '」'); go('me');
  }
  function quickEditMeds() {
    const p = Store.getProfile() || {};
    const tc = findToothCond(p);
    if (!tc) { toast('请先在档案里勾选「智齿发炎」'); return; }
    const meds = tc.meds || [];
    let html = '<h2>' + icon('pill', 18, 'h2-ico') + '更新消炎药</h2>';
    html += '<div class="field"><label>正在服用</label>' +
      '<label class="chk"><input type="checkbox" name="qmeds" value="甲硝唑"' + (meds.indexOf('甲硝唑') >= 0 ? ' checked' : '') + '> 甲硝唑</label>' +
      '<label class="chk"><input type="checkbox" name="qmeds" value="头孢"' + (meds.indexOf('头孢') >= 0 ? ' checked' : '') + '> 头孢</label></div>';
    html += field('预计用到', '<input type="date" id="q_meds_end" value="' + esc(tc.medsEnd || '') + '">');
    html += '<div class="muted" style="font-size:12px">到期只会在首页提醒你确认，不会自动停药。</div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveQuickMeds()">保存</button></div>';
    openModal(html);
  }
  function saveQuickMeds() {
    const p = Store.getProfile() || {};
    const tc = findToothCond(p);
    if (!tc) { closeModal(); return; }
    tc.meds = checkedValues('qmeds');
    tc.medsEnd = val('q_meds_end') || '';
    p.updatedAt = new Date().toISOString();
    Store.saveProfile(p);
    closeModal(); toast('用药已更新'); go('me');
  }
  // 消炎药到期提醒：只提示，绝不自动改医疗设置
  function medsExpiryNotice() {
    const p = Store.getProfile();
    if (!p) return '';
    const tc = findToothCond(p);
    if (!tc) return '';
    const meds = tc.meds || [];
    if (!meds.length || !tc.medsEnd) return '';
    if (tc.medsEnd > Store.todayStr()) return '';
    return '<div class="advice notice"><div class="a-title">' + icon('pill', 16, 'h2-ico') + '消炎药已到期</div>' +
      '<div class="a-text">你设置的消炎药（' + esc(meds.join('、')) + '）预计用到 ' + esc(tc.medsEnd) + '，现在已经到期。\n还在继续吃吗？</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button class="btn secondary sm" onclick="App.stopMeds()">已停药</button>' +
      '<button class="btn secondary sm" onclick="App.quickEditMeds()">还在吃，改日期</button></div></div>';
  }
  function stopMeds() {
    const p = Store.getProfile() || {};
    const tc = findToothCond(p);
    if (!tc) return;
    tc.meds = [];
    tc.medsEnd = '';
    p.updatedAt = new Date().toISOString();
    Store.saveProfile(p);
    toast('已标记为停药'); go('advice');
  }
  function findHyperCond(p) {
    return ((p && p.conditions) || []).filter(function (c) { return c.id === 'hypertension'; })[0] || null;
  }
  function quickEditBpMeds() {
    const p = Store.getProfile() || {};
    const hc = findHyperCond(p);
    if (!hc) { toast('请先在档案里勾选「高血压」'); return; }
    const meds = hc.meds || [];
    let html = '<h2>' + icon('pill', 18, 'h2-ico') + '更新降压药</h2>';
    html += '<div class="field"><label>正在服用（选填）</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="钙拮抗剂(氨氯地平等)"' + (meds.indexOf('钙拮抗剂(氨氯地平等)') >= 0 ? ' checked' : '') + '> 钙拮抗剂(氨氯地平等)</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="ACEI(依那普利等)"' + (meds.indexOf('ACEI(依那普利等)') >= 0 ? ' checked' : '') + '> ACEI(依那普利等)</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="ARB(氯沙坦等)"' + (meds.indexOf('ARB(氯沙坦等)') >= 0 ? ' checked' : '') + '> ARB(氯沙坦等)</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="利尿剂(氢氯噻嗪等)"' + (meds.indexOf('利尿剂(氢氯噻嗪等)') >= 0 ? ' checked' : '') + '> 利尿剂(氢氯噻嗪等)</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="β阻滞剂(美托洛尔等)"' + (meds.indexOf('β阻滞剂(美托洛尔等)') >= 0 ? ' checked' : '') + '> β阻滞剂(美托洛尔等)</label>' +
      '<label class="chk"><input type="checkbox" name="qhmeds" value="其他"' + (meds.indexOf('其他') >= 0 ? ' checked' : '') + '> 其他</label></div>';
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.saveQuickBpMeds()">保存</button></div>';
    openModal(html);
  }
  function saveQuickBpMeds() {
    const p = Store.getProfile() || {};
    const hc = findHyperCond(p);
    if (!hc) { closeModal(); return; }
    hc.meds = checkedValues('qhmeds');
    p.updatedAt = new Date().toISOString();
    Store.saveProfile(p);
    closeModal(); toast('降压药已更新'); go('me');
  }

  // ---------- 时间线 ----------
  function renderTimeline() {
    const list = Store.getTimeline().slice().sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    if (!list.length) {
      view.innerHTML = '<div class="empty"><div class="em-ico">' + icon('calendar', 44) + '</div><p>还没有记录</p>' +
        '<p class="muted">点底部「＋」开始记录你的症状、饮食、饮水…</p>' +
        '<div style="margin-top:16px"><button class="btn sm" style="width:auto;padding:0 24px" onclick="App.go(\'record\')">去记录</button></div></div>';
      playViewAnim();
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
    const meta = EVT[ev.type] || { ico: 'info', label: ev.type };
    const d = ev.detail || {};
    let title = meta.label, sub = '', rawSub = false;
    if (ev.type === 'symptom') {
      title = '症状';
      sub = '尿色：' + (d.urineColor || '—') + '　疼痛：' + (d.pain || '—') + '　发热：' + (d.fever || '—');
      if (d.note) sub += '\n' + d.note;
    } else if (ev.type === 'diet') {
      title = '饮食' + (d.meal ? (' · ' + d.meal) : '');
      const foods = d.foods || [];
      if (foods.length) {
        const conds = Knowledge.getConditions(Store.getProfile());
        sub = foods.map(function (f) {
          const info = Knowledge.findFood(f.name);
          let v = 'ok', reasons = [], rec = false;
          if (info) { const j = Knowledge.judge(info, conds); v = j.verdict; reasons = j.reasons; rec = j.recommended; }
          const rn = reasons.length ? ' <span class="tl-reason">因' + reasons.map(function (r) { return r.conditionName + (r.stageName ? '（' + r.stageName + '）' : ''); }).join('、') + '</span>' : '';
          const recBadge = rec ? '<span class="badge recommend">推荐</span>' : '';
          return '<span class="badge ' + v + '">' + Knowledge.verdictLabel(v) + '</span>' + recBadge + esc(f.name) + rn;
        }).join(' ');
        rawSub = true;
      }
      if (d.note) sub += (sub ? '<br>' : '') + esc(d.note);
    } else if (ev.type === 'water') {
      title = '饮水'; sub = (d.amount || 0) + 'ml · ' + (d.wtype || '');
    } else if (ev.type === 'med') {
      title = '用药'; sub = (d.name || '') + (d.dose ? (' · ' + d.dose) : '');
      if (d.note) sub += '\n' + d.note;
    } else if (ev.type === 'note') {
      title = '备注'; sub = d.text || '';
    }
    return '<div class="tl-item"><div class="tl-ico">' + icon(meta.ico, 20) + '</div><div class="tl-body"><div class="tl-title">' + title + (ev.time ? (' · ' + esc(ev.time)) : '') + '</div><div class="tl-sub">' + (rawSub ? sub : esc(sub)) + '</div></div><button class="tl-del" onclick="App.delEvent(\'' + ev.id + '\')">' + icon('trash', 18) + '</button></div>';
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

  /* AI-BEGIN */
  // ---------- AI 助手（预留接入，默认关闭） ----------
  function openAIChat() {
    const cfg = Store.getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      openModal('<h2>' + icon('chat', 18, 'h2-ico') + 'AI 助手</h2>' +
        '<p class="muted">你还没有启用 AI 助手。请先到「我的 → AI 助手设置」中开启并填写 API Key。</p>' +
        '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">关闭</button><button class="btn" onclick="App.closeModal();App.go(\'me\')">去设置</button></div>');
      return;
    }
    let html = '<h2>' + icon('chat', 18, 'h2-ico') + '问问 AI 助手</h2>';
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
        chat.innerHTML += '<div class="ai-msg bot err">' + esc(r.message) + '</div>';
      }
    } catch (e) {
      loading.remove();
      chat.innerHTML += '<div class="ai-msg bot err">出错了：' + esc((e && e.message) || '未知错误') + '</div>';
    }
    chat.scrollTop = chat.scrollHeight;
  }
  function openAISettings() {
    const c = Store.getAIConfig();
    let html = '<h2>' + icon('chat', 18, 'h2-ico') + 'AI 助手设置</h2>';
    html += '<div class="ai-warn">API Key 仅保存在你本机浏览器，不会上传到本应用服务器。但调用时你的问题内容会发送给你所填的 AI 服务商。请仅使用你信任的服务，并妥善保管 Key，不要泄露。</div>';
    html += field('启用 AI 助手',
      '<label class="switch-row"><input type="checkbox" id="ai_enabled"' + (c.enabled ? ' checked' : '') + '><span class="switch"></span></label>');
    html += field('API 地址（Base URL）', '<input type="text" id="ai_base" value="' + esc(c.apiBase) + '" placeholder="如 https://api.deepseek.com/v1">');
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

  /* AI-END */
  // ---------- 出院记录识别 ----------
  function openReportOCR() {
    let html = '<h2>' + icon('hospital', 18, 'h2-ico') + '出院记录识别</h2>';
    /* AI-BEGIN */
    html += '<div class="ocr-warn">为保护隐私，识别过程在本地完成；若开启 AI，仅当点击「用 AI 解析」时才会发送报告文字。不会上传图片。</div>';
    /* AI-ELSE */
    html += '<div class="ocr-warn">识别过程完全在本机完成，不会上传任何内容。</div>';
    /* AI-END */
    html += '<div class="field"><label>拍照/上传出院记录</label><input type="file" id="ocr_img" accept="image/*" onchange="App.ocrPreview(this)"></div>';
    html += '<div id="ocr_prev"></div>';
    html += '<div class="field"><label>或粘贴报告文字（可先用微信/扫描软件识别文字后粘贴）</label><textarea id="ocr_text" placeholder="粘贴出院记录全文…"></textarea></div>';
    /* AI-BEGIN */
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn secondary" onclick="App.parseReportText(false)">本地规则解析</button><button class="btn" onclick="App.parseReportText(true)">用 AI 解析</button></div>';
    /* AI-ELSE */
    html += '<div class="modal-actions"><button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn secondary" onclick="App.parseReportText(false)">本地规则解析</button></div>';
    /* AI-END */
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

    let data = localParseReport(text);
    /* AI-BEGIN */
    if (useAI) {
      const r = await AI.parseReport(text);
      if (!r.ok) {
        if (resultBox) resultBox.innerHTML = '<div class="ocr-error">' + esc(r.message) + '</div>';
        return;
      }
      data = r.data;
    }
    /* AI-END */
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
    // 出院记录识别以肾结石为主，保留已有其他病种（如智齿）
    const existing = (p.conditions && p.conditions.length) ? p.conditions.filter(function (c) { return c.id !== 'kidney_stone'; }) : [];
    existing.push({ id: 'kidney_stone', stoneType: p.stoneType || 'unknown', surgeryDate: normalizeDate(data.surgeryDate), surgeryType: p.surgeryType, affectedSide: p.affectedSide, stage: 'post_surgery' });
    p.conditions = existing;
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
  function quickDiet() { openForm('diet'); }
  // 首页饮水卡：一键加水，不走弹窗
  function quickAddWater(amount) {
    Store.addEvent({
      type: 'water', date: today(), time: now(),
      detail: { amount: amount, wtype: '白开水' }
    });
    toast('已记饮水 ' + amount + 'ml');
    render();
  }
  // 警示条「看详情」：展开折叠区并滚到可见位置
  function showReminders() {
    const d = document.getElementById('reminderFold');
    if (!d) return;
    d.open = true;
    try { d.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (e) { d.scrollIntoView(); }
  }

  // ---------- init ----------
  function init() {
    // 载入用户自定义食物，使搜索/判定立即生效
    try { Knowledge.mergeUserFoods(Store.getUserFoods()); } catch (e) {}
    $$('.tab').forEach(function (t) { t.addEventListener('click', function () { go(t.dataset.tab); }); });
    go('advice');
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
          // 主动检查是否有新版本，避免浏览器缓存旧 sw
          reg.update().catch(function () {});
          // 新 SW 接管后自动刷新一次，确保加载到新代码
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('controllerchange', function () {
              if (window.__swReloaded) return;
              window.__swReloaded = true;
              window.location.reload();
            });
          }
        }).catch(function () {});
      });
    }
  }
  init();

  window.App = {
    pickChip: pickChip, go: go, closeModal: closeModal, openForm: openForm,
    toggleCondFields: toggleCondFields,
    saveSymptom: saveSymptom, saveDiet: saveDiet, saveWater: saveWater,
    saveMed: saveMed, saveNote: saveNote,
    dietSearch: dietSearch, addPick: addPick, removePick: removePick, addAllParts: addAllParts,
    previewReport: previewReport, saveReport: saveReport,
    openReportDetail: openReportDetail, delReport: delReport, openReports: openReports,
    foodSearch: foodSearch,
    ucVerdict: ucVerdict, addCustomPick: addCustomPick, addCustomFood: addCustomFood,
    openProfileForm: openProfileForm, saveProfile: saveProfile,
    quickEditStage: quickEditStage, saveQuickStage: saveQuickStage,
    quickEditMeds: quickEditMeds, saveQuickMeds: saveQuickMeds,
    stopMeds: stopMeds,
    quickEditBpMeds: quickEditBpMeds, saveQuickBpMeds: saveQuickBpMeds,
    exportBackup: exportBackup, importBackup: importBackup,
    delEvent: delEvent, quickSymptom: quickSymptom, quickWater: quickWater, quickDiet: quickDiet,
    quickAddWater: quickAddWater, showReminders: showReminders,
    /* AI-BEGIN */
    openAIChat: openAIChat, sendAI: sendAI, aiKey: aiKey,
    openAISettings: openAISettings, saveAISettings: saveAISettings,
    /* AI-END */
    openReportOCR: openReportOCR, ocrPreview: ocrPreview,
    parseReportText: parseReportText, applyParsedProfile: applyParsedProfile
  };
})();
