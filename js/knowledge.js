// knowledge.js - 肾结石饮食知识库
// ox = 草酸钙结石建议; ur = 尿酸结石建议; 取值: avoid(忌/少吃) / limit(适量) / ok(可吃)
// 注意：本库为通用健康信息，具体请遵医嘱。
(function (global) {
  'use strict';

  const FOODS = [
    // ---------- 蔬菜 ----------
    { name: '菠菜', cat: '蔬菜', ox: 'avoid', ur: 'ok', note: '草酸含量极高，草酸钙结石应尽量不吃；焯水可去部分草酸但仍需谨慎。' },
    { name: '苋菜', cat: '蔬菜', ox: 'avoid', ur: 'ok', note: '草酸高，建议不吃或极少量且焯水。' },
    { name: '空心菜', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸中等，适量吃，建议焯水。' },
    { name: '甜菜', cat: '蔬菜', ox: 'avoid', ur: 'ok', note: '草酸高，建议不吃。' },
    { name: '芹菜', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量即可。' },
    { name: '韭菜', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '竹笋', cat: '蔬菜', ox: 'avoid', ur: 'ok', note: '草酸高且粗纤维多，建议不吃。' },
    { name: '茭白', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量、焯水。' },
    { name: '秋葵', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '芦笋', cat: '蔬菜', ox: 'avoid', ur: 'avoid', note: '草酸与嘌呤都高，两类结石都建议不吃。' },
    { name: '莲藕', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸、低嘌呤，可正常吃（搜"藕"也能找到）。' },
    { name: '包菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸、低嘌呤，卷心菜/圆白菜/甘蓝同物，可正常吃。' },
    { name: '卷心菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即包菜，低草酸低嘌呤，可正常吃。' },
    { name: '圆白菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即包菜，低草酸低嘌呤，可正常吃。' },
    { name: '番茄', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '草酸低，可正常吃。' },
    { name: '小番茄', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '草酸低，可吃。' },
    { name: '黄瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '水分多、低草酸，推荐。' },
    { name: '冬瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '利水消肿，推荐。' },
    { name: '白菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸，可吃。' },
    { name: '娃娃菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸，可吃。' },
    { name: '生菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '油麦菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '茄子', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '土豆', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '适量，注意烹饪少油少盐。' },
    { name: '胡萝卜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '西兰花', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '中草酸中嘌呤，适量。' },
    { name: '菜花', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '洋葱', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '青椒', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '苦瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '南瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '西葫芦', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '木耳', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '适量；干品泡发后嘌呤不高。' },
    { name: '海带', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '含碘与草酸，适量。' },
    { name: '紫菜', cat: '蔬菜', ox: 'avoid', ur: 'avoid', note: '草酸与嘌呤高，建议不吃。' },
    { name: '香菇', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇可适量；干香菇嘌呤高，尿酸结石少吃。' },
    { name: '莴笋', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸，可吃。' },
    { name: '莴苣', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即莴笋，可吃。' },
    { name: '豆芽', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '绿豆芽草酸嘌呤中等，适量、多焯水。' },
    { name: '绿豆芽', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '适量、焯水。' },
    { name: '黄豆芽', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '适量、焯水。' },
    { name: '四季豆', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '必须煮熟，适量。' },
    { name: '豆角', cat: '蔬菜', ox: 'limit', ur: 'limit', note: '即四季豆，须煮熟，适量。' },
    { name: '豇豆', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '蒜薹', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '蒜苗', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '大葱', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '大蒜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '调味适量。' },
    { name: '生姜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '调味适量。' },
    { name: '香菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '茼蒿', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '芥菜', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '草酸中等，适量、焯水。' },
    { name: '雪里蕻', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '腌制含盐高，适量。' },
    { name: '白萝卜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '利水，可吃。' },
    { name: '红萝卜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '山药', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '芋头', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '红薯', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃，可替代部分主食。' },
    { name: '地瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即红薯，可吃。' },
    { name: '紫薯', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '玉米', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '荸荠', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '百合', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '黄花菜', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜品适量；干品泡发后嘌呤不高。' },
    { name: '草菇', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇适量。' },
    { name: '金针菇', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇适量。' },
    { name: '平菇', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇适量。' },
    { name: '杏鲍菇', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇适量。' },
    { name: '口蘑', cat: '蔬菜', ox: 'ok', ur: 'limit', note: '鲜菇适量。' },
    { name: '魔芋', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低热量，可吃。' },
    { name: '银耳', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },

    // ---------- 水果 ----------
    { name: '柠檬', cat: '水果', ox: 'ok', ur: 'ok', note: '枸橼酸可抑制结石，柠檬水（无糖）推荐每天喝。' },
    { name: '橙子', cat: '水果', ox: 'ok', ur: 'ok', note: '含枸橼酸，适量。' },
    { name: '橘子', cat: '水果', ox: 'limit', ur: 'ok', note: '含维C与草酸，适量不宜多。' },
    { name: '柚子', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '苹果', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '梨', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '葡萄', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '西瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '利尿，适量（糖友注意）。' },
    { name: '草莓', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '猕猴桃', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸与维C，适量。' },
    { name: '蓝莓', cat: '水果', ox: 'ok', ur: 'ok', note: '适量，抗氧化。' },
    { name: '香蕉', cat: '水果', ox: 'ok', ur: 'ok', note: '适量；肾功能不全者注意钾。' },
    { name: '樱桃', cat: '水果', ox: 'ok', ur: 'ok', note: '对痛风友好，适量。' },
    { name: '石榴', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '杨梅', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '芒果', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '菠萝', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '荔枝', cat: '水果', ox: 'limit', ur: 'limit', note: '糖分高，适量。' },
    { name: '柿子', cat: '水果', ox: 'limit', ur: 'ok', note: '含鞣酸，适量。' },

    // ---------- 坚果种子 ----------
    { name: '杏仁', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高，草酸钙结石不吃。' },
    { name: '花生', cat: '坚果', ox: 'avoid', ur: 'avoid', note: '草酸与嘌呤都高，建议不吃。' },
    { name: '腰果', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高，不吃。' },
    { name: '核桃', cat: '坚果', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '芝麻', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高，不吃。' },
    { name: '瓜子', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高且多盐，不吃。' },
    { name: '开心果', cat: '坚果', ox: 'limit', ur: 'limit', note: '适量。' },

    // ---------- 肉蛋奶 ----------
    { name: '猪肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '红肉，适量，避免过量动物蛋白。' },
    { name: '牛肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '红肉含嘌呤，适量。' },
    { name: '羊肉', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '鸡肉', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '白肉较优，适量。' },
    { name: '鸭肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '鱼肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '大部分鱼适量；避免高嘌呤鱼（见下）。' },
    { name: '虾', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '蟹', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '贝类', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '动物内脏', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '肝/肾/脑嘌呤极高，尿酸结石严禁。' },
    { name: '香肠', cat: '肉蛋奶', ox: 'avoid', ur: 'avoid', note: '高盐高嘌呤加工肉，不吃。' },
    { name: '腊肉', cat: '肉蛋奶', ox: 'avoid', ur: 'avoid', note: '高盐，不吃。' },
    { name: '鸡蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '优质蛋白，每天1个左右。' },
    { name: '牛奶', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '饮食钙反而有助结合草酸，适量喝（勿用钙片替代）。' },
    { name: '酸奶', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '豆腐', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '草酸与嘌呤中等，适量可，不必完全禁。' },
    { name: '豆浆', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '鸭蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '鹅蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '鹌鹑蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '皮蛋', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '含钠高，适量。' },
    { name: '鸽子肉', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '白肉，适量。' },
    { name: '兔肉', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '低嘌呤白肉，较优。' },
    { name: '鹅肉', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '驴肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '火鸡', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '白肉，适量。' },
    { name: '三文鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '中嘌呤，适量。' },
    { name: '带鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '鲤鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '草鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '鲫鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '鲈鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '鳕鱼', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '金枪鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '沙丁鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤极高，尿酸结石严禁。' },
    { name: '凤尾鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤极高，严禁。' },
    { name: '鱿鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，严禁。' },
    { name: '墨鱼', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '嘌呤高，严禁。' },
    { name: '海参', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '低嘌呤，可适量。' },
    { name: '海蜇', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '低嘌呤，可适量。' },
    { name: '奶酪', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '高钠、动物蛋白，适量。' },
    { name: '芝士', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '即奶酪，适量。' },
    { name: '黄油', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '高脂，适量。' },
    { name: '奶油', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '高脂高糖，适量。' },
    { name: '蛋白粉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '浓缩动物蛋白，遵医嘱，不盲目补。' },
    { name: '豆腐干', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '豆制品，适量。' },
    { name: '千张', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '即豆皮，豆制品适量。' },
    { name: '毛豆', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '即青豆，适量。' },

    // ---------- 饮品 ----------
    { name: '白开水', cat: '饮品', ox: 'ok', ur: 'ok', note: '最重要！每天2-3升，使尿色清淡。' },
    { name: '柠檬水', cat: '饮品', ox: 'ok', ur: 'ok', note: '无糖柠檬水推荐，枸橼酸抑石。' },
    { name: '淡茶', cat: '饮品', ox: 'limit', ur: 'ok', note: '淡茶适量；避免浓茶。' },
    { name: '浓茶', cat: '饮品', ox: 'avoid', ur: 'ok', note: '草酸高，不喝。' },
    { name: '咖啡', cat: '饮品', ox: 'limit', ur: 'ok', note: '适量，过量不利。' },
    { name: '可乐', cat: '饮品', ox: 'avoid', ur: 'avoid', note: '含糖磷酸饮料，不喝。' },
    { name: '碳酸饮料', cat: '饮品', ox: 'avoid', ur: 'avoid', note: '不喝。' },
    { name: '果汁', cat: '饮品', ox: 'avoid', ur: 'avoid', note: '果糖高，不喝。' },
    { name: '啤酒', cat: '饮品', ox: 'limit', ur: 'avoid', note: '酒精升尿酸，尿酸结石严禁。' },
    { name: '白酒', cat: '饮品', ox: 'limit', ur: 'avoid', note: '酒精，尿酸结石严禁。' },
    { name: '黄酒', cat: '饮品', ox: 'limit', ur: 'avoid', note: '嘌呤高，严禁。' },
    { name: '运动饮料', cat: '饮品', ox: 'limit', ur: 'limit', note: '含钠，适量。' },
    { name: '椰子水', cat: '饮品', ox: 'ok', ur: 'ok', note: '适量，天然电解质。' },

    // ---------- 主食与其他 ----------
    { name: '米饭', cat: '主食', ox: 'ok', ur: 'ok', note: '主食正常。' },
    { name: '面条', cat: '主食', ox: 'ok', ur: 'ok', note: '正常。' },
    { name: '馒头', cat: '主食', ox: 'ok', ur: 'ok', note: '正常。' },
    { name: '燕麦', cat: '主食', ox: 'limit', ur: 'ok', note: '含草酸中等，适量。' },
    { name: '全麦面包', cat: '主食', ox: 'limit', ur: 'ok', note: '适量。' },
    { name: '巧克力', cat: '零食', ox: 'avoid', ur: 'ok', note: '草酸与糖高，不吃。' },
    { name: '可可', cat: '零食', ox: 'avoid', ur: 'ok', note: '草酸高，不吃。' },
    { name: '糖果', cat: '零食', ox: 'avoid', ur: 'avoid', note: '果糖不利，不吃。' },
    { name: '盐', cat: '调料', ox: 'avoid', ur: 'avoid', note: '高盐升尿钙，每天<5克。' },
    { name: '酱油', cat: '调料', ox: 'limit', ur: 'limit', note: '含钠高，少放。' },
    { name: '味精', cat: '调料', ox: 'limit', ur: 'limit', note: '含钠，少放。' },
    { name: '醋', cat: '调料', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '番茄酱', cat: '调料', ox: 'limit', ur: 'limit', note: '含糖含钠，少放。' },
    { name: '小米', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '小米粥', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '玉米粥', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '红薯粥', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '饺子', cat: '主食', ox: 'ok', ur: 'ok', note: '混合餐，适量。' },
    { name: '包子', cat: '主食', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '馄饨', cat: '主食', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '汤圆', cat: '主食', ox: 'limit', ur: 'limit', note: '糖油较高，适量。' },
    { name: '米粉', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '河粉', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '年糕', cat: '主食', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '烙饼', cat: '主食', ox: 'ok', ur: 'ok', note: '适量，少油。' },
    { name: '油条', cat: '主食', ox: 'avoid', ur: 'avoid', note: '油炸高盐，不吃。' },
    { name: '煎饼', cat: '主食', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '饼干', cat: '零食', ox: 'limit', ur: 'limit', note: '糖盐高，适量。' },
    { name: '蛋糕', cat: '零食', ox: 'limit', ur: 'limit', note: '糖油高，适量。' },
    { name: '意大利面', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '糙米', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '黑米', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '紫米', cat: '主食', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '荞麦', cat: '主食', ox: 'ok', ur: 'ok', note: '低嘌呤，对尿酸友好，推荐。' },
    { name: '藜麦', cat: '主食', ox: 'ok', ur: 'ok', note: '低嘌呤，推荐。' },
    { name: '薏米', cat: '主食', ox: 'ok', ur: 'ok', note: '即薏仁，利湿，可吃。' },
    { name: '绿豆', cat: '主食', ox: 'ok', ur: 'limit', note: '豆类嘌呤中等，尿酸结石适量。' },
    { name: '红豆', cat: '主食', ox: 'ok', ur: 'limit', note: '适量。' },
    { name: '赤小豆', cat: '主食', ox: 'ok', ur: 'limit', note: '即红豆，利湿，适量。' },
    { name: '黄豆', cat: '主食', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃；草酸中等。' },
    { name: '黑豆', cat: '主食', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '蚕豆', cat: '主食', ox: 'limit', ur: 'avoid', note: '嘌呤高，尿酸结石不吃。' },
    { name: '豌豆', cat: '主食', ox: 'limit', ur: 'limit', note: '适量。' },

    // ---------- 补剂 ----------
    { name: '维生素C片', cat: '补剂', ox: 'avoid', ur: 'ok', note: '大剂量维C会转化为草酸，不吃补剂。' },
    { name: '钙片', cat: '补剂', ox: 'limit', ur: 'limit', note: '勿盲目补钙；饮食钙更安全，遵医嘱。' },
    { name: '维生素D', cat: '补剂', ox: 'limit', ur: 'limit', note: '过量升血钙，遵医嘱。' },
    { name: '鱼油', cat: '补剂', ox: 'ok', ur: 'ok', note: '适量。' },

    // ---------- 草药茶饮 ----------
    { name: '金钱草', cat: '草药茶', ox: 'ok', ur: 'ok', note: '传统利尿排石，适量泡水（遵医嘱）。' },
    { name: '玉米须', cat: '草药茶', ox: 'ok', ur: 'ok', note: '利尿，适量。' },
    { name: '车前草', cat: '草药茶', ox: 'ok', ur: 'ok', note: '利尿，适量（遵医嘱）。' }
  ];

  // ===== 新增食物（智齿等场景需要，原库未含） =====
  const EXTRA_FOODS = [
    { name: '辣椒', cat: '调料', ox: 'ok', ur: 'ok', note: '辛辣，智齿发炎期忌口。' },
    { name: '花椒', cat: '调料', ox: 'ok', ur: 'ok', note: '辛辣麻舌，发炎期忌口。' },
    { name: '芥末', cat: '调料', ox: 'ok', ur: 'ok', note: '辛辣刺激，发炎期忌口。' },
    { name: '咖喱', cat: '调料', ox: 'limit', ur: 'limit', note: '含多种香辛料偏辛辣，发炎期适量。' },
    { name: '薯片', cat: '零食', ox: 'avoid', ur: 'avoid', note: '高盐油炸且酥脆，肾结石与智齿都忌。' },
    { name: '锅巴', cat: '主食', ox: 'avoid', ur: 'avoid', note: '酥脆坚硬易嵌牙，发炎期忌。' },
    { name: '糯米糍', cat: '零食', ox: 'limit', ur: 'limit', note: '黏性大残渣难清，发炎期忌。' },
    { name: '软糖', cat: '零食', ox: 'avoid', ur: 'avoid', note: '黏性高糖，发炎期忌。' },
    { name: '冰块', cat: '饮品', ox: 'ok', ur: 'ok', note: '坚硬，咀嚼易刺激患处，发炎期忌。' },
    { name: '牛肉干', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '坚硬难嚼粗纤维，发炎期忌。' },
    { name: '汉堡', cat: '主食', ox: 'limit', ur: 'limit', note: '需大张口咀嚼，发炎期切小块适量。' },
    { name: '蒸蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '软嫩易消化，发炎期适宜。' },
    { name: '鸡蛋羹', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '温软，发炎期适宜。' },
    { name: '土豆泥', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '软烂，发炎期适宜。' },
    { name: '南瓜糊', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '软烂温凉，发炎期适宜。' },
    { name: '燕麦粥', cat: '主食', ox: 'limit', ur: 'ok', note: '温软，适量。' },
    { name: '西柚', cat: '水果', ox: 'ok', ur: 'ok', note: '含呋喃香豆素，服降压药（钙拮抗剂）期间严禁，否则药效骤增、血压骤降。' },
    { name: '咸鸭蛋', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '腌制高盐，高血压严格限制；肾结石亦需少盐。' },
    { name: '热干面', cat: '主食', ox: 'limit', ur: 'ok', note: '武汉特色早餐：碱水面+芝麻酱。芝麻酱草酸与脂肪偏高，尿路结石者适量；高血压注意芝麻酱的钠与脂肪，当作主食适量即可。' },
    { name: '排骨', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '猪排骨属红肉，适量；带脂肪，高血压限量、结石者亦勿过量。炖汤后撇去浮油更健康。' },
    { name: '粉条', cat: '主食', ox: 'ok', ur: 'ok', note: '纯淀粉制品（多为红薯/土豆/绿豆淀粉），低草酸低嘌呤，可正常吃；但常与高油高盐同烹（猪肉炖粉条、蚂蚁上树），注意少油少盐；升糖指数偏高，控糖者适量。' },
    { name: '粉丝', cat: '主食', ox: 'ok', ur: 'ok', note: '多与粉条同类（绿豆/豌豆淀粉），低草酸低嘌呤，可吃；烹调同理少油少盐。' },
    { name: '宽粉', cat: '主食', ox: 'ok', ur: 'ok', note: '红薯/土豆淀粉制成，与粉条同类，可正常吃，注意烹调方式。' },
    { name: '酸辣粉', cat: '主食', ox: 'ok', ur: 'ok', note: '红薯粉为主料本可吃，但成品多红油重盐，高血压严格限量、结石者亦少盐少油。' },

    // ===== 高频/带风险常见食物补全（2026-09-16 批量补） =====
    // —— 蔬菜 ——
    { name: '丝瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸低嘌呤，可吃。' },
    { name: '菜心', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '低草酸，可吃。' },
    { name: '芥蓝', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '香椿', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '含亚硝酸盐，焯水后适量吃。' },
    { name: '韭黄', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '豌豆苗', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '嫩苗低草酸，可吃。' },
    { name: '西洋菜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即豆瓣菜，可吃。' },
    { name: '佛手瓜', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '凉薯', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即沙葛，脆甜多水，可吃。' },
    { name: '菱角', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '淀粉类，适量。' },
    { name: '慈姑', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量、焯水。' },
    { name: '马齿苋', cat: '蔬菜', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '茴香', cat: '蔬菜', ox: 'ok', ur: 'ok', note: '即茴香苗，可吃。' },
    // —— 水果 ——
    { name: '桃子', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸少量，适量。' },
    { name: '李子', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '杏', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '哈密瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '甜瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '木瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '火龙果', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃（红心含甜菜红素，不影响结石）。' },
    { name: '杨桃', cat: '水果', ox: 'avoid', ur: 'ok', note: '⚠️ 杨桃含 caramboxin 神经毒素与草酸，肾功能不全/结石患者可能引发中毒（打嗝、意识障碍甚至致命），严禁食用。' },
    { name: '牛油果', cat: '水果', ox: 'ok', ur: 'ok', note: '高脂但多为健康 fat，适量。' },
    { name: '枇杷', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '甘蔗', cat: '水果', ox: 'ok', ur: 'limit', note: '糖分高，适量。' },
    { name: '椰子肉', cat: '水果', ox: 'ok', ur: 'ok', note: '即椰肉，高脂，适量。' },
    { name: '青枣', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '无花果', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸与籽，适量。' },
    // —— 主食/小吃 ——
    { name: '凉皮', cat: '主食', ox: 'ok', ur: 'ok', note: '主食可吃；调料多油盐，少放。' },
    { name: '米线', cat: '主食', ox: 'ok', ur: 'ok', note: '米制品主食，可吃。' },
    { name: '肠粉', cat: '主食', ox: 'ok', ur: 'ok', note: '米制品主食；酱油多则注意少盐。' },
    { name: '方便面', cat: '主食', ox: 'limit', ur: 'ok', note: '油炸高盐，高血压严格限量、结石者少盐，尽量少吃。' },
    { name: '烧麦', cat: '主食', ox: 'ok', ur: 'ok', note: '主食，适量。' },
    { name: '手抓饼', cat: '主食', ox: 'limit', ur: 'ok', note: '油盐较高，适量。' },
    { name: '螺蛳粉', cat: '主食', ox: 'limit', ur: 'ok', note: '重盐重辣，高血压严格限量、结石少盐，少吃。' },
    { name: '葱油饼', cat: '主食', ox: 'limit', ur: 'ok', note: '油盐较多，适量。' },
    { name: '饵丝', cat: '主食', ox: 'ok', ur: 'ok', note: '米制品主食，可吃。' },
    // —— 肉蛋水产 ——
    { name: '培根', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '腌制高盐高脂，高血压严格限量。' },
    { name: '火腿', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '腌制高盐，高血压严格限量。' },
    { name: '午餐肉', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '加工高盐，高血压严格限量。' },
    { name: '虾皮', cat: '肉蛋奶', ox: 'limit', ur: 'avoid', note: '高盐且嘌呤高，高血压严格限量、尿酸结石严禁。' },
    { name: '生蚝', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '中嘌呤，尿酸结石适量。' },
    { name: '牡蛎', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '即生蚝，中嘌呤，适量。' },
    { name: '蛤蜊', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '中嘌呤，适量。' },
    { name: '蛏子', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '中嘌呤，适量。' },
    { name: '牛蛙', cat: '肉蛋奶', ox: 'ok', ur: 'limit', note: '即田鸡，白肉中嘌呤，适量。' },
    { name: '鱼丸', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '加工食品含钠与淀粉，适量。' },
    { name: '肉丸', cat: '肉蛋奶', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '羊奶', cat: '肉蛋奶', ox: 'ok', ur: 'ok', note: '可喝（与牛羊奶同效）。' },
    // —— 零食饮料 ——
    { name: '奶茶', cat: '饮品', ox: 'limit', ur: 'limit', note: '高糖高脂+咖啡因，高血压/结石适量，糖友忌。' },
    { name: '薯条', cat: '零食', ox: 'avoid', ur: 'avoid', note: '油炸高盐，肾结石与高血压都忌。' },
    { name: '炸鸡', cat: '零食', ox: 'avoid', ur: 'avoid', note: '油炸高脂，忌。' },
    { name: '辣条', cat: '零食', ox: 'avoid', ur: 'avoid', note: '高盐辣加工食品，忌。' },
    { name: '蜜饯', cat: '零食', ox: 'limit', ur: 'avoid', note: '高糖高盐腌制，忌。' },
    { name: '红酒', cat: '饮品', ox: 'limit', ur: 'avoid', note: '酒精升尿酸，尿酸结石严禁、高血压限量。' },
    { name: '米酒', cat: '饮品', ox: 'limit', ur: 'limit', note: '即酒酿，含酒精，适量/忌。' },
    { name: '功能饮料', cat: '饮品', ox: 'limit', ur: 'ok', note: '含咖啡因与糖，适量。' },
    { name: '蜂蜜水', cat: '饮品', ox: 'ok', ur: 'limit', note: '糖分高，适量。' },
    { name: '凉茶', cat: '饮品', ox: 'ok', ur: 'ok', note: '适量（含糖款注意）。' },
    // —— 调料 ——
    { name: '蚝油', cat: '调料', ox: 'limit', ur: 'limit', note: '高钠，少放。' },
    { name: '豆瓣酱', cat: '调料', ox: 'limit', ur: 'limit', note: '高钠，少放。' },
    { name: '辣椒酱', cat: '调料', ox: 'limit', ur: 'ok', note: '辣且偏咸，发炎期忌、高血压少盐。' },
    { name: '芝麻酱', cat: '调料', ox: 'avoid', ur: 'ok', note: '芝麻高草酸，草酸钙结石忌；高血压注意其脂肪与钠，当作调料少量。' },
    { name: '沙拉酱', cat: '调料', ox: 'limit', ur: 'limit', note: '高脂高糖，适量。' },
    { name: '白糖', cat: '调料', ox: 'ok', ur: 'avoid', note: '糖分高，适量。' },
    { name: '红糖', cat: '调料', ox: 'ok', ur: 'avoid', note: '糖分高，适量。' },
    { name: '料酒', cat: '调料', ox: 'ok', ur: 'limit', note: '含酒精烹调，适量。' },
    { name: '花生酱', cat: '调料', ox: 'avoid', ur: 'limit', note: '花生高草酸，草酸钙结石忌、适量。' }
  ];

  // ===== 食物属性标签：用于智齿等按"物理/刺激属性"判定（与肾结石的化学维度 ox/ur 解耦） =====
  // hard 坚硬需嚼 / crispy 酥脆碎渣 / sticky 黏 / spicy 辛辣 / coarse 粗纤维需大张口 / acidic 过酸 / sugar 高糖 / alcohol 含酒精
  const FOOD_TAGS = {
    // —— 智齿相关（原有）——
    '花生': ['hard'], '瓜子': ['hard'], '核桃': ['hard'], '杏仁': ['hard'], '腰果': ['hard'], '芝麻': ['hard'], '冰块': ['hard'],
    '薯片': ['crispy', 'high_sodium'], '锅巴': ['crispy', 'hard'], '饼干': ['crispy', 'sugar'], '油条': ['crispy', 'high_sodium', 'high_fat'],
    '年糕': ['sticky'], '汤圆': ['sticky'], '糯米糍': ['sticky'], '软糖': ['sticky', 'sugar'], '糖果': ['sticky', 'sugar'],
    '辣椒': ['spicy'], '花椒': ['spicy'], '芥末': ['spicy'], '咖喱': ['spicy'],
    '竹笋': ['coarse'], '芹菜': ['coarse'], '玉米': ['coarse'], '苹果': ['coarse'], '牛肉': ['coarse', 'high_fat'], '牛肉干': ['hard', 'coarse'], '汉堡': ['coarse'],
    '柠檬': ['acidic'], '橘子': ['acidic'], '橙子': ['acidic'], '醋': ['acidic'], '番茄': ['acidic'],
    '巧克力': ['sugar', 'caffeine'], '可乐': ['sugar', 'caffeine'], '果汁': ['sugar'], '蛋糕': ['sugar'], '荔枝': ['sugar'], '西瓜': ['sugar'],
    '啤酒': ['alcohol'], '白酒': ['alcohol'], '黄酒': ['alcohol'],
    // —— 高血压相关 ——
    '盐': ['high_sodium'], '酱油': ['high_sodium'], '味精': ['high_sodium'],
    '香肠': ['high_sodium'], '腊肉': ['high_sodium'], '皮蛋': ['high_sodium'],
    '奶酪': ['high_sodium'], '芝士': ['high_sodium'], '运动饮料': ['high_sodium'], '番茄酱': ['high_sodium'], '咸鸭蛋': ['high_sodium'],
    '猪肉': ['high_fat'], '排骨': ['high_fat'], '羊肉': ['high_fat'], '鸭肉': ['high_fat'], '鹅肉': ['high_fat'],
    '黄油': ['high_fat'], '奶油': ['high_fat'],
    '咖啡': ['caffeine'], '浓茶': ['caffeine'], '可可': ['caffeine'],
    '柚子': ['grapefruit'], '西柚': ['grapefruit'],
    '酸辣粉': ['high_sodium', 'spicy'],
    // —— 2026-09-16 批量补标签 ——
    '方便面': ['high_sodium'], '螺蛳粉': ['high_sodium', 'spicy'],
    '培根': ['high_sodium', 'high_fat'], '火腿': ['high_sodium'], '午餐肉': ['high_sodium', 'high_fat'],
    '虾皮': ['high_sodium'], '蚝油': ['high_sodium'], '豆瓣酱': ['high_sodium'],
    '薯条': ['crispy', 'high_fat', 'high_sodium'], '炸鸡': ['crispy', 'high_fat'],
    '辣条': ['high_sodium', 'spicy'], '辣椒酱': ['spicy', 'high_sodium'],
    '蜜饯': ['sugar', 'high_sodium'], '沙拉酱': ['high_fat', 'sugar'],
    '芝麻酱': ['high_fat', 'high_sodium'], '花生酱': ['high_fat'],
    '白糖': ['sugar'], '红糖': ['sugar'],
    '红酒': ['alcohol'], '米酒': ['alcohol'], '料酒': ['alcohol'],
    '功能饮料': ['caffeine', 'sugar'], '奶茶': ['sugar', 'caffeine']
  };

  // ===== 多病种规则引擎 =====
  // 每个病种提供 judge(food, cond) -> {verdict, note, hardWarn?}
  // 合并原则：取所有病种中最严格（avoid > limit > ok），并记录每条原因（标注来源病种）
  const CONDITIONS = {
    kidney_stone: {
      id: 'kidney_stone', name: '肾结石', icon: '🪨',
      judge: function (food, cond) {
        const t = (cond && cond.stoneType) || 'unknown';
        const v = (t === 'uric') ? food.ur : food.ox;
        let note = food.note;
        if (!t || t === 'unknown') note = '（结石成分未明确，暂按草酸钙结石参考；确诊后更准）' + note;
        return { verdict: v, note: note };
      }
    },
    wisdom_tooth: {
      id: 'wisdom_tooth', name: '智齿发炎', icon: '🦷',
      stages: {
        inflammation: { name: '发炎期', avoid: ['hard', 'crispy', 'sticky', 'spicy', 'coarse', 'alcohol'], limit: ['acidic', 'sugar'],
          avoidNote: '坚硬、酥脆、黏性食物会刺激发炎牙龈、嵌塞盲袋，加重肿胀疼痛；辛辣与酒精直接刺激创面。',
          limitNote: '过酸、过甜会刺激创面，建议放温凉、少量。' },
        post_extraction: { name: '拔牙后', avoid: ['hard', 'crispy', 'sticky', 'spicy', 'coarse', 'alcohol', 'hot'], limit: ['acidic', 'sugar'],
          avoidNote: '拔牙后 24 小时内忌热食、忌用吸管、忌过硬食物，防止血凝块脱落（干槽症）；辛辣酒精同样禁忌。',
          limitNote: '以温凉软食为主，过酸过甜暂缓。' },
        recovery: { name: '恢复期', avoid: ['hard', 'crispy', 'sticky', 'spicy', 'alcohol'], limit: ['coarse', 'sugar'],
          avoidNote: '伤口未完全愈合前仍忌坚硬、辛辣与酒精。',
          limitNote: '可逐步恢复正常饮食，粗纤维与甜食用量适度。' }
      },
      judge: function (food, cond) {
        const stage = (cond && cond.stage) || 'inflammation';
        const rules = CONDITIONS.wisdom_tooth.stages[stage] || CONDITIONS.wisdom_tooth.stages.inflammation;
        const tags = FOODS_TAGS_SAFE(food.name);
        // 用药红线：服甲硝唑/头孢期间严禁饮酒（双硫仑样反应）
        if (cond && cond.meds && cond.meds.length && tags.indexOf('alcohol') >= 0) {
          return { verdict: 'avoid', hardWarn: true,
            note: '你正在服用消炎药（' + cond.meds.join('、') + '），严禁饮酒：酒精会引发双硫仑样反应，严重可致命。' };
        }
        if (tags.indexOf('alcohol') >= 0) return { verdict: 'avoid', note: rules.avoidNote + '（含酒精）' };
        if (arrIntersect(tags, rules.avoid)) return { verdict: 'avoid', note: rules.avoidNote };
        if (arrIntersect(tags, rules.limit)) return { verdict: 'limit', note: rules.limitNote };
        return { verdict: 'ok', note: '' };
      }
    },
    hypertension: {
      id: 'hypertension', name: '高血压', icon: '🫀',
      judge: function (food, cond) {
        const tags = FOODS_TAGS_SAFE(food.name);
        // 用药红线：服降压药期间严禁西柚/柚子（呋喃香豆素↔钙拮抗剂危险交互）
        if (cond && cond.meds && cond.meds.length && tags.indexOf('grapefruit') >= 0) {
          return { verdict: 'avoid', hardWarn: true,
            note: '你正在服用降压药，严禁吃西柚/柚子：其含有的呋喃香豆素会抑制肝脏代谢酶，使降压药（尤其钙拮抗剂类）血药浓度飙升，导致血压骤降甚至低血压休克。' };
        }
        if (tags.indexOf('high_sodium') >= 0) return { verdict: 'avoid', note: '高盐（钠）食物会升高血压、加重心脏与血管负担，高血压应严格限制，每天食盐<5克。' };
        if (tags.indexOf('grapefruit') >= 0) return { verdict: 'limit', note: '西柚/柚子含呋喃香豆素，若服用降压药（钙拮抗剂）会产生危险交互；即使未服药也建议尽量少吃。' };
        if (tags.indexOf('high_fat') >= 0) return { verdict: 'limit', note: '高脂食物易致肥胖与动脉硬化，建议控制分量。' };
        if (tags.indexOf('alcohol') >= 0) return { verdict: 'limit', note: '酒精会使血压波动、抵消药效，建议尽量少喝或不喝。' };
        if (tags.indexOf('caffeine') >= 0) return { verdict: 'limit', note: '咖啡因短期内会升血压，敏感者适量、避免空腹与睡前饮用。' };
        if (tags.indexOf('sugar') >= 0) return { verdict: 'limit', note: '高糖饮食易致肥胖，间接升高血压，建议控制。' };
        return { verdict: 'ok', note: '' };
      }
    }
  };

  function FOODS_TAGS_SAFE(name) { return FOOD_TAGS[name] || []; }

  const ALL_FOODS = FOODS.concat(EXTRA_FOODS);

  function arrIntersect(a, b) {
    for (let i = 0; i < a.length; i++) { if (b.indexOf(a[i]) >= 0) return true; }
    return false;
  }

  // 从档案取出病种数组（兼容旧版单结石类型）
  function getConditions(profile) {
    if (!profile) return [];
    if (Array.isArray(profile.conditions) && profile.conditions.length) return profile.conditions;
    if (profile.stoneType) {
      return [{ id: 'kidney_stone', stoneType: profile.stoneType, surgeryDate: profile.surgeryDate,
        surgeryType: profile.surgeryType, affectedSide: profile.affectedSide, stage: 'post_surgery' }];
    }
    return [];
  }

  const MAP = {};
  ALL_FOODS.forEach(function (f) { MAP[f.name] = f; });

  function findFood(name) {
    if (!name) return null;
    const n = String(name).trim();
    if (MAP[n]) return MAP[n];
    // 包含匹配
    const hit = ALL_FOODS.find(function (f) {
      return f.name.indexOf(n) >= 0 || n.indexOf(f.name) >= 0;
    });
    return hit || null;
  }

  function verdictLabel(v) {
    if (v === 'avoid') return '忌口/少吃';
    if (v === 'limit') return '适量';
    if (v === 'ok') return '可吃';
    return '—';
  }

  // 合并判定：传入病种数组（conditions）或兼容旧版单结石类型字符串
  // 返回 { verdict, label, reasons:[{condition,conditionName,stage,stageName,verdict,note,hardWarn}], note, name, cat }
  function judge(food, ctx) {
    if (!food) return null;
    let conditions = ctx;
    if (typeof ctx === 'string') {
      conditions = ctx ? [{ id: 'kidney_stone', stoneType: ctx }] : [];
    }
    conditions = conditions || [];
    const order = { ok: 0, limit: 1, avoid: 2 };
    let worst = 'ok';
    const reasons = [];
    // 第一遍：取最严格判定
    conditions.forEach(function (cond) {
      const def = CONDITIONS[cond.id];
      if (!def) return;
      const r = def.judge(food, cond) || { verdict: 'ok' };
      if (order[r.verdict] > order[worst]) worst = r.verdict;
    });
    // 第二遍：只记录与最严判定一致的原因，避免把"适量"等较弱原因一并列出造成歧义
    conditions.forEach(function (cond) {
      const def = CONDITIONS[cond.id];
      if (!def) return;
      const r = def.judge(food, cond) || { verdict: 'ok' };
      if (r.verdict === worst && r.verdict !== 'ok') {
        reasons.push({
          condition: cond.id,
          conditionName: def.name,
          stage: cond.stage,
          stageName: (def.stages && def.stages[cond.stage]) ? def.stages[cond.stage].name : '',
          verdict: r.verdict,
          note: r.note,
          hardWarn: !!r.hardWarn
        });
      }
    });
    let note = food.note;
    if (!conditions.length) note = '（未选择病种，暂按通用参考）' + note;
    return { verdict: worst, label: verdictLabel(worst), reasons: reasons, note: note, name: food.name, cat: food.cat };
  }

  // 合并用户自定义食物（记饮食时手动补录），运行时注入使搜索/判定立即生效
  function addUserFood(f) {
    if (!f || !f.name) return null;
    if (MAP[f.name]) return MAP[f.name];
    ALL_FOODS.push(f);
    MAP[f.name] = f;
    return f;
  }
  function mergeUserFoods(list) {
    (list || []).forEach(function (f) { addUserFood(f); });
    return ALL_FOODS.length;
  }

  global.Knowledge = {
    FOODS: ALL_FOODS,
    EXTRA_FOODS: EXTRA_FOODS,
    FOOD_TAGS: FOOD_TAGS,
    CONDITIONS: CONDITIONS,
    findFood: findFood,
    judge: judge,
    getConditions: getConditions,
    verdictLabel: verdictLabel,
    addUserFood: addUserFood,
    mergeUserFoods: mergeUserFoods
  };
})(window);
