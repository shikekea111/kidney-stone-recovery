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
    { name: '芦笋', cat: '蔬菜', ox: 'limit', ur: 'avoid', note: '草酸含量中等偏低、草酸钙结石可适量；但嘌呤偏高，尿酸结石建议不吃。' },
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
    { name: '葡萄', cat: '水果', ox: 'ok', ur: 'ok', note: '含果糖，尿酸结石适量；糖分不低。' },
    { name: '西瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '利尿、水分高，适量；糖分不低，尿酸结石与糖友注意。' },
    { name: '草莓', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '猕猴桃', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸与维C，适量。' },
    { name: '蓝莓', cat: '水果', ox: 'ok', ur: 'ok', note: '适量，抗氧化。' },
    { name: '香蕉', cat: '水果', ox: 'ok', ur: 'ok', note: '适量；肾功能不全者注意钾。' },
    { name: '樱桃', cat: '水果', ox: 'ok', ur: 'ok', note: '对痛风友好，适量。' },
    { name: '石榴', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '杨梅', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '芒果', cat: '水果', ox: 'ok', ur: 'ok', note: '适量；含果糖，尿酸结石注意。' },
    { name: '菠萝', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '荔枝', cat: '水果', ox: 'limit', ur: 'limit', note: '糖分与果糖高，升尿酸，适量；尿酸结石尤需注意。' },
    { name: '柿子', cat: '水果', ox: 'limit', ur: 'ok', note: '含鞣酸，适量。' },
    { name: '火龙果', cat: '水果', ox: 'ok', ur: 'ok', note: '低草酸、水分高，可正常吃；富含膳食纤维。' },
    { name: '杨桃', cat: '水果', ox: 'avoid', ur: 'ok', note: '含草酸，且含神经毒素 caramboxin；肾结石或肾功能异常者禁用，可能引发顽固打嗝、抽搐，严重者危险。' },
    { name: '桃子', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃，适量。' },
    { name: '哈密瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '水分多，适量。' },
    { name: '木瓜', cat: '水果', ox: 'ok', ur: 'ok', note: '可吃。' },
    { name: '椰子', cat: '水果', ox: 'ok', ur: 'limit', note: '椰肉脂肪与嘌呤中等，尿酸结石适量；椰子水富含钾，肾功能异常者注意。' },
    { name: '山楂', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸与鞣酸，适量；开胃助消化。' },
    { name: '李子', cat: '水果', ox: 'ok', ur: 'ok', note: '适量。' },
    { name: '杏', cat: '水果', ox: 'ok', ur: 'ok', note: '适量，果仁有毒勿食。' },
    { name: '枣', cat: '水果', ox: 'ok', ur: 'ok', note: '红枣适量，糖分不低。' },
    { name: '无花果', cat: '水果', ox: 'limit', ur: 'ok', note: '含草酸，适量。' },
    { name: '龙眼', cat: '水果', ox: 'limit', ur: 'limit', note: '糖分与果糖高，升尿酸，适量；尿酸结石尤需注意。' },

    // ---------- 坚果种子 ----------
    { name: '杏仁', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高，草酸钙结石不吃。' },
    { name: '花生', cat: '坚果', ox: 'avoid', ur: 'avoid', note: '草酸与嘌呤都高，建议不吃。' },
    { name: '腰果', cat: '坚果', ox: 'avoid', ur: 'limit', note: '草酸高，不吃。' },
    { name: '核桃', cat: '坚果', ox: 'limit', ur: 'limit', note: '适量。' },
    { name: '芝麻', cat: '坚果', ox: 'limit', ur: 'limit', note: '草酸中等，少量调味无妨；富含钙，对草酸钙结石有保护作用，适量即可，不宜大量。' },
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
    { name: '盐', cat: '调料', ox: 'limit', ur: 'limit', note: '高盐会升高尿钙、增加结石风险，但盐不能不吃，建议每天限制在 5 克以内（限制而非禁忌）。' },
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
    { name: '车前草', cat: '草药茶', ox: 'ok', ur: 'ok', note: '利尿，适量（遵医嘱）。' },

    // ---------- 调料（补全：菜谱常用） ----------
    { name: '白糖', cat: '调料', ox: 'ok', ur: 'ok', note: '纯糖，草酸与嘌呤均极低，两类结石均可适量；注意总体控糖。' },
    { name: '辣椒', cat: '调料', ox: 'ok', ur: 'limit', note: '中低嘌呤，草酸钙结石可吃；尿酸结石适量。泡椒/干辣椒同属。' },
    { name: '芝麻酱', cat: '调料', ox: 'limit', ur: 'ok', note: '富含钙，膳食钙在肠道结合草酸、减少吸收，对草酸钙结石有保护作用，适量（如热干面一小勺）无害；但不宜过量。' },
    { name: '榨菜', cat: '腌菜', ox: 'limit', ur: 'limit', note: '高盐腌制，含盐高，结石患者限量。萝卜干/酸豆角同属。' }
  ];

  // ---------- 常见菜 → 组成食材（用于菜名识别） ----------
  // ingredients 只引用 FOODS 中已有的 name；调料类(糖/辣椒)已补全。
  const DISHES = [
    { name: '鱼香肉丝', ingredients: ['猪肉', '木耳', '胡萝卜', '青椒', '竹笋', '大葱', '大蒜', '生姜', '醋', '番茄酱'] },
    { name: '宫保鸡丁', ingredients: ['鸡肉', '花生', '黄瓜', '胡萝卜', '大葱'] },
    { name: '番茄炒蛋', ingredients: ['番茄', '鸡蛋'] },
    { name: '青椒肉丝', ingredients: ['青椒', '猪肉'] },
    { name: '麻婆豆腐', ingredients: ['豆腐', '猪肉', '大葱'] },
    { name: '青椒土豆丝', ingredients: ['青椒', '土豆'] },
    { name: '酸辣土豆丝', ingredients: ['土豆', '辣椒', '醋'] },
    { name: '红烧肉', ingredients: ['猪肉', '白糖', '生姜'] },
    { name: '糖醋里脊', ingredients: ['猪肉', '白糖', '番茄酱'] },
    { name: '回锅肉', ingredients: ['猪肉', '青椒', '洋葱', '蒜苗'] },
    { name: '小炒肉', ingredients: ['猪肉', '青椒', '大蒜', '生姜'] },
    { name: '红烧茄子', ingredients: ['茄子', '猪肉', '大蒜', '生姜'] },
    { name: '地三鲜', ingredients: ['茄子', '土豆', '青椒'] },
    { name: '木须肉', ingredients: ['猪肉', '木耳', '黄瓜', '鸡蛋'] },
    { name: '番茄鸡蛋汤', ingredients: ['番茄', '鸡蛋'] },
    { name: '紫菜蛋花汤', ingredients: ['紫菜', '鸡蛋'] },
    { name: '冬瓜排骨汤', ingredients: ['冬瓜', '猪肉'] },
    { name: '菠菜豆腐汤', ingredients: ['菠菜', '豆腐'] },
    { name: '黄瓜炒鸡蛋', ingredients: ['黄瓜', '鸡蛋'] },
    { name: '韭菜炒鸡蛋', ingredients: ['韭菜', '鸡蛋'] },
    { name: '芹菜炒香干', ingredients: ['芹菜', '豆腐干'] },
    { name: '蒜蓉西兰花', ingredients: ['西兰花', '大蒜'] },
    { name: '蚝油生菜', ingredients: ['生菜', '大蒜'] },
    { name: '香菇油菜', ingredients: ['香菇', '白菜'] },
    { name: '清炒时蔬', ingredients: ['白菜', '胡萝卜', '木耳'] },
    { name: '土豆炖牛肉', ingredients: ['土豆', '牛肉', '胡萝卜'] },
    { name: '萝卜炖排骨', ingredients: ['白萝卜', '猪肉'] },
    { name: '可乐鸡翅', ingredients: ['鸡肉', '可乐'] },
    { name: '清蒸鱼', ingredients: ['鱼肉', '大葱', '生姜'] },
    { name: '酸菜鱼', ingredients: ['鱼肉', '辣椒', '豆芽', '白菜'] },
    { name: '水煮肉片', ingredients: ['猪肉', '辣椒', '白菜', '豆芽'] },
    { name: '蚂蚁上树', ingredients: ['猪肉', '大葱', '酱油'] },
    { name: '尖椒土豆丝', ingredients: ['辣椒', '土豆'] },
    { name: '凉拌黄瓜', ingredients: ['黄瓜', '大蒜', '醋'] },
    { name: '拍黄瓜', ingredients: ['黄瓜', '大蒜', '醋'] },
    { name: '西兰花炒虾仁', ingredients: ['西兰花', '虾'] },
    { name: '虾仁蒸蛋', ingredients: ['虾', '鸡蛋'] },
    { name: '鸡蛋羹', ingredients: ['鸡蛋'] },
    { name: '小米粥', ingredients: ['小米粥'] },
    { name: '皮蛋瘦肉粥', ingredients: ['皮蛋', '猪肉', '米饭'] },
    { name: '红烧豆腐', ingredients: ['豆腐', '酱油', '白糖'] },
    { name: '家常豆腐', ingredients: ['豆腐', '青椒', '木耳', '洋葱'] },
    { name: '鱼香茄子', ingredients: ['茄子', '猪肉', '大葱', '大蒜', '生姜', '醋', '白糖', '番茄酱'] },
    { name: '干煸豆角', ingredients: ['豆角', '猪肉', '辣椒'] },
    { name: '莴笋炒肉', ingredients: ['莴笋', '猪肉'] },
    { name: '山药排骨汤', ingredients: ['山药', '猪肉'] },
    { name: '馄饨', ingredients: ['馄饨'] },
    { name: '饺子', ingredients: ['饺子'] },
    { name: '包子', ingredients: ['包子'] },
    { name: '蛋炒饭', ingredients: ['米饭', '鸡蛋'] },
    { name: '热干面', ingredients: ['面条', '芝麻酱', '榨菜', '大葱', '辣椒'] }
  ];

  const MAP = {};
  FOODS.forEach(function (f) { MAP[f.name] = f; });

  function findFood(name) {
    if (!name) return null;
    const n = String(name).trim();
    if (MAP[n]) return MAP[n];
    // 包含匹配
    const hit = FOODS.find(function (f) {
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

  // 根据结石类型返回对某食物的判定
  function judge(food, stoneType) {
    if (!food) return null;
    let v;
    if (stoneType === 'uric') v = food.ur;
    else v = food.ox; // calcium 或 unknown 默认按草酸钙（最常见）参考
    let note = food.note;
    if (!stoneType || stoneType === 'unknown') {
      note = '（结石类型未填，暂按草酸钙结石参考；确诊后更准确）' + note;
    }
    return { verdict: v, label: verdictLabel(v), note: note, name: food.name, cat: food.cat };
  }

  global.Knowledge = {
    FOODS: FOODS,
    DISHES: DISHES,
    findFood: findFood,
    judge: judge,
    verdictLabel: verdictLabel
  };
})(window);
