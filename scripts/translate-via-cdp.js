const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(__dirname, '..', 'src', '_data', 'products.json');
const BROWSER_WS = 'http://localhost:9222';
const BATCH_MAX = 4000;
const SEPARATOR = '\n【#】\n';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 收集所有唯一文本
function collectTexts(products) {
  const duibiSet = new Set();
  const htmlTextSet = new Set();

  for (const product of products) {
    if (product.duibi && product.duibi.trim()) {
      duibiSet.add(product.duibi.trim());
    }
    for (const field of ['yiwaibao', 'lifekit']) {
      if (!product[field]) continue;
      const matches = product[field].matchAll(/>([^<]+)</g);
      for (const m of matches) {
        const text = m[1].trim();
        if (text && /[一-鿿]/.test(text) && text.length >= 2) {
          htmlTextSet.add(text);
        }
      }
    }
  }
  return { duibiTexts: [...duibiSet], htmlTexts: [...htmlTextSet] };
}

// 把文本列表分组成批次
function makeBatches(texts) {
  const batches = [];
  let current = [];
  let currentLen = 0;
  for (const text of texts) {
    const len = text.length + SEPARATOR.length;
    if (currentLen + len > BATCH_MAX && current.length > 0) {
      batches.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(text);
    currentLen += len;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function main() {
  console.log('1. 连接浏览器...');
  const res = await fetch(`${BROWSER_WS}/json/version`);
  const { webSocketDebuggerUrl } = await res.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
  console.log('   已连接到', webSocketDebuggerUrl);

  console.log('2. 读取产品数据...');
  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
  const { duibiTexts, htmlTexts } = collectTexts(data.products);
  const allTexts = [...duibiTexts, ...htmlTexts];
  console.log(`   duibi: ${duibiTexts.length}, HTML文本: ${htmlTexts.length}, 总计: ${allTexts.length}`);

  const batches = makeBatches(allTexts);
  console.log(`3. 分成 ${batches.length} 批`);

  console.log('4. 打开百度翻译...');
  const page = await browser.newPage();
  await page.goto('https://fanyi.baidu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // 关闭可能的弹窗
  try {
    await page.evaluate(() => {
      const close = document.querySelector('.desktop-guide-close, .guide-close, .app-guide-close, .close-btn');
      if (close) close.click();
    });
  } catch (e) { /* ignore */ }
  await sleep(500);

  // 确定输入框和输出框
  const inputSel = await page.evaluate(() => {
    // 尝试各种可能的输入选择器
    const sels = [
      '#baidu_translate_input',
      'textarea[placeholder]',
      '.textarea-container textarea',
      '.input-container textarea',
      '.source-text',
      '[contenteditable="true"]',
      'textarea',
    ];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) return { sel, tag: el.tagName, hasContentEditable: el.contentEditable };
    }
    return null;
  });
  console.log('   输入框:', JSON.stringify(inputSel));

  if (!inputSel) {
    console.log('   尝试打印页面结构...');
    const body = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
    console.log(body);
    await browser.close();
    return;
  }

  // 翻译所有批次
  const translationMap = {};
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const inputText = batch.join(SEPARATOR);
    console.log(`\n--- 批次 ${bi + 1}/${batches.length} (${inputText.length} 字符, ${batch.length} 段) ---`);

    // 清空输入框并填入文本
    await page.evaluate((sel, text) => {
      const el = document.querySelector(sel);
      if (!el) return 'no element';
      if (el.contentEditable === 'true') {
        el.textContent = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return 'ok';
    }, inputSel.sel, inputText);

    // 等待翻译完成
    console.log('   等待翻译...');
    let translated = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(1000);
      translated = await page.evaluate(() => {
        // 尝试各种输出选择器
        const outSels = [
          '.trans-content',
          '.target-output',
          '.output-bd .output-src',
          '.translation-output',
          '.output-container .target-text',
          '.trans-result',
        ];
        for (const sel of outSels) {
          const el = document.querySelector(sel);
          if (el && el.textContent && el.textContent.trim().length > 5) {
            return { sel, text: el.textContent.trim() };
          }
        }
        return null;
      });
      if (translated && translated.text.length > inputText.length * 0.3) {
        break;
      }
      translated = null;
      if (attempt % 5 === 4) console.log(`   尝试 ${attempt + 1}/20...`);
    }

    if (!translated) {
      console.log('   ❌ 翻译超时，跳过此批次');
      continue;
    }

    console.log(`   输出选择器: ${translated.sel}, 输出长度: ${translated.text.length}`);

    // 按分隔符拆分
    const translatedParts = translated.text.split(/【#】/).map(s => s.trim()).filter(Boolean);
    console.log(`   拆分后段数: ${translatedParts.length}, 期望: ${batch.length}`);

    for (let i = 0; i < Math.min(batch.length, translatedParts.length); i++) {
      translationMap[batch[i]] = translatedParts[i];
    }

    // 批次间延时
    if (bi < batches.length - 1) await sleep(1500);
  }

  console.log(`\n5. 翻译完成，共 ${Object.keys(translationMap).length} 条`);

  // 应用翻译到产品
  console.log('6. 应用翻译到产品数据...');
  for (const product of data.products) {
    // duibi
    if (product.duibi && product.duibi.trim()) {
      product.duibiEn = translationMap[product.duibi.trim()] || product.duibi;
    } else {
      product.duibiEn = '';
    }

    // yiwaibao - 替换 HTML 中的文本节点
    if (product.yiwaibao) {
      product.yiwaibaoEn = product.yiwaibao.replace(/>([^<]+)</g, (match, text) => {
        const trimmed = text.trim();
        if (translationMap[trimmed]) {
          return '>' + text.replace(trimmed, translationMap[trimmed]) + '<';
        }
        return match;
      });
    } else {
      product.yiwaibaoEn = '';
    }

    // lifekit
    if (product.lifekit) {
      product.lifekitEn = product.lifekit.replace(/>([^<]+)</g, (match, text) => {
        const trimmed = text.trim();
        if (translationMap[trimmed]) {
          return '>' + text.replace(trimmed, translationMap[trimmed]) + '<';
        }
        return match;
      });
    } else {
      product.lifekitEn = '';
    }
  }

  // 保存
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('7. 保存完成!');

  await page.close();
  await browser.disconnect();
  console.log('全部完成!');
}

main().catch(e => { console.error(e); process.exit(1); });
