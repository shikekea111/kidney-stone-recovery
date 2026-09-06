// ai.js - AI 接入层（预留，默认关闭）
// 设计原则：本地优先、数据安全
//  - 仅当用户在「我的」中明确启用并填写 API Key 后才会联网
//  - 每次调用只发送「当次问题 + 脱敏后的个人档案摘要（近7天结构化记录）」，
//    不发送历史对话、不上传报告图片
//  - 接口采用 OpenAI Chat Completions 格式，可兼容 DeepSeek / 通义 / 豆包 / OpenAI 等
(function (global) {
  'use strict';

  const SYS = '你是「能吃吗」多病种饮食宜忌助手的健康顾问，服务于患有多种常见病（如肾结石术后、智齿发炎等）的康复用户。' +
    '请基于用户提供的个人档案与健康记录摘要作答，给出简明、可操作、安全的建议。' +
    '规则：1) 必须提醒这不能替代医生诊断；2) 若出现剧烈腰腹疼痛、发热、持续或反复血尿、排尿困难，应建议尽快就医；' +
    '3) 用中文、分点、口语化，避免长篇大论；4) 不要编造医学结论，不确定时建议就医或咨询主刀医生。';

  function profileSummary() {
    const p = Store.getProfile() || {};
    const tl = Store.getTimeline() || [];
    const stoneMap = { unknown: '未知', calcium: '草酸钙结石', uric: '尿酸结石', other: '其他' };
    const lines = [];
    lines.push('【用户档案】');
    lines.push('诊断：' + (p.diagnosis || '肾结石'));
    lines.push('结石类型：' + (stoneMap[p.stoneType] || '未知'));
    if (p.surgeryDate) {
      const ds = Advice.daysSince(p.surgeryDate);
      lines.push('手术日期：' + p.surgeryDate + (ds !== null && ds >= 0 ? ('（约术后第 ' + ds + ' 天）') : ''));
    }
    lines.push('每日饮水目标：' + (p.waterGoal || 2000) + 'ml');

    // 最近 7 天记录（脱敏、结构化，不发送图片与自由文本历史）
    const cut = new Date();
    cut.setDate(cut.getDate() - 7);
    const recent = tl.filter(function (e) {
      return e.date && new Date(e.date + 'T00:00:00') >= cut;
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });

    const sym = recent.filter(function (e) { return e.type === 'symptom'; }).slice(0, 5);
    if (sym.length) {
      lines.push('');
      lines.push('【最近症状记录】');
      sym.forEach(function (e) {
        const d = e.detail || {};
        const parts = [e.date];
        if (d.urineColor) parts.push('尿色:' + d.urineColor);
        if (d.pain) parts.push('疼痛:' + d.pain);
        if (d.fever) parts.push('发热:' + d.fever);
        if (d.note) parts.push(d.note);
        lines.push('• ' + parts.join(' '));
      });
    }
    const diet = recent.filter(function (e) { return e.type === 'diet'; }).slice(0, 8);
    if (diet.length) {
      lines.push('');
      lines.push('【最近饮食记录】');
      diet.forEach(function (e) {
        const foods = (e.detail && e.detail.foods) || [];
        const names = foods.map(function (f) { return f.name; }).join('、');
        const note = e.detail && e.detail.note ? ('（' + e.detail.note + '）') : '';
        lines.push('• ' + e.date + '：' + (names || '无食物') + note);
      });
    }
    return lines.join('\n');
  }

  async function ask(question) {
    const cfg = Store.getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      return { ok: false, code: 'disabled', message: 'AI 尚未启用。请在「我的 → AI 助手设置」中开启并填写 API Key。' };
    }
    const userContent = profileSummary() + '\n\n【用户提问】\n' + question;
    const body = {
      model: cfg.model,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: userContent }
      ],
      temperature: 0.3,
      stream: false
    };
    let res;
    try {
      res = await fetch(cfg.apiBase + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
        body: JSON.stringify(body)
      });
    } catch (e) {
      return { ok: false, code: 'network', message: '网络请求失败（' + ((e && e.message) || '无法连接') + '）。请检查网络与 API 地址，并确认该地址支持跨域(CORS)。' };
    }
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = (j.error && j.error.message) || ''; } catch (err) {}
      return { ok: false, code: 'http' + res.status, message: '接口返回错误 ' + res.status + (detail ? ('：' + detail) : '') };
    }
    try {
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return { ok: false, code: 'empty', message: '接口未返回有效内容。' };
      return { ok: true, message: text.trim() };
    } catch (e) {
      return { ok: false, code: 'parse', message: '返回内容解析失败。' };
    }
  }

  function isConfigured() {
    const cfg = Store.getAIConfig();
    return !!(cfg.enabled && cfg.apiKey);
  }

  // 出院记录/检查报告结构化解析（需启用 AI）
  async function parseReport(rawText) {
    const cfg = Store.getAIConfig();
    if (!cfg.enabled || !cfg.apiKey) {
      return { ok: false, code: 'disabled', message: 'AI 尚未启用。请在「我的 → AI 助手设置」中开启并填写 API Key，或手动粘贴报告文字后使用本地规则解析。' };
    }
    const sys = '你是一名医疗信息提取助手。请从用户提供的出院记录或检查报告文字中，提取结构化信息并以 JSON 返回。' +
      '字段约定：name（姓名）、gender（性别）、age（年龄）、hospitalNo（住院号）、hospital（医院名称）、' +
      'admissionDate（入院时间，尽量格式化为 YYYY-MM-DD）、dischargeDate（出院时间，尽量格式化为 YYYY-MM-DD）、' +
      'diagnosis（主要诊断，合并多条用分号）、surgeryDate（手术日期 YYYY-MM-DD）、surgeryType（手术方式）、' +
      'stoneType（结石成分：calcium/uric/other/unknown，没有明确成分分析则 unknown）、affectedSide（患病侧：左侧/右侧/双侧）、' +
      'memo（出院医嘱/医生叮嘱摘要）、reportNote（报告备注）。' +
      '只返回 JSON，不要解释。若某项未找到，对应字段留空字符串或 unknown。';
    const body = {
      model: cfg.model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: rawText }
      ],
      temperature: 0.1,
      stream: false
    };
    let res;
    try {
      res = await fetch(cfg.apiBase + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
        body: JSON.stringify(body)
      });
    } catch (e) {
      return { ok: false, code: 'network', message: '网络请求失败（' + ((e && e.message) || '无法连接') + '）。' };
    }
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = (j.error && j.error.message) || ''; } catch (err) {}
      return { ok: false, code: 'http' + res.status, message: '接口返回错误 ' + res.status + (detail ? ('：' + detail) : '') };
    }
    try {
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return { ok: false, code: 'empty', message: '接口未返回有效内容。' };
      const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { ok: true, data: parsed };
    } catch (e) {
      return { ok: false, code: 'parse', message: 'AI 返回内容解析失败，请检查网络或换用本地规则解析。' };
    }
  }

  global.AI = {
    ask: ask,
    parseReport: parseReport,
    isConfigured: isConfigured,
    getConfig: function () { return Store.getAIConfig(); }
  };
})(window);
