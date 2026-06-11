const http = require('http');
const fs = require('fs');
const path = require('path');

const PROXY = 'http://localhost:3456';
const BASE = 'http://easy-base.com.cn';
const PRODUCTS_PATH = path.join(__dirname, '..', 'src', '_data', 'products.json');

// 缺 duibi 的 10 个产品
const MISSING = [
  { oid: 13, name: 'E60' },
  { oid: 4, name: 'E30' },
  { oid: 10, name: 'E60-CB40' },
  { oid: 5, name: 'V20' },
  { oid: 6, name: 'V12' },
  { oid: 7, name: 'B50' },
  { oid: 8, name: 'B16' },
  { oid: 9, name: 'E20' },
  { oid: 14, name: 'E85' },
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
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
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

async function getDuibi(oid, name) {
  const url = `${BASE}/Home/ProductDetails?id=${oid}`;
  console.log(`[爬取] ${name} (oid=${oid}): ${url}`);

  let targetId;
  try {
    targetId = await newTab(url);
    await new Promise((r) => setTimeout(r, 2000)); // 等页面渲染

    const duibi = await evalJS(targetId, `
      (() => {
        const text = document.body.innerText;
        const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
        // 找到第二个产品名出现的位置
        const name = '${name.replace(/'/g, "\\'")}';
        let count = 0, foundIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i] === name) {
            count++;
            if (count === 2) { foundIdx = i; break; }
          }
        }
        if (foundIdx === -1) return JSON.stringify({error: 'not found', lines: lines.slice(0, 20)});
        // 下一个非空行就是 duibi，直到遇到"样品申请"
        const duibiLines = [];
        for (let i = foundIdx + 1; i < lines.length; i++) {
          if (lines[i] === '样品申请' || lines[i].includes('样品申请')) break;
          if (lines[i].length > 0) duibiLines.push(lines[i]);
        }
        // 合并可能的多行
        let duibi = duibiLines.join('；').trim();
        // 如果太长（超过80字），取第一个句号/分号前的内容
        if (duibi.length > 80) {
          const match = duibi.match(/^(.+?[。；])/);
          if (match) duibi = match[1];
          else duibi = duibi.substring(0, 60) + '…';
        }
        return JSON.stringify({duibi: duibi, raw: duibiLines});
      })()
    `);

    const parsed = JSON.parse(duibi);
    if (parsed.error) {
      console.log(`  ⚠ 结构异常: ${parsed.error}`);
      console.log(`  前20行: ${JSON.stringify(parsed.lines)}`);
      return null;
    }
    console.log(`  → duibi: "${parsed.duibi}"`);
    return parsed.duibi;
  } catch (err) {
    console.error(`  ✗ 失败: ${err.message}`);
    return null;
  } finally {
    if (targetId) {
      try {
        await closeTab(targetId);
      } catch {}
    }
  }
}

(async () => {
  console.log('=== 开始爬取 10 个产品的 duibi ===\n');

  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
  const results = {};

  for (const item of MISSING) {
    const duibi = await getDuibi(item.oid, item.name);
    if (duibi) {
      results[item.oid] = duibi;
      // 更新内存中的数据
      const prod = data.products.find((p) => p.oid === item.oid);
      if (prod) prod.duibi = duibi;
    }
    // 每个请求间隔 500ms，避免对老网站造成压力
    await new Promise((r) => setTimeout(r, 500));
  }

  // 写回文件
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('\n=== 完成 ===');
  console.log(`更新了 ${Object.keys(results).length} 个产品的 duibi`);
  console.log('写入: ' + PRODUCTS_PATH);

  // 打印结果汇总
  console.log('\n结果汇总:');
  for (const [oid, duibi] of Object.entries(results)) {
    const name = MISSING.find((m) => m.oid === parseInt(oid)).name;
    console.log(`  ${name} (oid=${oid}): ${duibi}`);
  }
})();
