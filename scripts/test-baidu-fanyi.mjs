import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3456,
      path: path, method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body, 'utf-8');
    req.end();
  });
}

async function main() {
  let r;

  // 先清空再设置文本
  r = await post('/eval?target=CED50A28955615739C06B2A2F1E9C1CF', `
    var ed = document.querySelector("[contenteditable=true]");
    ed.focus();
    ed.textContent = "";
    ed.dispatchEvent(new Event("input", {bubbles: true}));
    "cleared"
  `);
  console.log('clear:', r);

  await new Promise(r => setTimeout(r, 500));

  // 用 textContent 设置并触发多种事件
  r = await post('/eval?target=CED50A28955615739C06B2A2F1E9C1CF', `
    var ed = document.querySelector("[contenteditable=true]");
    ed.focus();
    ed.innerHTML = "处理器";
    ed.dispatchEvent(new InputEvent("input", {bubbles: true, cancelable: true}));
    ed.dispatchEvent(new Event("change", {bubbles: true}));
    ed.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true}));
    "set: " + ed.textContent
  `);
  console.log('set:', r);

  await new Promise(r => setTimeout(r, 4000));

  // 检查右面板
  r = await post('/eval?target=CED50A28955615739C06B2A2F1E9C1CF', `
    var ed = document.querySelector("[contenteditable=true]");
    var pp = ed.parentElement.parentElement.parentElement.parentElement;
    pp.children[1].innerText.substring(0, 300)
  `);
  console.log('right panel:', r);

  // 也检查整个页面中是否有翻译结果
  r = await post('/eval?target=CED50A28955615739C06B2A2F1E9C1CF', `
    (function() {
      var ed = document.querySelector("[contenteditable=true]");
      // 看看 siblings 中有没有翻译结果
      var container = ed.closest("[class*='trans']") || ed.parentElement.parentElement.parentElement.parentElement;
      var allText = container.innerText;
      return "container text: " + allText.substring(0, 200);
    })()
  `);
  console.log('container:', r);
}

main().catch(e => console.error(e));
