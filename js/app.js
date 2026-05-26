// ============================================================
// MC材料拆拆姬 — 完全重写 v4
// ============================================================

// ============ 全局状态 ============
var items = [];
var recipesShaped = [];
var recipesShapeless = [];
var recipesSmelting = [];
var recipesStonecutting = [];
var langEn = {};
var langZh = {};
var zhToReg = {};
var enToReg = {};
var pendingDecomposeIdx = -1;
var sfx = new Audio('res/audio/1.ogg');
sfx.volume = 0.6;

// ============ 工具函数 ============

function imgPath(regName) {
  if (regName.indexOf('#any:') === 0) {
    var label = regName.replace('#any:', '');
    if (label === '任意木板') return 'res/pic/item/minecraft__oak_planks.png';
    if (label === '任意原木') return 'res/pic/item/minecraft__oak_log.png';
    if (label === '任意去皮原木') return 'res/pic/item/minecraft__stripped_oak_log.png';
    if (label === '任意木头') return 'res/pic/item/minecraft__oak_wood.png';
    if (label === '任意去皮木头') return 'res/pic/item/minecraft__stripped_oak_wood.png';
    if (label === '任意羊毛') return 'res/pic/item/minecraft__white_wool.png';
    return 'res/pic/item/minecraft__barrier.png';
  }
  var clean = (regName || '').replace('minecraft:', '');
  return 'res/pic/item/minecraft__' + clean + '.png';
}

function regToLangKey(regName) { return 'block.minecraft.' + (regName||'').replace('minecraft:', ''); }
function regToItemLangKey(regName) { return 'item.minecraft.' + (regName||'').replace('minecraft:', ''); }

function displayName(name, lang) {
  if (name.indexOf('#any:') === 0) return name.replace('#any:', '');
  var dict = lang === 'zh' ? langZh : langEn;
  var key = regToLangKey(name);
  if (dict[key]) return dict[key];
  var key2 = regToItemLangKey(name);
  if (dict[key2]) return dict[key2];
  return name.replace('minecraft:', '').replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function zhName(name) { return displayName(name, 'zh'); }
function enName(name) { return displayName(name, 'en'); }

function resolveItemName(name) {
  var clean = name.trim().toLowerCase();
  if (clean.indexOf('minecraft:') === 0) return clean;
  if (/^[a-z0-9_]+$/.test(clean)) return 'minecraft:' + clean;
  if (zhToReg[name.trim()]) return zhToReg[name.trim()];
  if (enToReg[name.trim()]) return enToReg[name.trim()];
  for (var key in zhToReg) {
    if (zhToReg.hasOwnProperty(key) && key.indexOf(name.trim()) >= 0) return zhToReg[key];
  }
  return 'minecraft:' + clean.replace(/[^a-z0-9_]/g, '_');
}

function fmtCount(n) {
  if (typeof n !== 'number') return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============ 构建反向映射 ============

function buildReverseMap(langDict, targetMap) {
  for (var key in langDict) {
    if (!langDict.hasOwnProperty(key)) continue;
    var val = langDict[key].trim();
    if (!val) continue;
    var match = key.match(/^(?:block|item)\.minecraft\.(.+)$/);
    if (match) {
      var regName = 'minecraft:' + match[1];
      if (!targetMap[val]) targetMap[val] = regName;
    }
  }
}

// ============ 配料值解析 ============

// 判断多选配料的手感（任意木板、任意原木等）
function guessAnyLabel(names) {
  if (!names || names.length < 2) return '';

  // 检查所有物品是否都是某种类型的变体
  var planks = {oak_planks:1,spruce_planks:1,birch_planks:1,jungle_planks:1,acacia_planks:1,dark_oak_planks:1,pale_oak_planks:1,crimson_planks:1,warped_planks:1,mangrove_planks:1,bamboo_planks:1,cherry_planks:1};
  var logs = {oak_log:1,spruce_log:1,birch_log:1,jungle_log:1,acacia_log:1,dark_oak_log:1,pale_oak_log:1,crimson_stem:1,warped_stem:1,mangrove_log:1,cherry_log:1};
  var wool = {white_wool:1,orange_wool:1,magenta_wool:1,light_blue_wool:1,yellow_wool:1,lime_wool:1,pink_wool:1,gray_wool:1,light_gray_wool:1,cyan_wool:1,purple_wool:1,blue_wool:1,brown_wool:1,green_wool:1,red_wool:1,black_wool:1};
  var strippedLogs = {stripped_oak_log:1,stripped_spruce_log:1,stripped_birch_log:1,stripped_jungle_log:1,stripped_acacia_log:1,stripped_dark_oak_log:1,stripped_pale_oak_log:1,stripped_crimson_stem:1,stripped_warped_stem:1,stripped_mangrove_log:1,stripped_cherry_log:1};
  var wood = {oak_wood:1,spruce_wood:1,birch_wood:1,jungle_wood:1,acacia_wood:1,dark_oak_wood:1,pale_oak_wood:1,crimson_hyphae:1,warped_hyphae:1,mangrove_wood:1,cherry_wood:1};
  var strippedWood = {stripped_oak_wood:1,stripped_spruce_wood:1,stripped_birch_wood:1,stripped_jungle_wood:1,stripped_acacia_wood:1,stripped_dark_oak_wood:1,stripped_pale_oak_wood:1,stripped_crimson_hyphae:1,stripped_warped_hyphae:1,stripped_mangrove_wood:1,stripped_cherry_wood:1};

  function matchSet(set) {
    var count = 0;
    for (var i = 0; i < names.length; i++) {
      if (set[names[i]]) count++;
    }
    return count >= names.length - 1; // 允许1个不匹配（如丢失的版本）
  }

  if (matchSet(planks)) return '任意木板';
  if (matchSet(logs)) return '任意原木';
  if (matchSet(wool)) return '任意羊毛';
  if (matchSet(strippedLogs)) return '任意去皮原木';
  if (matchSet(wood)) return '任意木头';
  if (matchSet(strippedWood)) return '任意去皮木头';
  return '';
}function pickIngredientValue(val) {
  if (!val) return null;
  var diffKey = val['neoforge:ingredient_type'] || val.neoforge_ingredient_type;
  if (diffKey === 'neoforge:difference') {
    if (val.base && val.base.length > 0) {
      return { name: String(val.base[0]), alt: val.base.length > 1, any: false, anyLabel: '' };
    }
    return null;
  }
  var value = val.value;
  if (!value) return null;
  if (Array.isArray(value)) {
    var names = value.map(function(n) { return String(n).replace('minecraft:', ''); });
    var anyLabel = guessAnyLabel(names);
    return { name: String(value[0]), alt: true, any: true, anyLabel: anyLabel };
  }
  return { name: String(value), alt: false, any: false, anyLabel: '' };
}

function expandIngredientValues(val) {
  if (!val) return [];
  var diffKey = val['neoforge:ingredient_type'] || val.neoforge_ingredient_type;
  if (diffKey === 'neoforge:difference') return val.base ? val.base.map(String) : [];
  var value = val.value;
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

// ============ 配方工具 ============

function findRecipes(regName) {
  var results = [];
  var clean = regName.replace('minecraft:', '');
  var allArrays = [recipesShaped, recipesShapeless, recipesSmelting, recipesStonecutting];
  var typeNames = ['shaped', 'shapeless', 'smelting', 'stonecutting'];

  for (var a = 0; a < allArrays.length; a++) {
    var arr = allArrays[a];
    for (var r = 0; r < arr.length; r++) {
      var out = arr[r].output && arr[r].output['1'];
      if (!out) continue;
      if (out.item && out.item.replace('minecraft:', '') === clean) {
        results.push({ type: typeNames[a], recipe: arr[r] });
      }
    }
  }
  return results;
}

function getOutputCount(recipe) {
  var out = recipe.output && recipe.output['1'];
  return out ? (Number(out.count) || 1) : 1;
}

// 取直接原料，多选配料用虚拟标签（如 #any:任意木板）
function getIngredients(recipe) {
  var ings = [];
  for (var key in recipe.input) {
    var val = recipe.input[key];
    if (!val) continue;
    var count = Number(val.count) || 1;
    var picked = pickIngredientValue(val);
    if (!picked) continue;
    // 多选：用 #any:标签 作为虚拟物品名
    var name = (picked.any && picked.anyLabel) ? ('#any:' + picked.anyLabel) : picked.name;
    var existing = null;
    for (var i = 0; i < ings.length; i++) {
      if (ings[i].name === name) { existing = ings[i]; break; }
    }
    if (existing) { existing.count += count; }
    else { ings.push({ name: name, count: count }); }
  }
  return ings;
}

// ============ CSV 导入解析 ============

function parseCSV(text) {
  var lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  var headerLine = lines[0].replace(/\r/g, '');
  var headers = parseCSVLine(headerLine);

  var itemIdx = -1, totalIdx = -1, missingIdx = -1, availIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].replace(/^"/, '').replace(/"$/, '').toLowerCase();
    if (/item/i.test(h)) itemIdx = i;
    if (/total/i.test(h)) totalIdx = i;
    if (/missing/i.test(h)) missingIdx = i;
    if (/available/i.test(h)) availIdx = i;
  }
  if (itemIdx === -1 || totalIdx === -1) {
    showToast("CSV 格式喵喵不对啦 -- 找不到 Item 或 Total 列喵");
    return [];
  }

  var result = [];
  for (var i = 1; i < lines.length; i++) {
    var vals = parseCSVLine(lines[i].replace(/\r/g, ''));
    if (vals.length <= itemIdx) continue;
    var name = vals[itemIdx].trim();
    if (!name) continue;
    var total = parseInt(vals[totalIdx]) || 0;
    var missing = missingIdx >= 0 ? (parseInt(vals[missingIdx]) || 0) : total;
    var available = availIdx >= 0 ? (parseInt(vals[availIdx]) || 0) : 0;
    var regName = resolveItemName(name);
    result.push({
      rawName: name, regName: regName, total: total,
      missing: missing, available: available, decomposedCount: missing
    });
  }
  return result;
}

function parseCSVLine(str) {
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < str.length && str[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ============ 渲染 ============

window.onerror = function(msg, url, line) {
  console.error('JS error:', msg, 'line:', line);
  return true;
};

function renderItems() {
  var container = document.getElementById('itemList');
  if (!container) { console.error('itemList not found'); return; }
  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>还没有数据呢喵~</p></div>';
    return;
  }

  try {
    var html = '';
    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx];
      var zh = zhName(item.regName);
      var en = enName(item.regName);
      var imgSrc = imgPath(item.regName);
          var safeName = ("" + (zh || item.rawName)).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      var safeReg = ("" + item.regName).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      var safeEn = ("" + en).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      html += '<div class="item-row" data-index="' + idx + '">';
      html += '  <div class="item-icon" onclick="showRecipeModal(\'' + safeReg.replace(/'/g, "\\'") + '\')">';
      html += '    <img src="' + imgSrc + '" alt="' + safeEn + '" loading="lazy" onerror="this.style.display=\'none\'">';
      html += '  </div>';
      html += '  <div class="item-info">';
      html += '    <div class="item-name">' + safeName + '</div>';
      html += '    <div style="font-size:11px;color:var(--text-muted);">' + safeReg + '</div>';
      html += '  </div>';
      html += '  <div class="item-quantity">';
      html += '    <div class="quantity-main">' + fmtCount(item.decomposedCount) + '</div>';
      html += '    <div class="quantity-detail">已有 ' + fmtCount(item.available) + ' / 共 ' + fmtCount(item.total) + ' 喵' + '</div>';
      html += '  </div>';
      html += '  <button class="replace-btn" onclick="requestDecompose(' + idx + ')">' + '🔨 拆开～</button>';
      html += '</div>';
    }
    container.innerHTML = html;
    updateStats();
  } catch(e) {
    console.error('renderItems error:', e);
    container.innerHTML = '<div style="padding:20px;color:#c00;">渲染出错了喵: ' + e.message + '</div>';
  }
}

function updateStats() {
  var el = document.getElementById('itemCount');
  if (el) el.textContent = '共' + items.length + '种东西';
  var total = 0;
  for (var i = 0; i < items.length; i++) total += items[i].decomposedCount;
  var el2 = document.getElementById('totalCount');
  if (el2) el2.textContent = '共 ' + fmtCount(total) + ' 个喵';
}

// ============ 配方弹窗 ============

var typeLabels = { shaped: '有序合成喵', shapeless: '无序合成喵', smelting: '熔炉熔炼喵', stonecutting: '切石机喵' };

function showRecipeModal(regName) {
  var title = document.getElementById('modalTitle');
  var body = document.getElementById('modalBody');
  var zh = zhName(regName);
  title.textContent = zh + ' 的配方喵～';

  var allRecipes = findRecipes(regName);
  if (allRecipes.length === 0) {
    body.innerHTML = '<div class="no-recipe"><div class="icon">😿</div><p>没有找到配方呢喵…</p></div>';
    document.getElementById('modalOverlay').style.display = 'flex';
    return;
  }

  var html = '';
  for (var ri = 0; ri < allRecipes.length; ri++) {
    var r = allRecipes[ri];
    var typeStr = typeLabels[r.type] || r.type;
    var outCount = getOutputCount(r.recipe);
    var outItem = r.recipe.output && r.recipe.output['1'] ? r.recipe.output['1'].item : '';

    html += '<div class="recipe-card">';
    html += '  <div class="recipe-label">' + typeStr + '</div>';
    html += '  <div class="crafting-grid">';

    if (r.type === 'shaped') {
      html += '<div class="crafting-3x3">';
      for (var cell = 1; cell <= 9; cell++) {
        var val = r.recipe.input && r.recipe.input[cell.toString()];
        html += '<div class="crafting-slot">';
        if (val) {
          var picked = pickIngredientValue(val);
          if (picked) {
            var pName = (picked.any && picked.anyLabel) ? '#any:' + picked.anyLabel : picked.name;
            html += '<img src="' + imgPath(pName) + '" loading="lazy" onerror="this.style.display=\'none\'">';
            if (picked.alt) html += '<div class="slot-mark">*</div>';
            if (Number(val.count) > 1) html += '<span class="slot-count">' + Number(val.count) + '</span>';
          }
        }
        html += '</div>';
      }
      html += '</div>';
    } else if (r.type === 'shapeless') {
      html += '<div class="crafting-3x3">';
      var inputs = [];
      for (var k in r.recipe.input) { if (r.recipe.input.hasOwnProperty(k)) inputs.push(r.recipe.input[k]); }
      for (var cell = 0; cell < 9; cell++) {
        var val = cell < inputs.length ? inputs[cell] : null;
        html += '<div class="crafting-slot">';
        if (val) {
          var picked = pickIngredientValue(val);
          if (picked) {
            var pName = (picked.any && picked.anyLabel) ? '#any:' + picked.anyLabel : picked.name;
            html += '<img src="' + imgPath(pName) + '" loading="lazy" onerror="this.style.display=\'none\'">';
            if (picked.alt) html += '<div class="slot-mark">*</div>';
            if (Number(val.count) > 1) html += '<span class="slot-count">' + Number(val.count) + '</span>';
          }
        }
        html += '</div>';
      }
      html += '</div>';
    } else if (r.type === 'smelting' || r.type === 'stonecutting') {
      var firstKey = null;
      for (var k in r.recipe.input) { firstKey = k; break; }
      var val = firstKey ? r.recipe.input[firstKey] : null;
      var picked = val ? pickIngredientValue(val) : null;
      html += '<div style="display:flex;align-items:center;gap:12px;padding:6px;">';
      html += '  <div class="crafting-slot" style="width:44px;height:44px;">';
      if (picked) html += '<img src="' + imgPath(picked.name) + '" loading="lazy" onerror="this.style.display=\'none\'">';
      html += '  </div>';
      html += '  <span class="crafting-arrow" style="font-size:22px;">&#8594;</span>';
      html += '</div>';
    }

    html += '  <div class="crafting-result">';
    html += '    <div class="crafting-result-icon">';
    if (outItem) html += '<img src="' + imgPath(outItem) + '" loading="lazy" onerror="this.style.display=\'none\'">';
    html += '    </div>';
    html += '    <div class="crafting-result-count">' + outCount + '</div>';
    html += '  </div>';
    html += '</div>'; // crafting-grid

    var ings = getIngredients(r.recipe);
    if (ings.length > 0) {
      html += '<div class="recipe-ingredients-list">';
      for (var i = 0; i < ings.length; i++) {
        var ingZh = zhName(ings[i].name);
        html += '<div class="recipe-ingredient-tag">';
        html += '  <span class="ing-count">' + ings[i].count + '</span>';
        html += '  <span class="ing-name">' + ingZh + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>'; // recipe-card
  }

  body.innerHTML = html;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('confirmOverlay').style.display = 'none';
  pendingDecomposeIdx = -1;
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) closeModal();
  const colors = ['#ff6baa', '#ff4690', '#ffa3cc', '#ffcce3', '#4ecca3', '#d4a017', '#ff8a80'];
  const count = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.floor(Math.random() * 6);
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.floor(Math.random() * 50);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.cssText = 'left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';--dx:' + dx + 'px;--dy:' + dy + 'px;';
    document.body.appendChild(p);
    setTimeout(function() { p.remove(); }, 700);
  }
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ============ 拆解（仅一步，不递归） ============

function requestDecompose(idx) {
  try {
    var item = items[idx];
    if (!item) return;

    var zh = zhName(item.regName);
    var recipeResults = findRecipes(item.regName);
    if (recipeResults.length === 0) {
      showToast((zh || item.regName) + ' 没有可以拆的配方喵～');
      return;
    }

    var r = recipeResults[0];
    var ings = getIngredients(r.recipe);
    var outCount = getOutputCount(r.recipe);
    var factor = Math.ceil(item.decomposedCount / outCount);

    var detailHtml = '<p style="margin-bottom:10px;">要拆掉 <strong>' + (zh || item.rawName) + ' x' + fmtCount(item.decomposedCount) + '</strong> 吗？</p>';
    detailHtml += '<p style="font-weight:700;margin:6px 0;">会变成这些喵：</p>';
    for (var i = 0; i < ings.length; i++) {
      var ingZh = zhName(ings[i].name);
      var total = ings[i].count * factor;
      detailHtml += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;">';
      detailHtml += '  <img src="' + imgPath(ings[i].name) + '" width="22" height="22" loading="lazy" onerror="this.style.display=\'none\'">';
      detailHtml += '  <span>' + ingZh + ' x' + fmtCount(total) + '</span>';
      detailHtml += '</div>';
    }

    document.getElementById('confirmTitle').textContent = '喵喵确认';
    document.getElementById('confirmText').innerHTML = detailHtml;
    document.getElementById('confirmOverlay').style.display = 'flex';
    pendingDecomposeIdx = idx;
  } catch(e) {
    console.error('requestDecompose error:', e);
    showToast('拆解出错啦喵: ' + e.message);
  }
}

function confirmDecompose() {
  // 特殊：确认回去（清空数据）
  if (pendingDecomposeIdx === -2) {
    closeModal();
    goToImport();
    return;
  }

  if (pendingDecomposeIdx < 0) return;
  var item = items[pendingDecomposeIdx];
  if (!item) return;

  // 播放拆解音效
  if (sfx) { sfx.currentTime = 0; sfx.play().catch(function(){}); }

  var recipeResults = findRecipes(item.regName);
  if (recipeResults.length === 0) { showToast('拆不了喵…'); closeModal(); return; }

  var r = recipeResults[0];
  var ings = getIngredients(r.recipe);
  var outCount = getOutputCount(r.recipe);
  var factor = Math.ceil(item.decomposedCount / outCount);

  items.splice(pendingDecomposeIdx, 1);
  for (var i = 0; i < ings.length; i++) {
    var total = ings[i].count * factor;
    var existing = null;
    for (var j = 0; j < items.length; j++) {
      if (items[j].regName === ings[i].name) { existing = items[j]; break; }
    }
    if (existing) {
      existing.decomposedCount += total;
      existing.total += total;
    } else {
      items.push({
        rawName: ings[i].name, regName: ings[i].name, total: total,
        missing: total, available: 0, decomposedCount: total
      });
    }
  }

  showToast('拆完啦喵～✨');
  closeModal();
  renderItems();
}

// ============ Toast ============


// ============ Toast particles ============


function spawnToastParticles() {
  var toast = document.getElementById('toast');
  if (!toast) return;
  var rect = toast.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  var colors = ['#ff6baa', '#ff4690', '#ffa3cc', '#ffcce3', '#4ecca3', '#d4a017', '#ff8a80'];
  var count = 8 + Math.floor(Math.random() * 6);
  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    var size = 4 + Math.floor(Math.random() * 6);
    var angle = Math.random() * Math.PI * 2;
    var dist = 30 + Math.floor(Math.random() * 50);
    var dx = Math.cos(angle) * dist;
    var dy = Math.sin(angle) * dist;
    p.style.cssText = 'left:' + (cx + Math.random() * 10 - 5) + 'px;top:' + (cy + Math.random() * 6 - 3) + 'px;width:' + size + 'px;height:' + size + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';--dx:' + dx + 'px;--dy:' + dy + 'px;';
    document.body.appendChild(p);
    (function(pp) { setTimeout(function() { pp.remove(); }, 700); })(p);
  }
}
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;

  
  toast.classList.add('show');
  spawnToastParticles();
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ============ 导出 CSV ============

function exportCSV() {
  if (!items.length) { showToast('没有数据可以导出喵～'); return; }
  var csv = 'Item,Total,Missing,Available\n';
  for (var i = 0; i < items.length; i++) {
    csv += '"' + items[i].regName + '",' + items[i].total + ',' + items[i].decomposedCount + ',' + items[i].available + '\n';
  }
  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'MC材料清单_导出.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('导出完成啦喵！');
}

// ============ 数据加载 ============

function initData() {
  if (typeof LANG_ZH === 'object') { for (var k in LANG_ZH) langZh[k] = LANG_ZH[k]; }
  if (typeof LANG_EN === 'object') { for (var k in LANG_EN) langEn[k] = LANG_EN[k]; }
  if (RECIPES_SHAPED && RECIPES_SHAPED.recipes) recipesShaped = RECIPES_SHAPED.recipes;
  if (RECIPES_SHAPELESS && RECIPES_SHAPELESS.recipes) recipesShapeless = RECIPES_SHAPELESS.recipes;
  if (RECIPES_SMELTING && RECIPES_SMELTING.recipes) recipesSmelting = RECIPES_SMELTING.recipes;
  if (RECIPES_STONECUTTING && RECIPES_STONECUTTING.recipes) recipesStonecutting = RECIPES_STONECUTTING.recipes;

  buildReverseMap(langZh, zhToReg);
  buildReverseMap(langEn, enToReg);
}

// ============ 页面切换 ============

function goToImport() {
  document.getElementById('import-page').classList.add('active');
  document.getElementById('detail-page').classList.remove('active');
  items = [];
  renderItems();
}

function goToDetail() {
  document.getElementById('import-page').classList.remove('active');
  document.getElementById('detail-page').classList.add('active');
}

// ============ 文件导入 ============

function setupImport() {
  var fileInput = document.getElementById('fileInput');
  var importBtn = document.getElementById('importBtn');
  importBtn.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    processFile(file);
  });

  var importArea = document.querySelector('.import-area');
  if (importArea) {
    importArea.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--primary)'; });
    importArea.addEventListener('dragleave', function(e) { e.preventDefault(); this.style.borderColor = ''; });
    importArea.addEventListener('drop', function(e) {
      e.preventDefault(); this.style.borderColor = '';
      var files = e.dataTransfer.files;
      if (files.length) processFile(files[0]);
    });
  }
}

function processFile(file) {
  // 重置 input，允许重复导入同一文件
  var fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
  if (!file.name.endsWith('.csv')) { showToast('只能导入 CSV 文件哦喵～'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var parsed = parseCSV(e.target.result);
      if (!parsed.length) return;
      items = parsed;
      showToast('导入成功啦喵！✨ 共 ' + items.length + ' 种物品喵～');
      var fn = document.getElementById('fileName');
      if (fn) fn.textContent = file.name;
      goToDetail();
      renderItems();
    } catch(e) {
      showToast('导入出错啦喵: ' + e.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', function() {
  initData();
  setupImport();

  var backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', function() {
    if (items.length === 0) { goToImport(); return; }
    // 用和拆解一致的确认弹窗
    document.getElementById('confirmTitle').textContent = '确认回去喵？';
    document.getElementById('confirmText').innerHTML = '<p>回去会清空所有已导入的数据哦喵～<br>确定要回去吗？</p>';
    document.getElementById('confirmOverlay').style.display = 'flex';
    pendingDecomposeIdx = -2; // 特殊标记：不是拆解，是回去
  });

  var confirmOk = document.getElementById('confirmOkBtn');
  if (confirmOk) confirmOk.addEventListener('click', confirmDecompose);
  var confirmCancel = document.getElementById('confirmCancelBtn');
  if (confirmCancel) confirmCancel.addEventListener('click', closeModal);
});
