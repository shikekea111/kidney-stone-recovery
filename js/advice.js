// advice.js - 规则式建议引擎（多病种）
// 基于：个人档案（含多病种 conditions）+ 健康时间线（带时间戳）+ 饮食知识库
(function (global) {
  'use strict';

  const DISCLAIMER = '⚠️ 本应用所有内容仅为健康信息整理与通用建议，不能替代医生的诊断与治疗。' +
    '如出现剧烈疼痛、发热、持续或反复血尿、排尿困难、张口受限伴高热等，请及时就医。';

  function daysSince(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    return diff;
  }
  function ageText(ds) {
    if (ds === 0) return '今天';
    if (ds > 0) return ds + '天前';
    return '未来';
  }

  // ---------- 主入口 ----------
  function buildAdvice(profile, timeline, reports) {
    const out = [];
    const conditions = Knowledge.getConditions(profile);
    if (!conditions.length) {
      out.push({ level: 'info', title: '完善个人档案', text: '建议到「我的」选择你的病种（如肾结石、智齿发炎）并填写相关信息，建议会更精准。' });
    }
    conditions.forEach(function (cond) {
      if (cond.id === 'kidney_stone') kidneyAdvice(out, cond, timeline);
      else if (cond.id === 'wisdom_tooth') toothAdvice(out, cond, timeline);
      else if (cond.id === 'hypertension') hypertensionAdvice(out, cond, timeline);
    });
    // 近期饮食忌口（合并判定，标注原因）
    recentDietAdvice(out, conditions, timeline);
    out.push({ level: 'disclaimer', title: '免责声明', text: DISCLAIMER });
    return out;
  }

  // ---------- 肾结石模块 ----------
  function kidneyAdvice(out, cond, timeline) {
    const surgeryDate = cond.surgeryDate;
    if (surgeryDate) {
      const ds = daysSince(surgeryDate);
      if (ds !== null) {
        if (ds < 0) {
          out.push({ level: 'info', title: '手术日期待确认', text: '你填写的手术日期在未来，请到「我的」核对。' });
        } else if (ds <= 7) {
          out.push({ level: 'warn', title: '术后急性恢复期（第 ' + ds + ' 天）', text: '术后一周内注意休息、多饮水，避免剧烈运动与重体力活；按医嘱服药、换药与复查。' });
        } else if (ds <= 30) {
          out.push({ level: 'info', title: '术后恢复早期（第 ' + ds + ' 天）', text: '可逐步恢复日常活动，但仍避免剧烈运动；保持每日饮水目标，留意尿液情况。' });
        } else if (ds <= 90) {
          out.push({ level: 'info', title: '术后恢复中期（第 ' + ds + ' 天）', text: '身体大多恢复，重点转为预防复发：饮食管理、定期复查、记录尿液与饮水。' });
        } else {
          out.push({ level: 'info', title: '长期管理期（第 ' + ds + ' 天）', text: '结石易复发，请坚持多饮水、按结石类型管理饮食，并定期（如每3-6个月）复查。' });
        }
      }
    } else {
      out.push({ level: 'info', title: '肾结石·完善信息', text: '建议到「我的」填写手术日期与结石类型，术后恢复与复查提醒会更精准。' });
    }

    // 尿液颜色（按最近一条症状事件的日期）
    const symptoms = timeline
      .filter(function (e) { return e.type === 'symptom'; })
      .sort(function (a, b) {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    if (symptoms.length) {
      const last = symptoms[0];
      const d = last.detail || {};
      const ds = daysSince(last.date);
      const when = ageText(ds);
      if (d.urineColor === '发红') {
        let txt = '你于 ' + when + ' 记录尿色发红。术后短期轻微血尿可见，但需观察：是否伴血块、腰腹剧痛、发热？';
        if (ds !== null && ds >= 2) {
          txt += '已过去 ' + ds + ' 天仍未更新，请记录今日尿色；若持续>2天或反复、或伴疼痛发热，尽快复查/就医。';
        } else {
          txt += '请继续每日记录尿色，若增多或出现疼痛发热请及时就医。';
        }
        out.push({ level: 'warn', title: '尿液发红（' + when + '）', text: txt });
      } else if (d.urineColor === '浑浊') {
        out.push({ level: 'info', title: '尿液浑浊（' + when + '）', text: '可能提示感染或结晶，注意有无尿频、尿急、尿痛、发热；如有请就医查尿常规。' });
      } else if (d.urineColor === '深黄') {
        out.push({ level: 'info', title: '尿色偏深（' + when + '）', text: '常见于饮水不足，请增加饮水量，使尿色接近淡黄或清亮。' });
      }
    }

    // 疼痛 / 发热警示
    const alert = symptoms.find(function (s) {
      const d = s.detail || {};
      return d.pain === '重度' || d.fever === '是';
    });
    if (alert) {
      out.push({ level: 'warn', title: '疼痛/发热警示', text: '你记录过腰腹重度疼痛或发热，可能是肾绞痛、尿路感染或梗阻的信号，请尽快就医，不要拖延。' });
    }

    // 饮水
    const today = Store.todayStr();
    const waterEvents = timeline.filter(function (e) { return e.type === 'water' && e.date === today; });
    let total = 0;
    waterEvents.forEach(function (e) { total += Number((e.detail && e.detail.amount) || 0); });
    const goal = (cond.waterGoal) || 2000;
    if (waterEvents.length === 0) {
      out.push({ level: 'info', title: '今日饮水未记录', text: '建议每日饮水 ' + goal + 'ml 以上（使尿色清淡）。点底部「记录」→ 饮水，随时添加。' });
    } else if (total < goal) {
      out.push({ level: 'info', title: '今日饮水 ' + total + 'ml（目标 ' + goal + 'ml）', text: '还差 ' + (goal - total) + 'ml，继续多喝水，少量多次。' });
    } else {
      out.push({ level: 'good', title: '今日饮水达标 ' + total + 'ml', text: '保持！均匀分配在白天，睡前2小时少喝以免夜尿。' });
    }

    // 复查提醒
    if (surgeryDate) {
      const ds = daysSince(surgeryDate);
      if (ds !== null && ds > 0) {
        const nodes = [30, 90, 180, 365];
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (ds < n && ds > n - 14) {
            out.push({ level: 'info', title: '复查提醒', text: '术后约 ' + n + ' 天，建议复查（如尿常规、B超/CT），评估恢复与有无残留或复发。请遵主刀医生安排。' });
            break;
          }
        }
      }
    }
  }

  // ---------- 智齿发炎模块 ----------
  function toothAdvice(out, cond, timeline) {
    const stage = cond.stage || 'inflammation';
    const stageName = (Knowledge.CONDITIONS.wisdom_tooth.stages[stage] || {}).name || '发炎期';
    if (stage === 'inflammation') {
      out.push({ level: 'warn', title: '智齿发炎期护理', text: '以温凉软食为主（粥、蒸蛋、豆腐、土豆泥、南瓜糊等），饭后用温盐水或漱口水漱口、清理盲袋残渣；用健侧咀嚼。若出现明显肿痛、张口受限、发热，及时到口腔科就诊。' });
    } else if (stage === 'post_extraction') {
      out.push({ level: 'warn', title: '拔牙后护理', text: '拔牙后 24 小时内不漱口、不用吸管、不吃热食与过硬食物，咬住纱布止血；肿胀可冰敷。遵医嘱服药。若剧痛、口臭、发热，警惕干槽症，及时复诊。' });
    } else {
      out.push({ level: 'info', title: '智齿恢复期护理', text: '伤口逐步愈合，可逐渐恢复正常饮食，但仍忌辛辣、坚硬与酒精，直到完全愈合。保持口腔清洁。' });
    }
    // 用药红线：甲硝唑/头孢期间禁酒
    if (cond.meds && cond.meds.length) {
      out.push({ level: 'warn', title: '用药警示·严禁饮酒', text: '你正在服用消炎药（' + cond.meds.join('、') + '），严禁饮酒：酒精会引发双硫仑样反应，严重可致命。同时忌辛辣、坚硬食物。' });
    }
  }

  // ---------- 高血压模块 ----------
  function hypertensionAdvice(out, cond, timeline) {
    // ① 护理建议
    out.push({ level: 'info', title: '高血压·日常护理', text: '① 严格限盐：每天食盐<5克，少吃腌制、加工、外卖等高盐食物；② 控制体重、规律有氧运动（如快走）；③ 戒烟，限制饮酒；④ 家庭自备血压计，定期监测并记录；⑤ 遵医嘱服药，切勿因"血压正常"就擅自停药。' });
    // ② 用药警示（西柚红线）
    const meds = cond.meds || [];
    if (meds.length) {
      out.push({ level: 'warn', title: '用药警示·降压药与西柚红线', text: '你正在服用降压药（' + meds.join('、') + '）：\n• 严禁吃西柚/柚子——其呋喃香豆素会抑制药物代谢，使降压药（尤其钙拮抗剂）药效骤增，可致血压骤降甚至休克。\n• 按时服药，切勿因"血压正常"就擅自停药。\n• 定期复诊，监测血压与电解质。' });
    } else {
      out.push({ level: 'info', title: '用药警示·待补充', text: '你尚未登记正在服用的降压药。若医生已开具降压药，请到「我的 → 个人档案 → 高血压」补充药物名称，以便启用"西柚/柚子红线"提醒与用药警示。' });
    }
    // ③ 忌口食物提醒
    out.push({ level: 'warn', title: '高血压·忌口与限量', text: '忌口（尽量不吃）：高盐食物（盐、酱油、味精、咸菜、腊肉、香肠、皮蛋、咸鸭蛋、薯片、加工肉）；西柚、柚子（尤其服药期间）。\n限量（适量）：红肉与肥肉、油炸食品、动物油（黄油/奶油）、酒精、含咖啡因饮品（咖啡、浓茶、可乐）、高糖甜点与饮料。' });
  }

  // ---------- 近期饮食忌口（合并判定，标注原因） ----------
  function recentDietAdvice(out, conditions, timeline) {
    if (!conditions.length) return;
    const recentDiet = timeline
      .filter(function (e) { return e.type === 'diet'; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); })
      .slice(0, 12);
    const bad = [];
    const seen = {};
    recentDiet.forEach(function (e) {
      const foods = (e.detail && e.detail.foods) || [];
      foods.forEach(function (f) {
        const info = Knowledge.findFood(f.name);
        if (!info) return;
        const j = Knowledge.judge(info, conditions);
        if (j.verdict === 'avoid' && !seen[f.name]) {
          seen[f.name] = 1;
          const causes = j.reasons.map(function (r) {
            return r.conditionName + (r.stageName ? '（' + r.stageName + '）' : '');
          }).join('、');
          bad.push('• ' + f.name + '（' + causes + '）：' + info.note);
        }
      });
    });
    if (bad.length) {
      out.push({ level: 'warn', title: '近期食用了忌口食物', text: bad.slice(0, 6).join('\n') });
    }
  }

  // ---------- 今日饮食评分 ----------
  function scoreTodayDiet(profile, timeline) {
    const conditions = Knowledge.getConditions(profile);
    const hasKidney = conditions.some(function (c) { return c.id === 'kidney_stone'; });
    const today = Store.todayStr();
    const dietEvents = timeline.filter(function (e) {
      return e.type === 'diet' && e.date === today;
    });
    const seen = {};
    const items = [];
    dietEvents.forEach(function (e) {
      const foods = (e.detail && e.detail.foods) || [];
      foods.forEach(function (f) {
        const name = f.name;
        if (seen[name]) return;
        seen[name] = 1;
        const info = Knowledge.findFood(name);
        if (!info) return;
        const j = Knowledge.judge(info, conditions);
        items.push({ name: name, verdict: j.verdict, reasons: j.reasons, note: info.note });
      });
    });
    const total = items.length;
    const ok = items.filter(function (i) { return i.verdict === 'ok'; });
    const limit = items.filter(function (i) { return i.verdict === 'limit'; });
    const avoid = items.filter(function (i) { return i.verdict === 'avoid'; });

    if (total === 0) {
      return {
        date: today, empty: true,
        text: '今天还没有饮食记录。点底部「＋」→ 饮食记录，记一下今天吃了什么，我会按你的病种打分并给建议。'
      };
    }

    // 食物分：基础分 + 可吃加分 + 适量加分 - 忌口扣分
    let foodRaw = 50;
    foodRaw += ok.length * 12;
    foodRaw += limit.length * 6;
    foodRaw -= avoid.length * 22;
    let foodScore = Math.max(0, Math.min(100, foodRaw));
    // 有忌口时，食物部分不应给满分
    if (avoid.length && foodScore > 89) foodScore = 89;

    // 饮水分（仅肾结石计入，智齿等不以饮水为指标）
    let waterScore = 0, wtotal = 0;
    const goal = (profile && profile.waterGoal) || 2000;
    if (hasKidney) {
      const waterEvents = timeline.filter(function (e) { return e.type === 'water' && e.date === today; });
      waterEvents.forEach(function (e) { wtotal += Number((e.detail && e.detail.amount) || 0); });
      if (goal > 0) waterScore = Math.max(0, Math.min(100, Math.round((wtotal / goal) * 100)));
    }
    const fW = hasKidney ? 0.75 : 1;
    const wW = hasKidney ? 0.25 : 0;
    let score = Math.round(foodScore * fW + waterScore * wW);
    score = Math.max(0, Math.min(100, score));

    let level, levelText;
    if (score >= 85) { level = 'good'; levelText = '优秀'; }
    else if (score >= 70) { level = 'good'; levelText = '良好'; }
    else if (score >= 50) { level = 'info'; levelText = '一般'; }
    else { level = 'warn'; levelText = '需改进'; }

    let analysis = '今天共记录 ' + total + ' 种食物：' + ok.length + ' 种可吃、' + limit.length + ' 种适量、' + avoid.length + ' 种忌口。';
    if (hasKidney) analysis += '饮水 ' + wtotal + 'ml / 目标 ' + goal + 'ml。';
    if (!conditions.length) analysis += '（未选择病种，按通用参考；到「我的」选病种后更准）';

    const suggestions = [];
    if (avoid.length) {
      const detail = avoid.map(function (i) {
        const causes = i.reasons.map(function (r) { return r.conditionName + (r.stageName ? '（' + r.stageName + '）' : ''); }).join('、');
        return i.name + '（' + causes + '）';
      }).join('、');
      suggestions.push('今天有 ' + avoid.length + ' 种忌口食物：' + detail + '。下次可先到「饮食查询」看更合适的替代。');
    }
    if (limit.length) {
      const names = limit.map(function (i) { return i.name; }).join('、');
      suggestions.push(limit.length + ' 种属于「适量」类（' + names + '），建议控制分量，不要一次吃太多。');
    }
    if (!avoid.length && ok.length && (!hasKidney || wtotal >= goal)) {
      suggestions.push('今天饮食整体合适，继续保持！');
    } else if (!avoid.length && ok.length && hasKidney) {
      suggestions.push('今天饮食对结石友好，但饮水未达标，记得少量多次补充水分。');
    }
    if (total <= 2) {
      suggestions.push('目前记录的食物较少，评分仅供参考。建议把三餐都记上，结果会更准。');
    }
    if (hasKidney && wtotal < goal) {
      if (!waterEventsCount(timeline, today)) {
        suggestions.push('今天还没记饮水。充足饮水是防复发的关键，记得补记（目标 ' + goal + 'ml）。');
      } else {
        suggestions.push('今日饮水 ' + wtotal + 'ml，距离目标 ' + goal + 'ml 还差 ' + (goal - wtotal) + 'ml。饮水不足会显著增加结石复发风险，建议少量多次补充。');
      }
    }

    return {
      date: today, empty: false, score: score, level: level, levelText: levelText,
      total: total, ok: ok.length, limit: limit.length, avoid: avoid.length,
      avoidList: avoid, analysis: analysis, suggestions: suggestions
    };
  }

  function waterEventsCount(timeline, today) {
    return timeline.filter(function (e) { return e.type === 'water' && e.date === today; }).length;
  }

  global.Advice = {
    buildAdvice: buildAdvice,
    scoreTodayDiet: scoreTodayDiet,
    DISCLAIMER: DISCLAIMER,
    daysSince: daysSince
  };
})(window);
