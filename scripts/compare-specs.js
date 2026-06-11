const http = require('http');
const fs = require('fs');
const path = require('path');

const PROXY = 'http://localhost:3456';
const BASE = 'http://easy-base.com.cn';
const PRODUCTS_PATH = path.join(__dirname, '..', 'src', '_data', 'products.json');

// 抽样的 5 个产品
const SAMPLES = [
  { oid: 1, name: 'BV10/12/16' },
  { oid: 3, name: 'B25' },
  { oid: 14, name: 'E85' },
  { oid: 11, name: 'B18' },
  { oid: 15, name: 'EB16' },
];

function req(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(PROXY + endpoint);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'text/plain' },
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function newTab(url) {
  const res = await req('POST', '/new', url);
  return res.targetId;
}

async function closeTab(targetId) {
  await req('GET', `/close?target=${targetId}`);
}

async function evalJS(targetId, js) {
  const res = await req('POST', `/eval?target=${targetId}`, js);
  return res.value;
}

async function getSpecText(oid, name) {
  const url = `${BASE}/Home/ProductDetails?id=${oid}`;
  console.log(`[爬取] ${name} (oid=${oid})`);

  let targetId;
  try {
    targetId = await newTab(url);
    await new Promise((r) => setTimeout(r, 2000));

    // 提取规格区域的纯文本（跳过图片和导航）
    const specText = await evalJS(targetId, `
      (() => {
        const body = document.body.innerText;
        // 从"样品申请"后面开始提取
        const idx = body.indexOf('样品申请');
        if (idx === -1) return JSON.stringify({error: 'no 样品申请'});
        const after = body.substring(idx);
        // 取前 2000 字作为规格文本
        return JSON.stringify({text: after.substring(0, 2000)});
      })()
    `);

    const parsed = JSON.parse(specText);
    if (parsed.error) {
      console.log(`  ⚠ ${parsed.error}`);
      return null;
    }
    return parsed.text;
  } catch (err) {
    console.error(`  ✗ 失败: ${err.message}`);
    return null;
  } finally {
    if (targetId) {
      try { await closeTab(targetId); } catch {}
    }
  }
}

// 把 HTML 规格表转成纯文本用于对比
function htmlToText(html) {
  return html
    .replace(/<[^>]+>/g, '\t')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\t+/g, '\t')
    .replace(/\n+/g, '\n')
    .trim();
}

(function main() {
  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

  for (const sample of SAMPLES) {
    const prod = data.products.find((p) => p.oid === sample.oid);
    if (!prod) {
      console.log(`${sample.name}: 未找到`);
      continue;
    }

    console.log(`\n=== ${sample.name} (oid=${sample.oid}) ===`);

    // 本地数据统计
    const localHtml = prod.yiwaibao || '';
    const localText = htmlToText(localHtml);
    const localLen = localText.length;
    const localLines = localText.split('\n').filter((l) => l.trim()).length;

    console.log(`本地 yiwaibao: ${localLen} 字符, ~${localLines} 行`);
    console.log(`本地 duibi: "${prod.duibi}"`);
    console.log(`本地 lifekit 长度: ${(prod.lifekit || '').length} 字符`);

    // 检查常见问题
    const issues = [];
    if (localHtml.includes('接口接口')) issues.push('含"接口接口"重复词');
    if (localHtml.includes('插槽插槽')) issues.push('含"插槽插槽"重复词');
    if (localHtml.includes(' <')) issues.push('含截断标签  <');
    if (localHtml.includes('</div></div></div>')) issues.push('lifekit 含多余闭合标签');
    if (issues.length > 0) {
      console.log(`⚠ 问题: ${issues.join(', ')}`);
    } else {
      console.log('✅ 无明显格式问题');
    }
  }

  console.log('\n=== 完成 ===');
})();
