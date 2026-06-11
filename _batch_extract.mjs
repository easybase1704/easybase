// 批量提取所有产品规格数据
import { readFileSync, writeFileSync } from 'fs';

const BASE = 'http://localhost:3456';
const ADMIN = 'http://www.easy-base.com.cn/zfadmin/ProductEdit?oid=';
const TARGET = 'A943F0D33F514FF81963F5599453A1A7'; // 后台 tab

// 中文术语替换（负向预查避免重复：HDMI接口→不会变成HDMI接口接口）
const TERM_MAP = [
  [/\bCPU\b(?!处理器)/g, '处理器'],
  [/\bBIOS\b(?!固件)/g, '固件'],
  [/\bGPU\b(?!显卡)/g, '显卡'],
  [/\bLED\b(?!指示灯)/g, '指示灯'],
  [/\bWIFI\+BT\b/gi, '无线+蓝牙'],
  [/\bWIFI\b/gi, '无线'],
  [/\bBT\b(?!蓝牙)/g, '蓝牙'],
  [/\bSSD\b(?!固态硬盘)/g, '固态硬盘'],
  [/\bDDR4\b(?!内存)/g, 'DDR4内存'],
  [/\bDDR5\b(?!内存)/g, 'DDR5内存'],
  [/\bHDMI\b(?!接口)/g, 'HDMI接口'],
  [/\bVGA\b(?!接口)/g, 'VGA接口'],
  [/\bDP\b(?!接口)/g, 'DP接口'],
  [/\bM\.2\b(?!插槽)/g, 'M.2插槽'],
  [/\bUSB\b(?![0-9.]|接口)/g, 'USB接口'],
  [/\bDC IN\b/gi, '直流输入'],
  [/\bIntel\s*®?\s*/gi, '英特尔® '],
  [/\bIntel\s+HD\s+集成显卡\b/gi, '英特尔® 集成显卡'],
];

function cleanHTML(h) {
  if (!h) return '';
  // 去 JSON 包裹
  if (h.startsWith('{"value":"')) {
    try { h = JSON.parse(h).value; } catch(e) {}
  }
  // 去 colgroup
  h = h.replace(/<colgroup[^>]*>[\s\S]*?<\/colgroup>/gi, '');
  // 只保留 rowspan/colspan 属性
  h = h.replace(/<(\/?)(\w+)([^>]*)>/gi, (m, slash, tag, attrs) => {
    if (slash) return '</' + tag + '>';
    const rs = attrs.match(/rowspan\s*=\s*"(\d+)"/i);
    const cs = attrs.match(/colspan\s*=\s*"(\d+)"/i);
    let keep = '';
    if (rs) keep += ' rowspan="' + rs[1] + '"';
    if (cs) keep += ' colspan="' + cs[1] + '"';
    return '<' + tag + keep + '>';
  });
  // 去 translate 垃圾
  h = h.replace(/<div[^>]*simple-translate[^>]*>[\s\S]*?<\/div>/gi, '');
  // 去空 p
  h = h.replace(/<p>\s*<br\s*\/?>\s*<\/p>\s*$/g, '');
  // 去 &nbsp;
  h = h.replace(/&nbsp;/gi, '');
  // 去 <span>/<strong>/<em>/<b>/<i>/<font>/<p>，保留内容
  h = h.replace(/<\/?(?:span|strong|em|b|i|font|p)\b[^>]*>/gi, '');
  // 去多余空格（中文全角空格→半角，多个空格→单个，> <之间去空格）
  h = h.replace(/　/g, ' ');
  h = h.replace(/[ ]{2,}/g, ' ');
  h = h.replace(/>\s+</g, '><');
  // 去空行
  h = h.replace(/\n\s*\n/g, '\n');
  return h.trim();
}

function translateTerms(h) {
  if (!h) return '';
  for (const [re, cn] of TERM_MAP) {
    h = h.replace(re, cn);
  }
  // 修复 DDR4内存内存 等重复
  h = h.replace(/DDR4内存内存/g, 'DDR4内存');
  h = h.replace(/DDR5内存内存/g, 'DDR5内存');
  return h;
}

function cleanLifekit(h, oid) {
  h = cleanHTML(h);
  if (!h) return '';
  // 纯文本 / ○格式 转 ul
  if (!/<ul|<li|<ol/i.test(h)) {
    const items = h.split(/[；;○]/).filter(s => s.replace(/<[^>]+>/g,'').trim());
    if (items.length > 1) {
      h = '<ul>' + items.map(s => '<li>' + s.replace(/<[^>]+>/g,'').trim() + '</li>').join('') + '</ul>';
    }
  }
  return translateTerms(h);
}

async function extractOne(oid) {
  await fetch(BASE + '/navigate?target=' + TARGET, { method: 'POST', body: ADMIN + oid });
  await new Promise(r => setTimeout(r, 1500));

  const resp = await fetch(BASE + '/eval?target=' + TARGET, {
    method: 'POST',
    body: '(function(){var y=document.querySelector("textarea[name=yiwaibao]");var l=document.querySelector("textarea[name=lifekit]");var n=document.querySelector("input[name=ProName]");return JSON.stringify({n:n?n.value:"",y:y?y.value:"",l:l?l.value:""});})()'
  });
  const d = await resp.json();
  try {
    const r = JSON.parse(d.value);
    return { oid, name: r.n, yiwaibao: r.y, lifekit: r.l };
  } catch(e) {
    return { oid, name: '?', yiwaibao: '', lifekit: '' };
  }
}

async function main() {
  const data = JSON.parse(readFileSync('src/_data/products.json', 'utf8'));
  const total = data.products.length;

  let done = 0, skipped = 0;
  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i];
    // 跳过已有数据的（之前已手动提取的5款）
    if (p.yiwaibao && p.yiwaibao.length > 500) {
      // 重新清洗确保一致性
      p.yiwaibao = translateTerms(cleanHTML(p.yiwaibao));
      p.lifekit = cleanLifekit(p.lifekit, p.oid);
      skipped++;
      if (skipped % 10 === 0) console.log('  跳过已处理: ' + skipped);
      continue;
    }

    try {
      const r = await extractOne(p.oid);
      p.yiwaibao = translateTerms(cleanHTML(r.yiwaibao));
      p.lifekit = cleanLifekit(r.lifekit, p.oid);
      done++;
      console.log('[' + (i+1) + '/' + total + '] oid=' + p.oid + ' ' + p.name + ' yiwaibao=' + (p.yiwaibao||'').length + 'B');
    } catch(e) {
      console.log('[' + (i+1) + '/' + total + '] oid=' + p.oid + ' ' + p.name + ' FAILED: ' + e.message);
    }

    // 每10个保存一次
    if (done % 10 === 0) {
      writeFileSync('src/_data/products.json', JSON.stringify(data, null, 2), 'utf8');
    }
  }

  writeFileSync('src/_data/products.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('');
  console.log('=== 完成 ===');
  console.log('新增提取: ' + done + ' 款');
  console.log('跳过已有: ' + skipped + ' 款');

  // 统计
  const withY = data.products.filter(p => p.yiwaibao && p.yiwaibao.length > 100).length;
  const withL = data.products.filter(p => p.lifekit && p.lifekit.length > 50).length;
  console.log('有规格表: ' + withY + ' / ' + total);
  console.log('有亮点: ' + withL + ' / ' + total);
}

main().catch(e => { console.error(e); process.exit(1); });
